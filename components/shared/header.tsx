import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/supabase/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { getUnreadNotificationCount } from '@/lib/supabase/notification-actions'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let unreadNotifications = 0
  if (user) {
    const [{ data }, count] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single(),
      getUnreadNotificationCount(),
    ])
    profile = data
    unreadNotifications = count
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-[#1B3A6B]" />
          <span className="text-xl font-bold text-[#1B3A6B]">ThèsePro</span>
        </Link>

        {/* Navigation principale */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/services" className="text-sm font-medium text-[#555555] hover:text-[#1B3A6B] transition-colors">
            Services
          </Link>
          <Link href="/freelances" className="text-sm font-medium text-[#555555] hover:text-[#1B3A6B] transition-colors">
            Freelances
          </Link>
          <Link href="/comment-ca-marche" className="text-sm font-medium text-[#555555] hover:text-[#1B3A6B] transition-colors">
            Comment ça marche
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user && profile && (
            <NotificationBell initialCount={unreadNotifications} userId={user.id} />
          )}
          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity outline-none">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
                  <AvatarFallback className="bg-[#E8F0FB] text-[#1B3A6B] font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-[#1B3A6B]">
                  {profile.full_name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(profile.role === 'client' || profile.role === 'both') && (
                  <>
                    <DropdownMenuItem render={<Link href="/client/dashboard" />}>
                      Mon espace client
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/client/orders" />}>
                      Mes commandes
                    </DropdownMenuItem>
                  </>
                )}
                {(profile.role === 'freelance' || profile.role === 'both') && (
                  <>
                    <DropdownMenuItem render={<Link href="/freelance/dashboard" />}>
                      Mon espace freelance
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/freelance/services" />}>
                      Mes services
                    </DropdownMenuItem>
                  </>
                )}
                {profile.role === 'admin' && (
                  <DropdownMenuItem render={<Link href="/admin/dashboard" />}>
                    Administration
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/client/messages" />}>
                  Messages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <form action={logout}>
                    <button type="submit" className="w-full text-left">
                      Se déconnecter
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium text-[#1B3A6B] hover:bg-muted h-8 px-2.5 transition-all"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-[#1B3A6B] hover:bg-[#2E6DB4] text-white h-8 px-2.5 transition-all"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
