'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/supabase/order-actions'
import { OrderFileUpload } from './order-file-upload'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Formula = 'basic' | 'standard' | 'premium'

interface FormulaInfo {
  label:         string
  price:         number
  delivery_days: number
  description:   string | null
}

interface NewOrderFormProps {
  userId:      string
  serviceId:   string
  serviceTitle: string
  formula:     Formula
  formulaInfo: FormulaInfo
}

export function NewOrderForm({
  userId,
  serviceId,
  serviceTitle,
  formula,
  formulaInfo,
}: NewOrderFormProps) {
  const router = useRouter()
  const [instructions, setInstructions] = useState('')
  const [fileUrls, setFileUrls]         = useState<string[]>([])
  const [loading, setLoading]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createOrder({
      serviceId,
      formula,
      instructions: instructions.trim() || undefined,
      fileUrls,
    })

    if ('error' in result) {
      toast.error(result.error ?? 'Erreur lors de la commande')
      setLoading(false)
      return
    }

    // Redirige vers la page de paiement avec le clientSecret en param
    router.push(
      `/client/order/payment/${result.orderId}?cs=${encodeURIComponent(result.clientSecret ?? '')}&amount=${result.amountCents}`
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Récapitulatif formule */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold text-[#1B3A6B]">Récapitulatif</h2>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-[#333]">{serviceTitle}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Formule {formulaInfo.label}</p>
            {formulaInfo.description && (
              <p className="text-xs text-muted-foreground mt-1">{formulaInfo.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-[#1B3A6B]">{formulaInfo.price} €</p>
            <p className="text-xs text-muted-foreground">{formulaInfo.delivery_days} jour{formulaInfo.delivery_days > 1 ? 's' : ''} de délai</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
            Instructions pour le freelance
          </label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={5}
            placeholder="Décrivez précisément votre besoin : sujet, niveau académique, contraintes spécifiques, style attendu…"
            className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
          />
        </div>

        {/* Fichiers joints */}
        <div>
          <p className="text-sm font-medium text-[#1B3A6B] mb-1.5">Fichiers joints (optionnel)</p>
          <p className="text-xs text-muted-foreground mb-2">
            Partagez vos documents de référence, plan de thèse, données…
          </p>
          <OrderFileUpload
            userId={userId}
            onUpload={setFileUrls}
            maxFiles={5}
          />
        </div>
      </div>

      {/* CTA */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4] py-3 text-base font-semibold"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Préparation du paiement…</>
        ) : (
          `Continuer vers le paiement — ${formulaInfo.price} €`
        )}
      </Button>
    </form>
  )
}
