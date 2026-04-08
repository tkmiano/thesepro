'use server'

import Stripe from 'stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, COMMISSION_RATE } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import {
  sendOrderConfirmationToClient,
  sendNewOrderToFreelance,
  sendDeliveryNotificationToClient,
  sendPaymentReleasedToFreelance,
} from '@/lib/email/send'
import { createNotification } from '@/lib/supabase/notification-actions'

// ── Types ──────────────────────────────────────────────────────────────────

export type Formula = 'basic' | 'standard' | 'premium'

export interface CreateOrderInput {
  serviceId: string
  formula: Formula
  instructions?: string
  fileUrls?: string[]
}

// ── Créer une commande (statut pending_payment) ────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Charger le service
  const { data: service } = await supabase
    .from('services')
    .select(`
      id, title, freelance_id,
      basic_price, basic_delivery_days,
      standard_price, standard_delivery_days,
      premium_price, premium_delivery_days,
      profiles!freelance_id(id, stripe_account_id, stripe_account_enabled)
    `)
    .eq('id', input.serviceId)
    .eq('is_active', true)
    .single()

  if (!service) return { error: 'Service introuvable' }

  // Prix selon la formule (en euros → centimes)
  const priceMap = {
    basic:    { price: service.basic_price,    days: service.basic_delivery_days },
    standard: { price: service.standard_price, days: service.standard_delivery_days },
    premium:  { price: service.premium_price,  days: service.premium_delivery_days },
  }
  const chosen = priceMap[input.formula]
  if (!chosen?.price) return { error: 'Formule invalide' }

  const amountCents    = Math.round(chosen.price * 100)
  const commissionAmt  = Math.round(amountCents * COMMISSION_RATE)
  const freelanceAmt   = amountCents - commissionAmt

  // Créer le PaymentIntent Stripe
  const freelanceProfile = service.profiles as unknown as {
    id: string
    stripe_account_id: string | null
    stripe_account_enabled: boolean
  }

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount:   amountCents,
    currency: 'eur',
    metadata: {
      service_id:   service.id,
      client_id:    user.id,
      freelance_id: service.freelance_id,
      formula:      input.formula,
    },
    capture_method: 'automatic',
  }

  // Si le freelance a un compte Stripe Connect activé → application_fee
  if (freelanceProfile.stripe_account_id && freelanceProfile.stripe_account_enabled) {
    paymentIntentParams.application_fee_amount = commissionAmt
    paymentIntentParams.transfer_data = {
      destination: freelanceProfile.stripe_account_id,
    }
  }

  const paymentIntent = await stripe().paymentIntents.create(paymentIntentParams)

  // Insérer la commande en BDD
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      client_id:                user.id,
      freelance_id:             service.freelance_id,
      service_id:               service.id,
      formula:                  input.formula,
      instructions:             input.instructions ?? null,
      file_urls:                input.fileUrls ?? [],
      status:                   'pending_payment',
      stripe_payment_intent_id: paymentIntent.id,
      amount:                   amountCents,
      commission_rate:          COMMISSION_RATE,
      commission_amount:        commissionAmt,
      freelance_amount:         freelanceAmt,
      delivery_days:            chosen.days ?? 7,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  return {
    orderId:            order.id,
    clientSecret:       paymentIntent.client_secret,
    amountCents,
  }
}

// ── Confirmer le paiement (appelé depuis le webhook) ──────────────────────
// Utilise le client service role car le webhook n'a aucune session utilisateur.
// Sans service role → RLS bloque l'UPDATE silencieusement (data: null).

export async function markOrderPaid(paymentIntentId: string) {
  // Service role : bypass RLS, accès auth.admin
  const supabase = createServiceClient()

  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select(`
      id, amount, service_id, client_id, freelance_id,
      profiles!client_id(full_name),
      services!service_id(title)
    `)
    .single()

  if (updateError) {
    console.error('[markOrderPaid] UPDATE error:', updateError.message)
    return
  }
  if (!order) {
    console.error('[markOrderPaid] Order not found for payment_intent_id:', paymentIntentId)
    return
  }

  // Incrémenter orders_count du service
  await supabase.rpc('increment_service_orders', { p_service_id: order.service_id })

  // Récupérer les emails via auth.admin (nécessite service role)
  const clientProfile  = order.profiles as unknown as { full_name: string }
  const serviceData    = order.services as unknown as { title: string }

  const [{ data: clientAuth }, { data: freelanceAuth }] = await Promise.all([
    supabase.auth.admin.getUserById(order.client_id),
    supabase.auth.admin.getUserById(order.freelance_id),
  ])

  // Récupérer le nom du freelance séparément
  const { data: freelanceProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', order.freelance_id)
    .single()

  if (clientAuth?.user?.email) {
    sendOrderConfirmationToClient({
      clientName:   clientProfile?.full_name ?? 'Client',
      clientEmail:  clientAuth.user.email,
      serviceTitle: serviceData?.title ?? '',
      orderId:      order.id,
      amount:       order.amount,
    }).catch(console.error)
  }

  if (freelanceAuth?.user?.email) {
    sendNewOrderToFreelance({
      freelanceName:  freelanceProfile?.full_name ?? 'Freelance',
      freelanceEmail: freelanceAuth.user.email,
      serviceTitle:   serviceData?.title ?? '',
      orderId:        order.id,
      amount:         order.amount,
    }).catch(console.error)
  }

  // Notifications in-app
  createNotification({
    userId:  order.client_id,
    type:    'new_order',
    title:   'Paiement confirmé',
    message: `Votre commande "${(order.services as unknown as { title: string })?.title}" a été payée.`,
    link:    `/client/orders/${order.id}`,
  }).catch(console.error)

  createNotification({
    userId:  order.freelance_id,
    type:    'new_order',
    title:   'Nouvelle commande reçue',
    message: `Vous avez reçu une nouvelle commande : "${(order.services as unknown as { title: string })?.title}".`,
    link:    `/freelance/orders/${order.id}`,
  }).catch(console.error)

  revalidatePath('/client/orders')
  revalidatePath('/freelance/orders')
}

// ── Livrer une commande (freelance) ────────────────────────────────────────
// Statuts valides : 'active' (Sprint 1) + 'paid'/'in_progress' (Sprint 3) + 'revision_requested'

export async function deliverOrder(orderId: string, deliveryFileUrl: string, deliveryMessage: string) {
  // Auth via client anon (session cookie)
  const supabaseAnon = await createClient()
  const { data: { user } } = await supabaseAnon.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const supabase = createServiceClient()

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status:            'delivered',
      delivery_file_url: deliveryFileUrl,
      delivery_message:  deliveryMessage || null,
      delivered_at:      new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('freelance_id', user.id)
    .in('status', ['active', 'paid', 'in_progress', 'revision_requested'])
    .select('id, status, client_id, services!service_id(title)')
    .single()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Commande introuvable ou statut invalide (recharger la page)' }

  // Email client (service role → auth.admin disponible)
  try {
    const { data: clientAuth } = await supabase.auth.admin.getUserById(updated.client_id)
    if (clientAuth?.user?.email) {
      sendDeliveryNotificationToClient({
        clientName:   'Client',
        clientEmail:  clientAuth.user.email,
        serviceTitle: (updated.services as unknown as { title: string })?.title ?? '',
        orderId,
      }).catch(console.error)
    }
  } catch (emailErr) {
    console.error('[deliverOrder] Erreur email:', emailErr)
  }

  // Notification in-app au client
  createNotification({
    userId:  updated.client_id,
    type:    'order_delivered',
    title:   'Livraison reçue',
    message: `Votre commande "${(updated.services as unknown as { title: string })?.title}" a été livrée. Vérifiez et validez !`,
    link:    `/client/orders/${orderId}`,
  }).catch(console.error)

  revalidatePath(`/freelance/orders/${orderId}`)
  revalidatePath(`/client/orders/${orderId}`)
  return { success: true }
}

// ── Valider la livraison (client) → libère le paiement ────────────────────

export async function completeOrder(orderId: string) {
  const supabaseAnon = await createClient()
  const { data: { user } } = await supabaseAnon.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const supabase = createServiceClient()

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, stripe_payment_intent_id, freelance_amount, freelance_id, service_id, services!service_id(title), profiles!freelance_id(stripe_account_id, full_name)')
    .eq('id', orderId)
    .eq('client_id', user.id)
    .eq('status', 'delivered')
    .single()

  if (fetchError || !order) return { error: 'Commande introuvable ou non livrée' }

  const freelanceProfile = order.profiles as unknown as {
    stripe_account_id: string | null
    full_name: string
  }

  let transferId: string | null = null

  // Transfer Stripe si le compte Connect est défini
  if (order.stripe_payment_intent_id && freelanceProfile.stripe_account_id) {
    try {
      const transfer = await stripe().transfers.create({
        amount:      order.freelance_amount,
        currency:    'eur',
        destination: freelanceProfile.stripe_account_id,
        metadata:    { order_id: orderId },
      })
      transferId = transfer.id
    } catch (stripeErr) {
      console.error('[Stripe Transfer Error]', stripeErr)
      // On laisse passer — paiement manuel possible
    }
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status:             'completed',
      completed_at:       new Date().toISOString(),
      stripe_transfer_id: transferId,
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  // Email freelance (service role déjà actif)
  try {
    const { data: freelanceAuth } = await supabase.auth.admin.getUserById(order.freelance_id)
    if (freelanceAuth?.user?.email) {
      sendPaymentReleasedToFreelance({
        freelanceName:  freelanceProfile.full_name,
        freelanceEmail: freelanceAuth.user.email,
        serviceTitle:   (order.services as unknown as { title: string })?.title ?? '',
        amount:         order.freelance_amount,
      }).catch(console.error)
    }
  } catch (emailErr) {
    console.error('[completeOrder] Erreur email:', emailErr)
  }

  // Notification in-app au freelance
  createNotification({
    userId:  order.freelance_id,
    type:    'order_completed',
    title:   'Commande terminée',
    message: `Votre livraison a été validée. ${(order.freelance_amount / 100).toFixed(2)} € ont été transférés sur votre compte.`,
    link:    `/freelance/orders/${orderId}`,
  }).catch(console.error)

  revalidatePath(`/client/orders/${orderId}`)
  revalidatePath(`/freelance/orders/${orderId}`)
  return { success: true }
}

// ── Demander une révision (client) ────────────────────────────────────────

export async function requestRevision(orderId: string) {
  const supabaseAnon = await createClient()
  const { data: { user } } = await supabaseAnon.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const supabase = createServiceClient()

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ status: 'revision_requested' })
    .eq('id', orderId)
    .eq('client_id', user.id)
    .eq('status', 'delivered')
    .select('id, freelance_id')
    .single()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Commande introuvable ou non livrée' }

  const rev = updated as unknown as { id: string; freelance_id: string }
  createNotification({
    userId:  rev.freelance_id,
    type:    'revision_requested',
    title:   'Révision demandée',
    message: 'Le client a demandé une révision de votre livraison.',
    link:    `/freelance/orders/${orderId}`,
  }).catch(console.error)

  revalidatePath(`/client/orders/${orderId}`)
  revalidatePath(`/freelance/orders/${orderId}`)
  return { success: true }
}
