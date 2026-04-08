'use client'

import { useState } from 'react'
import { refundClientDispute, releasePaymentDispute } from '@/lib/supabase/admin-actions'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AdminDisputeActionsProps {
  orderId:          string
  hasStripeAccount: boolean
}

export function AdminDisputeActions({ orderId, hasStripeAccount }: AdminDisputeActionsProps) {
  const [refunding,  setRefunding]  = useState(false)
  const [releasing,  setReleasing]  = useState(false)
  const [resolved,   setResolved]   = useState(false)
  const router = useRouter()

  async function handleRefund() {
    if (!confirm('Rembourser intégralement le client via Stripe ?')) return
    setRefunding(true)
    try {
      const r = await refundClientDispute(orderId)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      toast.success('Client remboursé !')
      setResolved(true)
      router.refresh()
    } finally {
      setRefunding(false)
    }
  }

  async function handleRelease() {
    if (!confirm('Libérer le paiement au freelance ?')) return
    setReleasing(true)
    try {
      const r = await releasePaymentDispute(orderId)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      toast.success('Paiement libéré au freelance !')
      setResolved(true)
      router.refresh()
    } finally {
      setReleasing(false)
    }
  }

  if (resolved) {
    return <p className="text-sm text-green-600 font-medium">✓ Litige résolu</p>
  }

  return (
    <div className="flex gap-3 pt-2 border-t">
      <button
        onClick={handleRefund}
        disabled={refunding || releasing}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
        Rembourser le client
      </button>
      <button
        onClick={handleRelease}
        disabled={refunding || releasing || !hasStripeAccount}
        title={!hasStripeAccount ? 'Le freelance n\'a pas de compte Stripe' : undefined}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Libérer au freelance
      </button>
    </div>
  )
}
