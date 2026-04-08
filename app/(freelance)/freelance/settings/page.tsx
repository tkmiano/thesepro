import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/freelance/profile-form'
import { StripeConnectSection } from '@/components/stripe/stripe-connect-section'
import { getConnectAccountStatus } from '@/lib/supabase/stripe-actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function FreelanceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>
}) {
  const { stripe: stripeParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, academic_title, bio, disciplines, languages, avatar_url, diploma_url, diploma_verified, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const connectStatus = await getConnectAccountStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre profil public et vos paiements.
        </p>
      </div>

      {stripeParam === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          ✓ Votre compte Stripe a été configuré avec succès.
        </div>
      )}
      {stripeParam === 'refresh' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
          L&apos;onboarding a été interrompu. Cliquez à nouveau pour le compléter.
        </div>
      )}

      {/* Stripe Connect */}
      <StripeConnectSection
        status={connectStatus?.status ?? 'none'}
        detailsSubmitted={connectStatus && 'detailsSubmitted' in connectStatus ? connectStatus.detailsSubmitted : false}
      />

      {/* Profil */}
      <div>
        <h2 className="text-lg font-semibold text-[#1B3A6B] mb-4">Mon profil public</h2>
        <div className="bg-white rounded-xl border p-8">
          <ProfileForm profile={{
            id:               profile.id,
            full_name:        profile.full_name,
            academic_title:   profile.academic_title,
            bio:              profile.bio,
            disciplines:      profile.disciplines ?? [],
            languages:        profile.languages ?? [],
            avatar_url:       profile.avatar_url,
            diploma_url:      profile.diploma_url,
            diploma_verified: profile.diploma_verified ?? false,
          }} />
        </div>
      </div>
    </div>
  )
}
