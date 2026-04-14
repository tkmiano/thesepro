import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, ShieldCheck, MessageSquare, Star, CreditCard, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Comment ça marche — ThèsePro',
  description: 'Découvrez comment ThèsePro fonctionne : trouvez un expert, commandez un service, suivez votre commande et obtenez un accompagnement académique de qualité.',
}

const steps = [
  {
    icon: Search,
    title: '1. Trouvez votre expert',
    description: 'Parcourez notre catalogue de freelances vérifiés. Filtrez par domaine, tarif ou délai. Chaque profil affiche les diplômes validés par notre équipe.',
  },
  {
    icon: MessageSquare,
    title: '2. Contactez et commandez',
    description: 'Échangez directement avec le freelance via notre messagerie. Choisissez la formule qui correspond à votre besoin et passez commande en ligne.',
  },
  {
    icon: CreditCard,
    title: '3. Paiement sécurisé',
    description: 'Votre paiement est sécurisé par Stripe et conservé en séquestre jusqu\'à la validation de la livraison. Vous ne payez que si vous êtes satisfait.',
  },
  {
    icon: CheckCircle,
    title: '4. Suivi en temps réel',
    description: 'Suivez l\'avancement de votre commande depuis votre tableau de bord. Le freelance vous livre directement sur la plateforme.',
  },
  {
    icon: ShieldCheck,
    title: '5. Validation et libération',
    description: 'Vérifiez la livraison et validez-la. Le paiement est alors libéré au freelance. En cas de litige, notre équipe intervient.',
  },
  {
    icon: Star,
    title: '6. Laissez un avis',
    description: 'Évaluez le travail du freelance pour aider la communauté. Les avis sont vérifiés — seules les commandes complétées peuvent être notées.',
  },
]

export default function CommentCaMarchePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-[#1B3A6B] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Comment ça marche ?</h1>
          <p className="text-xl text-blue-100">
            ThèsePro met en relation étudiants et experts académiques vérifiés.
            Un processus simple, sécurisé et transparent.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-10">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-14 h-14 bg-[#E8F0FB] rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#1B3A6B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#1B3A6B] mb-2">{step.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1B3A6B] mb-4">Nos garanties</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-8 text-left">
            {[
              { title: 'Experts vérifiés', text: 'Chaque freelance fournit ses diplômes, vérifiés manuellement avant activation.' },
              { title: 'Paiement protégé', text: 'Vos fonds sont en séquestre. Ils ne sont libérés qu\'après votre validation.' },
              { title: 'Support réactif', text: 'Notre équipe traite les litiges sous 48h ouvrées.' },
            ].map((g) => (
              <div key={g.title} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-[#1B3A6B] mb-2">{g.title}</h3>
                <p className="text-sm text-gray-600">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#1B3A6B] mb-4">Prêt à commencer ?</h2>
        <p className="text-gray-600 mb-8">Trouvez votre expert académique en quelques minutes.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/services">
            <Button className="bg-[#1B3A6B] hover:bg-[#2E6DB4] w-full sm:w-auto">
              Voir les services
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="border-[#1B3A6B] text-[#1B3A6B] w-full sm:w-auto">
              Créer un compte
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
