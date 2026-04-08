'use client'

import { useState } from 'react'
import { ReviewForm } from '@/components/reviews/review-form'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReviewTriggerProps {
  orderId:      string
  serviceTitle: string
}

export function ReviewTrigger({ orderId, serviceTitle }: ReviewTriggerProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#C9963A] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#b8872f] transition-colors"
      >
        <Star className="w-4 h-4" /> Laisser un avis
      </button>
      {open && (
        <ReviewForm
          orderId={orderId}
          serviceTitle={serviceTitle}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
