import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServiceForm } from '@/components/freelance/service-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nouveau service' }

export default async function NewServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Créer un service</h1>
        <p className="text-muted-foreground mt-1">
          Décrivez précisément votre offre pour attirer les bons clients.
        </p>
      </div>
      <ServiceForm userId={user.id} />
    </div>
  )
}
