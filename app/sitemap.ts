import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thesepro.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()

  // Services actifs
  const { data: services } = await supabase
    .from('services')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1000)

  // Profils freelances actifs
  const { data: freelances } = await supabase
    .from('profiles')
    .select('slug, updated_at')
    .in('role', ['freelance', 'both'])
    .not('slug', 'is', null)
    .limit(500)

  const serviceUrls: MetadataRoute.Sitemap = (services ?? []).map(s => ({
    url:          `${APP_URL}/services/${s.slug}`,
    lastModified: new Date(s.updated_at ?? Date.now()),
    changeFrequency: 'weekly',
    priority:     0.8,
  }))

  const freelanceUrls: MetadataRoute.Sitemap = (freelances ?? [])
    .filter(f => f.slug)
    .map(f => ({
      url:          `${APP_URL}/freelances/${f.slug}`,
      lastModified: new Date(f.updated_at ?? Date.now()),
      changeFrequency: 'monthly',
      priority:     0.6,
    }))

  const staticUrls: MetadataRoute.Sitemap = [
    { url: APP_URL,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/services`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/freelances`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/comment-ca-marche`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/cgu`,             lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${APP_URL}/confidentialite`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${APP_URL}/mentions-legales`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  return [...staticUrls, ...serviceUrls, ...freelanceUrls]
}
