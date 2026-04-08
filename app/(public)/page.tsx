import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'ThèsePro — Experts académiques vérifiés pour votre thèse',
  description: 'Marketplace francophone d\'accompagnement académique : thèse, mémoire, correction, statistiques. Experts diplômés et vérifiés.',
  openGraph: {
    title: 'ThèsePro — Accompagnement académique de référence',
    description: 'Trouvez des experts vérifiés pour votre thèse, mémoire, correction, statistiques. Paiement sécurisé.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'ThèsePro',
  },
}

import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  BookOpen,
  PenTool,
  BarChart3,
  GraduationCap,
  Languages,
  FileText,
  Star,
  Shield,
  Clock,
  ChevronRight,
} from 'lucide-react'

const categories = [
  { name: 'Rédaction académique', icon: BookOpen, slug: 'redaction-academique' },
  { name: 'Correction & Révision', icon: PenTool, slug: 'correction-revision' },
  { name: 'Statistiques & Analyse', icon: BarChart3, slug: 'statistiques-analyse' },
  { name: 'Tutorat & Coaching', icon: GraduationCap, slug: 'tutorat-coaching' },
  { name: 'Traduction académique', icon: Languages, slug: 'traduction-academique' },
  { name: 'Publication scientifique', icon: FileText, slug: 'publication-scientifique' },
]

const steps = [
  {
    number: '1',
    title: 'Cherchez',
    description: 'Parcourez notre catalogue de services académiques ou recherchez par mots-clés.',
  },
  {
    number: '2',
    title: 'Commandez',
    description: 'Choisissez votre formule, transmettez vos besoins et payez en toute sécurité.',
  },
  {
    number: '3',
    title: 'Recevez',
    description: 'Validez le travail livré et libérez le paiement. Simple et sécurisé.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B3A6B] to-[#2E6DB4] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-[#E8F0FB] text-[#1B3A6B] hover:bg-[#E8F0FB]">
            La référence francophone
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            L&apos;accompagnement académique
            <br />
            <span className="text-blue-200">de confiance</span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Trouvez des experts vérifiés pour votre thèse, mémoire, articles scientifiques et plus encore.
          </p>

          {/* Barre de recherche */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Correction de thèse, analyse SPSS, traduction..."
                className="pl-10 h-12 text-gray-900 bg-white border-0"
              />
            </div>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-white text-[#1B3A6B] hover:bg-blue-50 h-12 px-6 transition-all"
            >
              Rechercher
            </Link>
          </div>

          {/* Compteurs */}
          <div className="flex justify-center gap-12 mt-12">
            {[
              { value: '500+', label: 'Services disponibles' },
              { value: '200+', label: 'Freelances vérifiés' },
              { value: '1 000+', label: 'Commandes livrées' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1B3A6B] text-center mb-3">
            Explorez nos catégories
          </h2>
          <p className="text-[#555555] text-center mb-10">
            Des experts dans tous les domaines académiques
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(({ name, icon: Icon, slug }) => (
              <Link
                key={slug}
                href={`/services?category=${slug}`}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-transparent bg-[#F5F5F5] hover:border-[#2E6DB4] hover:bg-[#E8F0FB] transition-all group"
              >
                <Icon className="h-8 w-8 text-[#1B3A6B] group-hover:text-[#2E6DB4]" />
                <span className="text-sm font-medium text-[#1B3A6B] text-center leading-tight">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-[#F5F5F5]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1B3A6B] text-center mb-3">
            Comment ça marche ?
          </h2>
          <p className="text-[#555555] text-center mb-12">Simple, rapide et sécurisé</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {index < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute right-0 top-8 -translate-y-1/2 h-6 w-6 text-[#2E6DB4]" />
                )}
                <div className="w-16 h-16 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-[#1B3A6B] mb-2">{step.title}</h3>
                <p className="text-[#555555] text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arguments de confiance */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            {[
              {
                icon: Shield,
                title: 'Freelances vérifiés',
                description: 'Chaque prestataire soumet son diplôme. Notre équipe valide les compétences.',
              },
              {
                icon: Star,
                title: 'Avis authentiques',
                description: "Seuls les clients ayant commandé peuvent laisser un avis.",
              },
              {
                icon: Clock,
                title: 'Paiement sécurisé',
                description: "Votre argent est en séquestre jusqu'à la validation du travail.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#E8F0FB] flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-[#1B3A6B]" />
                </div>
                <h3 className="text-lg font-bold text-[#1B3A6B] mb-2">{title}</h3>
                <p className="text-[#555555] text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-[#1B3A6B] text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à démarrer votre projet académique ?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Rejoignez des milliers d&apos;étudiants et chercheurs qui nous font confiance.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-white text-[#1B3A6B] hover:bg-blue-50 h-9 px-4 transition-all"
            >
              Trouver un service
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-white text-sm font-medium text-white hover:bg-white/10 h-9 px-4 transition-all"
            >
              Devenir freelance
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
