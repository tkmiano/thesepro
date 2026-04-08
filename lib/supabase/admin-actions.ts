'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import { sendDiplomaVerifiedEmail } from '@/lib/email/send'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', user: null, supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Accès refusé', user: null, supabase: null }

  return { error: null, user, supabase }
}

// ── KPIs dashboard ────────────────────────────────────────────────────────

export async function getAdminKPIs() {
  const { error } = await requireAdmin()
  if (error) return null

  const supabase = createServiceClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalUsers },
    { count: newUsersMonth },
    { count: totalOrders },
    { count: ordersMonth },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('orders').select('commission_amount').eq('status', 'completed'),
  ])

  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + (o.commission_amount ?? 0), 0)

  return {
    totalUsers:     totalUsers ?? 0,
    newUsersMonth:  newUsersMonth ?? 0,
    totalOrders:    totalOrders ?? 0,
    ordersMonth:    ordersMonth ?? 0,
    totalRevenue,
  }
}

// ── Top services ──────────────────────────────────────────────────────────

export async function getTopServices(limit = 5) {
  const { error } = await requireAdmin()
  if (error) return []

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('services')
    .select('id, title, orders_count, avg_rating, profiles!freelance_id(full_name)')
    .order('orders_count', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ── Users list ────────────────────────────────────────────────────────────

export async function getAdminUsers(page = 1, role?: string, search?: string) {
  const { error } = await requireAdmin()
  if (error) return { users: [], total: 0 }

  const supabase = createServiceClient()
  const perPage = 20
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, diploma_verified, created_at, avg_rating, total_reviews', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (role) query = query.eq('role', role)
  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data, count } = await query
  return { users: data ?? [], total: count ?? 0 }
}

// ── Vérifier diplôme ──────────────────────────────────────────────────────

export async function verifyDiploma(userId: string) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  await supabase
    .from('profiles')
    .update({ diploma_verified: true })
    .eq('id', userId)

  // Email + notification
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  if (authUser?.user?.email && profile?.full_name) {
    sendDiplomaVerifiedEmail({
      freelanceName:  profile.full_name,
      freelanceEmail: authUser.user.email,
    }).catch(console.error)
  }

  revalidatePath('/admin/users')
  return { success: true }
}

// ── Suspendre utilisateur ─────────────────────────────────────────────────

export async function suspendUser(userId: string) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const supabase = createServiceClient()
  await supabase.auth.admin.updateUserById(userId, { ban_duration: '87600h' })  // 10 ans ≈ perm

  revalidatePath('/admin/users')
  return { success: true }
}

// ── Admin orders ──────────────────────────────────────────────────────────

export async function getAdminOrders(page = 1, status?: string) {
  const { error } = await requireAdmin()
  if (error) return { orders: [], total: 0 }

  const supabase = createServiceClient()
  const perPage = 20
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = supabase
    .from('orders')
    .select(`
      id, status, amount, formula, created_at, paid_at,
      services!service_id(title),
      client:profiles!client_id(full_name),
      freelance:profiles!freelance_id(full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)

  const { data, count } = await query
  return { orders: data ?? [], total: count ?? 0 }
}

// ── Disputes ──────────────────────────────────────────────────────────────

export async function getDisputedOrders() {
  const { error } = await requireAdmin()
  if (error) return []

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, amount, freelance_amount, stripe_payment_intent_id,
      created_at, paid_at,
      services!service_id(title),
      client:profiles!client_id(id, full_name),
      freelance:profiles!freelance_id(id, full_name, stripe_account_id)
    `)
    .eq('status', 'disputed')
    .order('created_at', { ascending: false })

  return data ?? []
}

// ── Rembourser le client (dispute) ────────────────────────────────────────

export async function refundClientDispute(orderId: string) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('stripe_payment_intent_id, amount')
    .eq('id', orderId)
    .eq('status', 'disputed')
    .single()

  if (!order?.stripe_payment_intent_id) return { error: 'Commande introuvable' }

  try {
    await stripe().refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    })

    await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', orderId)

    revalidatePath('/admin/disputes')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur Stripe'
    return { error: msg }
  }
}

// ── Libérer le paiement au freelance (dispute) ────────────────────────────

export async function releasePaymentDispute(orderId: string) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const supabase = createServiceClient()
  const { data: order } = await supabase
    .from('orders')
    .select('freelance_amount, freelance_id, profiles!freelance_id(stripe_account_id)')
    .eq('id', orderId)
    .eq('status', 'disputed')
    .single()

  if (!order) return { error: 'Commande introuvable' }

  const fp = order.profiles as unknown as { stripe_account_id: string | null }

  if (fp?.stripe_account_id) {
    try {
      await stripe().transfers.create({
        amount:      order.freelance_amount,
        currency:    'eur',
        destination: fp.stripe_account_id,
        metadata:    { order_id: orderId, type: 'dispute_release' },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur Stripe'
      return { error: msg }
    }
  }

  await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', orderId)

  revalidatePath('/admin/disputes')
  return { success: true }
}
