'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Search, MessageSquare } from 'lucide-react'
import { UnreadBadge } from '@/components/messaging/unread-badge'

const NAV_ITEMS = [
  { href: '/client/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/client/orders',    label: 'Mes commandes',   icon: ShoppingBag },
  { href: '/client/messages',  label: 'Messages',        icon: MessageSquare },
  { href: '/services',         label: 'Explorer',        icon: Search },
]

interface ClientNavProps {
  userId?: string
  unreadMessages?: number
}

export function ClientNav({ userId, unreadMessages = 0 }: ClientNavProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-white border-r min-h-full pt-6 pb-10 hidden md:flex flex-col">
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isMessages = href === '/client/messages'
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-[#E8F0FB] text-[#1B3A6B]'
                  : 'text-muted-foreground hover:bg-[#F5F5F5] hover:text-[#1B3A6B]'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isMessages && userId && (
                <UnreadBadge initialCount={unreadMessages} userId={userId} />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
