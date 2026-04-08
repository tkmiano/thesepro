import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ServiceCard } from '@/components/services/service-card'
import { ServicesFilters } from '@/components/services/services-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catalogue de services',
  description: 'Trouvez des experts académiques vérifiés pour votre thèse, mémoire, correction, statistiques et plus.',
}

const PAGE_SIZE = 12

interface SearchParams {
  q?: string
  category?: string
  price_max?: string
  delay_max?: string
  sort?: string
  page?: string
}

async function ServiceGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase  = await createClient()
  const page      = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from      = (page - 1) * PAGE_SIZE
  const to        = from + PAGE_SIZE - 1

  let query = supabase
    .from('services')
    .select(`
      id, slug, title, category, basic_price, basic_delivery_days,
      avg_rating, tags, freelance_id,
      service_images(url, position),
      profiles!freelance_id(full_name, avatar_url, diploma_verified, avg_rating)
    `, { count: 'exact' })
    .eq('is_active', true)

  if (searchParams.q) {
    query = query.textSearch('fts', searchParams.q, { type: 'websearch', config: 'french' })
  }
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }
  if (searchParams.price_max) {
    query = query.lte('basic_price', parseInt(searchParams.price_max))
  }
  if (searchParams.delay_max) {
    query = query.lte('basic_delivery_days', parseInt(searchParams.delay_max))
  }

  switch (searchParams.sort) {
    case 'rating':    query = query.order('avg_rating',     { ascending: false }); break
    case 'price_asc': query = query.order('basic_price',    { ascending: true  }); break
    case 'price_desc':query = query.order('basic_price',    { ascending: false }); break
    default:          query = query.order('created_at',     { ascending: false }); break
  }

  const { data: services, count } = await query.range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  if (!services || services.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg font-medium text-[#1B3A6B]">Aucun service trouvé</p>
          <p className="text-muted-foreground mt-1">Essayez d'autres filtres ou une recherche différente.</p>
        </div>
      </div>
    )
  }

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (searchParams.q)        params.set('q', searchParams.q)
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.price_max)params.set('price_max', searchParams.price_max)
    if (searchParams.delay_max)params.set('delay_max', searchParams.delay_max)
    if (searchParams.sort)     params.set('sort', searchParams.sort)
    params.set('page', String(p))
    return `/services?${params.toString()}`
  }

  return (
    <div className="flex-1 space-y-6">
      <p className="text-sm text-muted-foreground">
        {count} service{(count ?? 0) > 1 ? 's' : ''} trouvé{(count ?? 0) > 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map(service => {
          const profile = service.profiles as unknown as {
            full_name: string
            avatar_url: string | null
            diploma_verified: boolean
            avg_rating: number
          }
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </Link>
          )}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <Link key={p} href={buildPageUrl(p)}
                  className={`w-9 h-9 flex items-center justify-center text-sm rounded-lg transition-colors ${
                    p === page ? 'bg-[#1B3A6B] text-white' : 'border hover:bg-gray-50'
                  }`}>
                  {p}
                </Link>
              )
            })}
          </div>
          {page < totalPages && (
            <Link href={buildPageUrl(page + 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ServiceGridSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <div className="flex justify-between pt-2 border-t">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Catalogue de services</h1>
        <p className="text-muted-foreground mt-2">
          Des experts académiques vérifiés pour vous accompagner dans vos projets.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filtres */}
        <div className="w-64 shrink-0">
          <Suspense>
            <ServicesFilters />
          </Suspense>
        </div>

        {/* Grille services */}
        <Suspense fallback={<ServiceGridSkeleton />}>
          <ServiceGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
