'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { revalidatePath } from 'next/cache'

// ── Helper : message d'erreur Stripe lisible ──────────────────────────────

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const se = err as Record<string, unknown>
    if (typeof se.message === 'string') return se.message
    if (typeof se.raw === 'object' && se.raw) {
      const raw = se.raw as Record<string, unknown>
      if (typeof raw.message === 'string') return raw.message
    }
  }
  return String(err)
}

// ── Créer un compte Stripe Connect Express ────────────────────────────────

export async function createStripeConnectAccount() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return { error: 'Configuration serveur manquante (STRIPE_SECRET_KEY)' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable' }

  let accountId = profile.stripe_account_id

  if (!accountId) {
    try {
      const account = await stripe().accounts.create({
        type:          'express',
        country:       'FR',
        capabilities:  {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        business_type: 'individual',
        metadata:      { supabase_user_id: user.id },
      })
      accountId = account.id

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)

      if (dbError) {
        console.error('[Stripe Connect] Supabase update error:', dbError.message)
      }
    } catch (err) {
      const msg = stripeErrorMessage(err)
      console.error('[Stripe Connect] accounts.create error:', msg)
      return { error: `Impossible de créer le compte Stripe : ${msg}` }
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const accountLink = await stripe().accountLinks.create({
      account:     accountId,
      refresh_url: `${appUrl}/freelance/settings?stripe=refresh`,
      return_url:  `${appUrl}/api/stripe/connect/callback?account_id=${accountId}`,
      type:        'account_onboarding',
    })
    return { url: accountLink.url }
  } catch (err) {
    const msg = stripeErrorMessage(err)
    console.error('[Stripe Connect] accountLinks.create error:', msg)
    return { error: `Impossible de générer le lien Stripe : ${msg}` }
  }
}

// ── Vérifier le statut du compte Connect ─────────────────────────────────

export async function getConnectAccountStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_account_enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return { status: 'none' as const }
  }

  try {
    const account = await stripe().accounts.retrieve(profile.stripe_account_id)
    const enabled = account.charges_enabled && account.payouts_enabled

    if (enabled && !profile.stripe_account_enabled) {
      await supabase
        .from('profiles')
        .update({ stripe_account_enabled: true })
        .eq('id', user.id)
    }

    return {
      status:           enabled ? ('active' as const) : ('pending' as const),
      chargesEnabled:   account.charges_enabled,
      payoutsEnabled:   account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    }
  } catch (err) {
    console.error('[Stripe Connect] getConnectAccountStatus error:', stripeErrorMessage(err))
    return { status: 'error' as const }
  }
}

// ── Mettre à jour le statut après callback ────────────────────────────────

export async function syncConnectAccountStatus(accountId: string) {
  const supabase = await createClient()

  try {
    const account = await stripe().accounts.retrieve(accountId)
    const enabled = account.charges_enabled && account.payouts_enabled

    await supabase
      .from('profiles')
      .update({ stripe_account_enabled: enabled })
      .eq('stripe_account_id', accountId)

    revalidatePath('/freelance/settings')
  } catch (err) {
    console.error('[Stripe Connect] syncConnectAccountStatus error:', stripeErrorMessage(err))
  }
}
