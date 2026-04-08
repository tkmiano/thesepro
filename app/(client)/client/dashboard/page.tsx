import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, MessageSquare, CreditCard, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const firstName = profile.full_name?.split(' ')[0] ?? 'là'

  // Statistiques commandes réelles
  const [{ count: activeOrdersCount }, { data: completedOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .in('status', ['paid', 'in_progress', 'delivered', 'revision_requested']),
    supabase
      .from('orders')
      .select('amount')
      .eq('client_id', user.id)
      .eq('status', 'completed'),
  ])

  const totalSpent = completedOrders?.reduce((sum, o) => sum + (o.amount ?? 0), 0) ?? 0

  const kpis = [
    {
      label: 'Commandes en cours',
      value: String(activeOrdersCount ?? 0),
      icon:  ShoppingBag,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
      note:  activeOrdersCount ? 'Voir mes commandes →' : 'Aucune commande active',
      href:  '/client/orders',
    },
    {
      label: 'Messages non lus',
      value: '0',
      icon:  MessageSquare,
      color: 'text-purple-600',
      bg:    'bg-purple-50',
      note:  'Messagerie disponible au Sprint 4',
      href:  null,
    },
    {
      label: 'Total dépensé',
      value: `${(totalSpent / 100).toFixed(2)} €`,
      icon:  CreditCard,
      color: 'text-green-600',
      bg:    'bg-green-50',
      note:  `${completedOrders?.length ?? 0} commande${(completedOrders?.length ?? 0) !== 1 ? 's' : ''} terminée${(completedOrders?.length ?? 0) !== 1 ? 's' : ''}`,
      href:  null,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A6B]">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur votre espace ThèsePro.
          </p>
        </div>
        <Button
          className="bg-[#1B3A6B] hover:bg-[#2E6DB4]"
          render={<Link href="/services" />}
        >
          <Search className="w-4 h-4 mr-2" />
          Trouver un expert
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, note, href }) => (
          <div key={label} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {href ? (
              <Link href={href} className="text-xs text-[#2E6DB4] hover:underline">{note}</Link>
            ) : (
              <p className="text-xs text-muted-foreground">{note}</p>
            )}
          </div>
        ))}
      </div>

      {/* Invitation explorer */}
      <div className="bg-gradient-to-br from-[#1B3A6B] to-[#2E6DB4] rounded-2xl p-8 text-white space-y-4">
        <h2 className="text-xl font-bold">Trouvez l'expert qu'il vous faut</h2>
        <p className="text-white/80 text-sm leading-relaxed max-w-lg">
          Des centaines de freelances académiques vérifiés sont disponibles pour vous aider :
          correction de thèse, rédaction, statistiques, tutorat, traduction et plus encore.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={`/services?category=${cat.value}`}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 bg-white text-[#1B3A6B] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#E8F0FB] transition-colors mt-2"
        >
          Explorer tous les services
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Comment ça marche */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-[#1B3A6B]">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Trouvez un expert', desc: 'Parcourez le catalogue et filtrez par catégorie, prix ou délai.' },
            { step: '2', title: 'Passez commande',   desc: 'Choisissez votre formule (Basique, Standard, Premium) et confirmez.' },
            { step: '3', title: 'Recevez votre travail', desc: 'Échangez avec le freelance et recevez votre livrable dans les délais.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E8F0FB] text-[#1B3A6B] font-bold text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="font-medium text-[#1B3A6B] text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
