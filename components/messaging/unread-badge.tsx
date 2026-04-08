'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UnreadBadgeProps {
  initialCount: number
  userId:       string
}

export function UnreadBadge({ initialCount, userId }: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`unread-badge:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Incrémenter si le message n'est pas le nôtre
          const msg = payload.new as { sender_id: string; is_read: boolean }
          if (msg.sender_id !== userId && !msg.is_read) {
            setCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { is_read: boolean }
          const old = payload.old as { is_read: boolean }
          if (!old.is_read && msg.is_read) {
            setCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  if (count === 0) return null

  return (
    <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
      {count > 99 ? '99+' : count}
    </span>
  )
}
