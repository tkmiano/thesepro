import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getMessages } from '@/lib/supabase/message-actions'
import { ChatWindow } from '@/components/messaging/chat-window'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conversation' }

export default async function ClientConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Charger les données de la conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_1:profiles!participant_1_id(id, full_name, avatar_url),
      participant_2:profiles!participant_2_id(id, full_name, avatar_url)
    `)
    .eq('id', conversationId)
    .single()

  if (!conv) notFound()

  const p1 = conv.participant_1 as unknown as { id: string; full_name: string; avatar_url: string | null }
  const p2 = conv.participant_2 as unknown as { id: string; full_name: string; avatar_url: string | null }
  const isParticipant = p1.id === user.id || p2.id === user.id
  if (!isParticipant) notFound()

  const otherUser = p1.id === user.id ? p2 : p1
  const initials  = otherUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const { messages, currentUserId } = await getMessages(conversationId)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border overflow-hidden">
      {/* Header conversation */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
        <Link href="/client/messages" className="text-muted-foreground hover:text-[#1B3A6B] p-1 -ml-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
          {otherUser.avatar_url ? (
            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-[#1B3A6B]">{initials}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-[#1B3A6B] text-sm">{otherUser.full_name}</p>
        </div>
      </div>

      {/* Chat window (client component avec Realtime) */}
      <ChatWindow
        conversationId={conversationId}
        initialMessages={messages as unknown as Parameters<typeof ChatWindow>[0]['initialMessages']}
        currentUserId={currentUserId}
      />
    </div>
  )
}
