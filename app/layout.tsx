import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'ThèsePro — Accompagnement académique de référence',
    template: '%s | ThèsePro',
  },
  description:
    'Marketplace académique francophone : trouvez des experts vérifiés pour votre thèse, mémoire, correction, statistiques et plus encore.',
  keywords: ['thèse', 'mémoire', 'correction', 'académique', 'freelance', 'statistiques', 'traduction'],
  authors: [{ name: 'ThèsePro' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'ThèsePro',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
