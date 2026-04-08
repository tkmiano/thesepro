import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const categories = [
  'Rédaction académique',
  'Correction & Révision',
  'Statistiques & Analyse',
  'Tutorat & Coaching',
  'Traduction académique',
  'Publication scientifique',
]

export default function Footer() {
  return (
    <footer className="bg-[#1B3A6B] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-bold">ThèsePro</span>
            </div>
            <p className="text-sm text-blue-200">
              La référence francophone de l&apos;accompagnement académique en ligne.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200">
              Catégories
            </h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/services?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-blue-100 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200">
              Plateforme
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/comment-ca-marche" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/freelances" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Nos freelances
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Devenir freelance
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200">
              Légal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cgu" className="text-sm text-blue-100 hover:text-white transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="text-sm text-blue-100 hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-blue-300">
            © {new Date().getFullYear()} ThèsePro. Tous droits réservés.
          </p>
          <p className="text-sm text-blue-300">
            thesepro.fr
          </p>
        </div>
      </div>
    </footer>
  )
}
