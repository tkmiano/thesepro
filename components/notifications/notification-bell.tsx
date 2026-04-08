'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/supabase/notification-actions'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type Notification = {
  id:         string
  type:       string
  title:      string
  message:    string
  link:       string | null
  is_read:    boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  new_message:        '💬',
  new_order:          '🛒',
  order_delivered:    '📦',
  order_completed:    '✅',
  revision_requested: '🔄',
}

interface NotificationBellProps {
  initialCount: number
  userId:       string
}

export function NotificationBell({ initialCount, userId }: NotificationBellProps) {
  const [unread, setUnread]       = useState(initialCount)
  const [notifs, setNotifs]       = useState<Notification[]>([])
  const [open, setOpen]           = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Abonnement Realtime sur les nouvelles notifications
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setUnread(prev => prev + 1)
          setNotifs(prev => [payload.new as Notification, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // Charger les notifications à l'ouverture du dropdown
  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen && notifs.length === 0) {
      const data = await getRecentNotifications()
      setNotifs(data as Notification[])
    }
  }

  async function handleClick(notif: Notification) {
    if (!notif.is_read) {
      await markNotificationRead(notif.id)
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      setUnread(prev => Math.max(0, prev - 1))
    }
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors outline-none">
        <Bell className="w-5 h-5 text-[#555]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold text-[#1B3A6B]">Notifications</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-[#2E6DB4] hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifs.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifs.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`px-3 py-3 cursor-pointer flex gap-3 items-start ${
                !notif.is_read ? 'bg-[#E8F0FB]/50' : ''
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">
                {TYPE_ICON[notif.type] ?? '🔔'}
              </span>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className={`text-xs leading-snug ${!notif.is_read ? 'font-semibold text-[#1B3A6B]' : 'text-[#333]'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-[#1B3A6B] shrink-0 mt-1.5" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
