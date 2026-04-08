'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateConversation } from '@/lib/supabase/message-actions'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContactButtonProps {
  otherUserId:  string
  redirectBase: '/client/messages' | '/freelance/messages'
}

export function ContactButton({ otherUserId, redirectBase }: ContactButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      const result = await getOrCreateConversation(otherUserId)
      if ('error' in result) { toast.error(result.error); return }
      router.push(`${redirectBase}/${result.conversationId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 border border-[#1B3A6B] text-[#1B3A6B] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#E8F0FB] transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
      Contacter
    </button>
  )
}
