'use client'

import { useState } from 'react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/client'
import { Button } from '@/components/ui/button'
import { Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ── Inner form (needs Stripe context) ─────────────────────────────────────

interface InnerFormProps {
  clientSecret: string
  orderId: string
  amountCents: number
  serviceTitle: string
}

function InnerPaymentForm({ clientSecret, orderId, amountCents, serviceTitle }: InnerFormProps) {
  const stripe   = useStripe()
  const elements = useElements()
  const router   = useRouter()
  const [loading, setLoading] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setCardError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    })

    if (error) {
      setCardError(error.message ?? 'Erreur de paiement')
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      toast.success('Paiement confirmé !')
      router.push(`/client/orders/${orderId}?paid=1`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#1B3A6B]">Informations de paiement</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Sécurisé par Stripe
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#333]">Numéro de carte</p>
          <div className="border rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-[#1B3A6B]/20 focus-within:border-[#1B3A6B]">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize:        '14px',
                    color:           '#333',
                    fontFamily:      'system-ui, sans-serif',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#e74c3c' },
                },
              }}
            />
          </div>
          {cardError && (
            <p className="text-red-500 text-xs mt-1">{cardError}</p>
          )}
        </div>

        {/* Récapitulatif */}
        <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{serviceTitle}</span>
            <span className="font-medium">{(amountCents / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-[#1B3A6B] border-t pt-2 mt-2">
            <span>Total</span>
            <span>{(amountCents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4] text-white py-3 text-base font-semibold"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Paiement en cours…</>
        ) : (
          <><Lock className="w-4 h-4 mr-2" /> Payer {(amountCents / 100).toFixed(2)} €</>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Paiement 100% sécurisé. Vos données bancaires ne sont jamais stockées sur nos serveurs.
      </p>
    </form>
  )
}

// ── Wrapper avec provider Elements ────────────────────────────────────────

interface PaymentFormProps {
  clientSecret: string
  orderId: string
  amountCents: number
  serviceTitle: string
}

export function PaymentForm({ clientSecret, orderId, amountCents, serviceTitle }: PaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#1B3A6B' },
        },
      }}
    >
      <InnerPaymentForm
        clientSecret={clientSecret}
        orderId={orderId}
        amountCents={amountCents}
        serviceTitle={serviceTitle}
      />
    </Elements>
  )
}
