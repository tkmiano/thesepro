import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, CheckCircle, Globe, BookOpen, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ServiceGallery } from '@/components/services/service-gallery'
import { FormulaSelector } from '@/components/services/formula-selector'
import { ViewTracker } from '@/components/services/view-tracker'
import { ServiceCard } from '@/components/services/service-card'
import { ReviewList } from '@/components/reviews/review-list'
import { getServiceReviews } from '@/lib/supabase/review-actions'
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
    .from('services')
    .select('title, description, category, basic_price')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Service introuvable' }

  const plain = data.description.replace(/<[^>]*>/g, '').slice(0, 160)
  return {
    title: data.title,
    description: plain,
    openGraph: { title: data.title, description: plain, type: 'website' },
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase  = await createClient()

  // Fetch service — NOTE : total_reviews n'existe pas sur services (il est sur profiles)
  const { data: service } = await supabase
    .from('services')
    .select(`
      id, title, slug, category, subcategory, description,
      basic_price, basic_delivery_days, basic_description,
      standard_price, standard_delivery_days, standard_description,
      premium_price, premium_delivery_days, premium_description,
      tags, avg_rating, views_count, orders_count,
      created_at, freelance_id,
      service_images(url, position),
      profiles!freelance_id(
        id, full_name, avatar_url, academic_title, bio,
        disciplines, languages, diploma_verified,
        avg_rating, total_reviews, slug
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!service) notFound()

  // Nombre d'avis sur ce service spécifique
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('service_id', service.id)

  const images = (service.service_images as { url: string; position: number }[])
    ?.sort((a, b) => a.position - b.position)
    .map(img => img.url) ?? []

  const freelance = service.profiles as unknown as {
    id: string
    full_name: string
    avatar_url: string | null
    academic_title: string | null
    bio: string | null
    disciplines: string[]
    languages: string[]
    diploma_verified: boolean
    avg_rating: number
    total_reviews: number
    slug: string | null
  }

  const serviceReviews = reviewCount ?? 0

  // Avis détaillés
  const { reviews, total: totalReviews } = await getServiceReviews(service.id)

  // Utilisateur connecté (pour FormulaSelector)
  const { data: { user } } = await supabase.auth.getUser()

  // Services similaires
  const { data: similar } = await supabase
    .from('services')
    .select(`
      id, slug, title, category, basic_price, basic_delivery_days,
      avg_rating, tags,
      service_images(url, position),
      profiles!freelance_id(full_name, avatar_url, diploma_verified, avg_rating)
    `)
    .eq('category', service.category)
    .eq('is_active', true)
    .neq('id', service.id)
    .limit(3)

  const initials = freelance.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <ViewTracker serviceId={service.id} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/services" className="hover:text-[#1B3A6B]">Services</Link>
          <span>/</span>
          <Link href={`/services?category=${service.category}`} className="hover:text-[#1B3A6B]">
            {CATEGORY_LABEL[service.category] ?? service.category}
          </Link>
          <span>/</span>
          <span className="text-[#1B3A6B] font-medium truncate max-w-[200px]">{service.title}</span>
        </nav>

        <div className="flex gap-8 items-start">
          {/* Colonne principale */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* En-tête */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">{CATEGORY_LABEL[service.category] ?? service.category}</Badge>
                {service.subcategory && <Badge variant="outline">{service.subcategory}</Badge>}
              </div>

              <h1 className="text-2xl font-bold text-[#1B3A6B] leading-snug">{service.title}</h1>

              {/* Auteur */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link href={freelance.slug ? `/freelances/${freelance.slug}` : '#'}>
                  <div className="w-9 h-9 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden">
                    {freelance.avatar_url ? (
                      <img src={freelance.avatar_url} alt={freelance.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#1B3A6B]">{initials}</span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link
                    href={freelance.slug ? `/freelances/${freelance.slug}` : '#'}
                    className="text-sm font-medium text-[#1B3A6B] hover:underline"
                  >
                    {freelance.full_name}
                  </Link>
                  {freelance.diploma_verified && (
                    <div className="flex items-center gap-1 text-[#C9963A] text-xs">
                      <CheckCircle className="w-3 h-3" /> Diplôme vérifié
                    </div>
                  )}
                </div>
                {service.avg_rating > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 fill-[#C9963A] text-[#C9963A]" />
                    <span className="text-sm font-medium">{service.avg_rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({serviceReviews} avis)</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />{service.views_count} vues
                </span>
                <span>{service.orders_count} commande{service.orders_count !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Galerie */}
            <ServiceGallery images={images} />

            {/* Description */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-[#1B3A6B] mb-4">Description du service</h2>
              <div
                className="prose prose-sm max-w-none text-[#333]
                  [&_h2]:text-[#1B3A6B] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
                  [&_h3]:text-[#1B3A6B] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
                  [&_strong]:font-semibold
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                  [&_p]:leading-relaxed [&_p]:mb-3
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#1B3A6B]/20 [&_blockquote]:pl-4 [&_blockquote]:italic"
                dangerouslySetInnerHTML={{ __html: service.description }}
              />
            </div>

            {/* Tags */}
            {service.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(service.tags as string[]).map(tag => (
                  <Link key={tag} href={`/services?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="hover:bg-[#E8F0FB] cursor-pointer text-xs">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Carte freelance */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1B3A6B]">À propos du freelance</h2>
              <div className="flex items-start gap-4">
                <Link href={freelance.slug ? `/freelances/${freelance.slug}` : '#'} className="shrink-0">
                  <div className="w-14 h-14 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden">
                    {freelance.avatar_url ? (
                      <img src={freelance.avatar_url} alt={freelance.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-[#1B3A6B]">{initials}</span>
                    )}
                  </div>
                </Link>
                <div className="flex-1 space-y-2">
                  <div>
                    <Link
                      href={freelance.slug ? `/freelances/${freelance.slug}` : '#'}
                      className="font-semibold text-[#1B3A6B] hover:underline"
                    >
                      {freelance.full_name}
                    </Link>
                    {freelance.academic_title && (
                      <p className="text-sm text-muted-foreground">{freelance.academic_title}</p>
                    )}
                  </div>
                  {freelance.avg_rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-[#C9963A] text-[#C9963A]" />
                      <span className="text-sm font-medium">{freelance.avg_rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({freelance.total_reviews} avis)</span>
                    </div>
                  )}
                  {freelance.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{freelance.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {freelance.disciplines?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {freelance.disciplines.slice(0, 2).join(', ')}
                        {freelance.disciplines.length > 2 && ` +${freelance.disciplines.length - 2}`}
                      </span>
                    )}
                    {freelance.languages?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {freelance.languages.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {freelance.slug && (
                <Link
                  href={`/freelances/${freelance.slug}`}
                  className="inline-flex items-center text-sm font-medium text-[#1B3A6B] hover:underline"
                >
                  Voir le profil complet →
                </Link>
              )}
            </div>

            {/* Avis */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-[#1B3A6B] mb-4">
                Avis clients {serviceReviews > 0 && `(${serviceReviews})`}
              </h2>
              {serviceReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(service.avg_rating) ? 'fill-[#C9963A] text-[#C9963A]' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{service.avg_rating.toFixed(1)}</span>
                </div>
              )}
              <ReviewList reviews={reviews as unknown as Parameters<typeof ReviewList>[0]['reviews']} total={totalReviews} />
            </div>
          </div>

          {/* Sidebar formules — sticky */}
          <div className="w-80 shrink-0">
            <FormulaSelector
              serviceId={service.id}
              freelanceId={freelance.id}
              currentUserId={user?.id ?? null}
              basic={{
                label:         'Basique',
                price:         service.basic_price,
                delivery_days: service.basic_delivery_days,
                description:   service.basic_description,
              }}
              standard={service.standard_price ? {
                label:         'Standard',
                price:         service.standard_price,
                delivery_days: service.standard_delivery_days!,
                description:   service.standard_description,
              } : null}
              premium={service.premium_price ? {
                label:         'Premium',
                price:         service.premium_price,
                delivery_days: service.premium_delivery_days!,
                description:   service.premium_description,
              } : null}
            />
          </div>
        </div>

        {/* Services similaires */}
        {similar && similar.length > 0 && (
          <div className="mt-12 space-y-5">
            <h2 className="text-xl font-bold text-[#1B3A6B]">Services similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similar.map(s => {
                const prof = s.profiles as unknown as {
                  full_name: string
                  avatar_url: string | null
                  diploma_verified: boolean
                  avg_rating: number
                }
                const imgs = (s.service_images as { url: string; position: number }[])
                  ?.sort((a, b) => a.position - b.position) ?? []
                return (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    freelance={prof}
                    imageUrl={imgs[0]?.url}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
