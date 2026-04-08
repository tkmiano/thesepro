import type { ReactNode } from 'react'
import Header from '@/components/shared/header'
import { FreelanceNav } from '@/components/shared/freelance-nav'
import { createClient } from '@/lib/supabase/server'
import { getUnreadMessageCount } from '@/lib/supabase/message-actions'

export default async function FreelanceLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const unreadMessages = user ? await getUnreadMessageCount() : 0

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header />
      <div className="flex flex-1">
        <FreelanceNav userId={user?.id} unreadMessages={unreadMessages} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
