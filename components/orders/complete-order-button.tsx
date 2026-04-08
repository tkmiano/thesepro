'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { completeOrder } from '@/lib/supabase/order-actions'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CompleteOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleComplete() {
    if (!confirm('Confirmer la réception et valider la livraison ? Le paiement sera libéré au freelance.')) return
    setLoading(true)
    try {
      const result = await completeOrder(orderId)
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur', { duration: 8000 })
      } else {
        toast.success('Commande validée ! Le paiement a été libéré.')
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inattendue', { duration: 8000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CheckCircle className="w-4 h-4 mr-2" />
      )}
      Valider la livraison
    </Button>
  )
}
