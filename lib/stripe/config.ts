import Stripe from 'stripe'

// Lazy singleton — évite un crash au build si STRIPE_SECRET_KEY n'est pas défini.
// Exporté comme fonction stripe() pour garantir que `this` est toujours
// l'instance réelle Stripe (évite les problèmes avec le pattern Proxy).

let _instance: Stripe | null = null

export function stripe(): Stripe {
  if (_instance) return _instance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _instance = new Stripe(key, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
  return _instance
}

export const COMMISSION_RATE        = 0.20  // 20 %
export const PLATFORM_FEE_PERCENT   = 20
