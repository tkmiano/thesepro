'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Balance Stripe Connect du freelance ───────────────────────────────────

export async function getFreelanceBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_account_enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id || !profile.stripe_account_enabled) {
    return { available: 0, pending: 0, hasStripe: false }
  }

  try {
    const balance = await stripe().balance.retrieve({
      stripeAccount: profile.stripe_account_id,
    })

    const eur = (list: { currency: string; amount: number }[]) =>
      list.find(b => b.currency === 'eur')?.amount ?? 0

    return {
      available:  eur(balance.available),
      pending:    eur(balance.pending),
      hasStripe:  true,
      accountId:  profile.stripe_account_id,
    }
  } catch (err) {
    console.error('[getFreelanceBalance]', err)
    return { available: 0, pending: 0, hasStripe: true, error: 'Impossible de récupérer le solde Stripe' }
  }
}

// ── Historique des commandes complétées (gains) ──────────────────────────

export async function getFreelanceEarnings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('orders')
    .select(`
      id, amount, freelance_amount, commission_amount,
      completed_at, created_at,
      services!service_id(title)
    `)
    .eq('freelance_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  return data ?? []
}

// ── Demandes de retrait ───────────────────────────────────────────────────

export async function getWithdrawalRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('withdrawal_requests')
    .select('id, amount, status, created_at, processed_at, admin_note')
    .eq('freelance_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

// ── Créer une demande de retrait ──────────────────────────────────────────

const WithdrawalSchema = z.object({
  amount: z.number().int().min(2000, 'Montant minimum : 20 €').max(100000, 'Montant maximum : 1 000 €'),
  iban:   z.string().min(15, 'IBAN invalide').max(34, 'IBAN invalide').regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, 'Format IBAN invalide').optional().or(z.literal('')),
})

export async function requestWithdrawal(input: { amount: number; iban?: string }) {
  const parsed = WithdrawalSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier le rôle freelance
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'freelance' && profile.role !== 'both')) {
    return { error: 'Accès réservé aux freelances' }
  }

  // Vérifier qu'il n'y a pas déjà une demande pending
  const { count } = await supabase
    .from('withdrawal_requests')
    .select('id', { count: 'exact', head: true })
    .eq('freelance_id', user.id)
    .eq('status', 'pending')

  if ((count ?? 0) > 0) {
    return { error: 'Vous avez déjà une demande de retrait en cours' }
  }

  const { error } = await supabase
    .from('withdrawal_requests')
    .insert({
      freelance_id: user.id,
      amount:       parsed.data.amount,
      iban:         parsed.data.iban || null,
    })

  if (error) return { error: error.message }

  // Notification admin via service role
  const adminSupabase = createServiceClient()
  void adminSupabase.from('notifications').insert({
    user_id: user.id,
    type:    'new_order',
    title:   'Demande de retrait',
    message: `${profile.full_name} demande un retrait de ${(parsed.data.amount / 100).toFixed(2)} €`,
    link:    '/admin/dashboard',
    is_read: false,
  })

  revalidatePath('/freelance/wallet')
  return { success: true }
}
