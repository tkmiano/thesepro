'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestRevision } from '@/lib/supabase/order-actions'
import { RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RequestRevisionButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRevision() {
    if (!confirm('Demander une révision ? Le freelance sera notifié.')) return
    setLoading(true)
    try {
      const result = await requestRevision(orderId)
      if ('error' in result) {
        toast.error(result.error ?? 'Erreur', { duration: 8000 })
      } else {
        toast.success('Demande de révision envoyée.')
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
      onClick={handleRevision}
      disabled={loading}
      variant="outline"
      className="border-orange-300 text-orange-700 hover:bg-orange-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <RotateCcw className="w-4 h-4 mr-2" />
      )}
      Demander une révision
    </Button>
  )
}
