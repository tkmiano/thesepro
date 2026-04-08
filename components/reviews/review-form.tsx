'use client'

import { useState } from 'react'
import { StarRating } from './star-rating'
import { createReview } from '@/lib/supabase/review-actions'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewFormProps {
  orderId:      string
  serviceTitle: string
  onClose:      () => void
  onSuccess:    () => void
}

export function ReviewForm({ orderId, serviceTitle, onClose, onSuccess }: ReviewFormProps) {
  const [rating,        setRating]        = useState(0)
  const [quality,       setQuality]       = useState(0)
  const [communication, setCommunication] = useState(0)
  const [delay,         setDelay]         = useState(0)
  const [comment,       setComment]       = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Veuillez attribuer une note globale'); return }
    if (comment.length < 20) { toast.error('Le commentaire doit contenir au moins 20 caractères'); return }

    setSubmitting(true)
    try {
      const result = await createReview({
        orderId,
        rating,
        qualityRating:       quality || undefined,
        communicationRating: communication || undefined,
        delayRating:         delay || undefined,
        comment,
      })
      if ('error' in result) {
        toast.error(result.error, { duration: 8000 })
        return
      }
      toast.success('Merci pour votre avis !')
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <div>
            <h2 className="font-bold text-[#1B3A6B] text-lg">Laisser un avis</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{serviceTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-[#333] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Note globale */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#1B3A6B]">
              Note globale <span className="text-red-500">*</span>
            </label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Sous-critères */}
          <div className="grid grid-cols-3 gap-4 bg-[#F5F5F5] rounded-xl p-4">
            {[
              { label: 'Qualité',        value: quality,       set: setQuality },
              { label: 'Communication',  value: communication, set: setCommunication },
              { label: 'Délais',         value: delay,         set: setDelay },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-[#555]">{label}</span>
                <StarRating value={value} onChange={set} size="sm" />
              </div>
            ))}
          </div>

          {/* Commentaire */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#1B3A6B]">
              Commentaire <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Partagez votre expérience en détail… (min. 20 caractères)"
              className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
            />
            <p className={`text-xs text-right ${comment.length < 20 ? 'text-muted-foreground' : 'text-green-600'}`}>
              {comment.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#1B3A6B] hover:bg-[#2E6DB4]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier l\'avis'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
