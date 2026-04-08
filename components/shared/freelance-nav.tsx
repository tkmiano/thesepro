'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, User, Briefcase, ShoppingBag, MessageSquare, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UnreadBadge } from '@/components/messaging/unread-badge'

const navItems = [
  { href: '/freelance/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/freelance/settings',  label: 'Mon profil',      icon: User },
  { href: '/freelance/services',  label: 'Mes services',    icon: Briefcase },
  { href: '/freelance/orders',    label: 'Commandes',       icon: ShoppingBag },
  { href: '/freelance/messages',  label: 'Messages',        icon: MessageSquare },
  { href: '/freelance/wallet',    label: 'Wallet',           icon: Wallet },
]

interface FreelanceNavProps {
  userId?: string
  unreadMessages?: number
}

export function FreelanceNav({ userId, unreadMessages = 0 }: FreelanceNavProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 min-h-[calc(100vh-4rem)] bg-white border-r">
      <nav className="p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const isMessages = href === '/freelance/messages'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-[#E8F0FB] text-[#1B3A6B]' : 'text-[#555] hover:bg-gray-100',
              )}
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
