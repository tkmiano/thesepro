import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/lib/supabase/actions'
import { BookOpen, LayoutDashboard, Users, ShoppingBag, AlertTriangle, LogOut } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: { default: 'Administration', template: '%s | Admin — ThèsePro' } }

const NAV = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/users',     label: 'Utilisateurs',    icon: Users },
  { href: '/admin/orders',    label: 'Commandes',       icon: ShoppingBag },
  { href: '/admin/disputes',  label: 'Litiges',         icon: AlertTriangle },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#1B3A6B] text-white h-14 flex items-center px-6 gap-4 shadow">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-5 h-5" />
          ThèsePro Admin
        </Link>
        <span className="ml-auto text-sm text-blue-200">{profile?.full_name}</span>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </form>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-white border-r min-h-full pt-4">
          <nav className="flex flex-col gap-0.5 px-3">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-[#E8F0FB] hover:text-[#1B3A6B] transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
