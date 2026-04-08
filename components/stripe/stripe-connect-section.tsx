'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createStripeConnectAccount } from '@/lib/supabase/stripe-actions'
import { toast } from 'sonner'

interface StripeConnectSectionProps {
  status: 'none' | 'pending' | 'active' | 'error'
  detailsSubmitted?: boolean
}

export function StripeConnectSection({ status: initialStatus, detailsSubmitted }: StripeConnectSectionProps) {
  const [status, setStatus]   = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      const result = await createStripeConnectAccount()

      if ('error' in result && result.error) {
        // Affiche le message d'erreur exact retourné par la Server Action
        toast.error(result.error, { duration: 8000 })
        console.error('[StripeConnect] Erreur server action :', result.error)
        return
      }

      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }

      toast.error('Réponse inattendue du serveur')
    } catch (err) {
      // Ne devrait normalement pas arriver — la SA retourne { error } au lieu de throw
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[StripeConnect] Exception inattendue :', msg)
      toast.error(`Erreur inattendue : ${msg}`, { duration: 8000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        {/* Stripe logo */}
        <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div>
          <h3 className="font-semibold text-[#1B3A6B]">Paiements Stripe Connect</h3>
          <p className="text-xs text-muted-foreground">Recevez vos revenus directement sur votre compte</p>
        </div>
      </div>

      {status === 'active' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">Compte actif</p>
            <p className="text-xs text-green-700 mt-0.5">Vous pouvez recevoir des paiements.</p>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Vérification en cours</p>
            <p className="text-xs mt-0.5">
              {detailsSubmitted
                ? 'Stripe vérifie vos informations. Cela peut prendre quelques jours.'
                : 'Vous devez compléter votre profil Stripe pour recevoir des paiements.'}
            </p>
          </div>
        </div>
      )}

      {status === 'none' && (
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Pour recevoir vos paiements, connectez votre compte Stripe Express.</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>Commission ThèsePro : <strong>20%</strong></li>
            <li>Vous recevez : <strong>80%</strong> du montant</li>
            <li>Virement automatique sur votre compte bancaire</li>
          </ul>
        </div>
      )}

      {(status === 'none' || status === 'pending') && (
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="bg-[#635BFF] hover:bg-[#5851DB] text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          {status === 'none' ? 'Connecter Stripe' : 'Compléter mon profil Stripe'}
        </Button>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Erreur de connexion à Stripe. Réessayez plus tard.
        </div>
      )}
    </div>
  )
}
