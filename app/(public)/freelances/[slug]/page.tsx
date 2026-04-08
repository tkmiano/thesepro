import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, CheckCircle, Globe, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ServiceCard } from '@/components/services/service-card'
import { ReviewList } from '@/components/reviews/review-list'
import { getFreelanceReviews } from '@/lib/supabase/review-actions'
import { CATEGORY_LABEL } from '@/lib/constants'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, academic_title, bio, avatar_url')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Profil introuvable' }
  const description = data.bio
    ? data.bio.slice(0, 160)
    : `Profil de ${data.full_name}${data.academic_title ? ` — ${data.academic_title}` : ''} sur ThèsePro`

  return {
    title: `${data.full_name}${data.academic_title ? ` — ${data.academic_title}` : ''}`,
    description,
    openGraph: {
      title:       data.full_name,
      description,
      type:        'profile',
      images:      data.avatar_url ? [{ url: data.avatar_url }] : [],
    },
  }
}

export default async function FreelancePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, academic_title, bio, disciplines, languages, avatar_url, diploma_verified, avg_rating, total_reviews, role')
    .eq('slug', slug)
    .single()

  if (!profile || (profile.role !== 'freelance' && profile.role !== 'both')) notFound()

  const { data: services } = await supabase
    .from('services')
    .select(`
      id, slug, title, category, basic_price, basic_delivery_days,
      avg_rating, tags,
      service_images(url, position)
    `)
    .eq('freelance_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const { reviews, total: totalReviews } = await getFreelanceReviews(profile.id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header profil */}
      <div className="bg-white rounded-2xl border p-8 flex gap-8">
        <div className="w-24 h-24 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-[#1B3A6B]">{initials}</span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A6B]">{profile.full_name}</h1>
              {profile.academic_title && (
                <p className="text-muted-foreground">{profile.academic_title}</p>
              )}
            </div>
            {profile.diploma_verified && (
              <div className="flex items-center gap-1.5 bg-[#FFF8ED] text-[#C9963A] px-3 py-1.5 rounded-full text-sm font-medium border border-[#C9963A]/20">
                <CheckCircle className="w-4 h-4" />
                Diplôme vérifié
              </div>
            )}
          </div>

          {/* Rating */}
          {profile.avg_rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(profile.avg_rating) ? 'fill-[#C9963A] text-[#C9963A]' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="font-medium text-sm">{profile.avg_rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({profile.total_reviews} avis)</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{profile.bio}</p>
          )}

          {/* Tags info */}
          <div className="flex flex-wrap gap-3">
            {profile.disciplines?.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5" />
                {profile.disciplines.slice(0, 3).join(', ')}
                {profile.disciplines.length > 3 && ` +${profile.disciplines.length - 3}`}
              </div>
            )}
            {profile.languages?.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                {profile.languages.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avis */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-4">
            Avis clients ({totalReviews})
          </h2>
          <ReviewList reviews={reviews as unknown as Parameters<typeof ReviewList>[0]['reviews']} total={totalReviews} />
        </div>
      )}

      {/* Services */}
      <div>
        <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">
          Services ({services?.length ?? 0})
        </h2>

        {!services || services.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground">
            Ce freelance n'a pas encore publié de services.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => {
              const imgs = (service.service_images as { url: string; position: number }[])
                ?.sort((a, b) => a.position - b.position) ?? []
              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  freelance={profile}
                  imageUrl={imgs[0]?.url}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
