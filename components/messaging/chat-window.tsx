'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { markMessagesRead } from '@/lib/supabase/message-actions'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'

interface MessageRow {
  id:         string
  content:    string | null
  file_url:   string | null
  file_name:  string | null
  file_size:  number | null
  is_read:    boolean
  created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null } | null
}

interface ChatWindowProps {
  conversationId: string
  initialMessages: MessageRow[]
  currentUserId:  string
}

export function ChatWindow({ conversationId, initialMessages, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()

  // Scroll vers le bas
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Marquer les messages comme lus à l'ouverture
  useEffect(() => {
    markMessagesRead(conversationId).catch(console.error)
    scrollToBottom('instant')
  }, [conversationId, scrollToBottom])

  // Abonnement Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as MessageRow

          // Récupérer le profil de l'expéditeur
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', (payload.new as { sender_id: string }).sender_id)
            .single()

          const enriched: MessageRow = { ...newMsg, sender }
          setMessages(prev => {
            // Éviter les doublons si le message vient de nous
            if (prev.find(m => m.id === enriched.id)) return prev
            return [...prev, enriched]
          })

          // Marquer comme lu si c'est un message reçu
          if ((payload.new as { sender_id: string }).sender_id !== currentUserId) {
            markMessagesRead(conversationId).catch(console.error)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId, supabase])

  // Scroll quand un nouveau message arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  return (
    <div className="flex flex-col h-full">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Aucun message pour l&apos;instant.<br />
              Envoyez le premier message !
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              fileUrl={msg.file_url}
              fileName={msg.file_name}
              fileSize={msg.file_size}
              createdAt={msg.created_at}
              isMine={msg.sender?.id === currentUserId}
              senderName={msg.sender?.full_name ?? 'Utilisateur'}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversationId}
        userId={currentUserId}
      />
    </div>
  )
}
