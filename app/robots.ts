import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thesepro.fr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin/', '/client/', '/freelance/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host:    APP_URL,
  }
}
