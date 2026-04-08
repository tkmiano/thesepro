'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, Loader2 } from 'lucide-react'
import { getOrCreateConversation } from '@/lib/supabase/message-actions'
import { toast } from 'sonner'

interface Formula {
  label:         string
  price:         number
  delivery_days: number
  description:   string | null
}

interface FormulaSelectorProps {
  serviceId:    string
  freelanceId:  string
  currentUserId?: string | null
  basic:    Formula
  standard: Formula | null
  premium:  Formula | null
}

export function FormulaSelector({ serviceId, freelanceId, currentUserId, basic, standard, premium }: FormulaSelectorProps) {
  const router = useRouter()
  const [contacting, setContacting] = useState(false)

  const formulas = [
    { key: 'basic',    data: basic,    label: 'Basique'   },
    ...(standard ? [{ key: 'standard', data: standard, label: 'Standard' }] : []),
    ...(premium  ? [{ key: 'premium',  data: premium,  label: 'Premium'  }] : []),
  ] as const

  const [selected, setSelected] = useState<string>('basic')
  const current = formulas.find(f => f.key === selected)?.data ?? basic

  function handleOrder() {
    if (!currentUserId) { router.push('/login'); return }
    router.push(`/client/order/new?service=${serviceId}&formula=${selected}`)
  }

  async function handleContact() {
    if (!currentUserId) { router.push('/login'); return }
    setContacting(true)
    try {
      const result = await getOrCreateConversation(freelanceId)
      if ('error' in result) { toast.error(result.error); return }
      router.push(`/client/messages/${result.conversationId}`)
    } finally {
      setContacting(false)
    }
  }

  return (
    <div className="border rounded-xl p-6 space-y-5 sticky top-24 bg-white">
      {/* Tab formules */}
      {formulas.length > 1 && (
        <div className="flex rounded-lg overflow-hidden border bg-gray-50">
          {formulas.map(f => (
            <button
              key={f.key}
              onClick={() => setSelected(f.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                selected === f.key
                  ? 'bg-[#1B3A6B] text-white'
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Prix + délai */}
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-[#1B3A6B]">{current.price} €</span>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          {current.delivery_days} jour{current.delivery_days > 1 ? 's' : ''}
        </div>
      </div>

      {/* Description formule */}
      {current.description && (
        <p className="text-sm text-muted-foreground">{current.description}</p>
      )}

      {/* Inclus */}
      <ul className="space-y-2">
        {[
          '1 livraison incluse',
          'Support par messagerie',
          `Délai garanti : ${current.delivery_days}j`,
        ].map(item => (
          <li key={item} className="flex items-center gap-2 text-sm text-[#555]">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleOrder}
          className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:bg-[#2E6DB4] transition-colors"
        >
          Commander — {current.price} €
        </button>
        <button
          onClick={handleContact}
          disabled={contacting}
          className="w-full py-3 border border-[#1B3A6B] text-[#1B3A6B] rounded-lg font-medium hover:bg-[#E8F0FB] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {contacting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Contacter le freelance'}
        </button>
      </div>
    </div>
  )
}
