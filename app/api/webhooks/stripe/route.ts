import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/config'
import { markOrderPaid } from '@/lib/supabase/order-actions'
import { syncConnectAccountStatus } from '@/lib/supabase/stripe-actions'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Webhook] Signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        await markOrderPaid(paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const supabase = createServiceClient()
        await supabase
          .from('orders')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .eq('status', 'pending_payment')
        break
      }

      case 'account.updated': {
        const account = event.data.object
        await syncConnectAccountStatus(account.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[Webhook] Handler error for event', event.type, ':', err)
    // Return 200 to prevent Stripe retries for non-fatal errors
  }

  return NextResponse.json({ received: true })
}
