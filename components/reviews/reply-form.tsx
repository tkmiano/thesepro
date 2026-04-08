'use client'

import { useState } from 'react'
import { addFreelanceReply } from '@/lib/supabase/review-actions'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ReplyForm({ reviewId }: { reviewId: string }) {
  const [open,        setOpen]        = useState(false)
  const [reply,       setReply]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSubmitting(true)
    try {
      const result = await addFreelanceReply(reviewId, reply)
      if ('error' in result) {
        toast.error(result.error, { duration: 8000 })
        return
      }
      toast.success('Réponse publiée.')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#2E6DB4] hover:underline"
      >
        <MessageSquare className="w-3.5 h-3.5" /> Répondre à cet avis
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={reply}
        onChange={e => setReply(e.target.value)}
        rows={3}
        maxLength={300}
        placeholder="Répondez à cet avis… (max 300 caractères)"
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{reply.length}/300</span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={submitting || !reply.trim()} className="bg-[#1B3A6B] hover:bg-[#2E6DB4]">
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Publier'}
          </Button>
        </div>
      </div>
    </form>
  )
}
