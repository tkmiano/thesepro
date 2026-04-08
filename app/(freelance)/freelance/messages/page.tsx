import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getConversations } from '@/lib/supabase/message-actions'
import { MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Messages' }

export default async function FreelanceMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const conversations = await getConversations()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-4">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Aucune conversation pour le moment.</p>
          <Link
            href="/freelance/orders"
            className="inline-flex text-sm font-medium text-[#1B3A6B] hover:underline"
          >
            Voir mes commandes →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const initials = conv.otherParticipant.full_name
              .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            const lastMsgText = conv.lastMessage?.content
              ?? (conv.lastMessage?.file_name ? `📎 ${conv.lastMessage.file_name}` : null)
              ?? 'Aucun message'

            return (
              <Link key={conv.id} href={`/freelance/messages/${conv.id}`}>
                <div className={`bg-white rounded-xl border p-4 hover:border-[#1B3A6B]/30 hover:shadow-sm transition-all flex items-center gap-4
                  ${conv.unreadCount > 0 ? 'border-[#1B3A6B]/30 bg-[#E8F0FB]/20' : ''}`}>
                  <div className="w-11 h-11 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
                    {conv.otherParticipant.avatar_url ? (
                      <img src={conv.otherParticipant.avatar_url} alt={conv.otherParticipant.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-[#1B3A6B]">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-[#1B3A6B]' : 'text-[#333]'}`}>
                        {conv.otherParticipant.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-[#333] font-medium' : 'text-muted-foreground'}`}>
                      {lastMsgText}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 bg-[#1B3A6B] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
