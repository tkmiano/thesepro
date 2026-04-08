import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Star, ShoppingBag, TrendingUp, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABEL } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord freelance' }

export default async function FreelanceDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: services }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avg_rating, total_reviews, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('services')
      .select('id, title, slug, category, basic_price, is_active, views_count, orders_count, avg_rating')
      .eq('freelance_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!profile) redirect('/login')

  const firstName = profile.full_name?.split(' ')[0] ?? 'là'
  const servicesCount   = services?.length ?? 0
  const totalViews      = services?.reduce((acc, s) => acc + (s.views_count ?? 0), 0) ?? 0
  const activeOrders    = 0   // Sprint 3
  const monthlyRevenue  = 0   // Sprint 3

  const kpis = [
    {
      label:   'Revenus du mois',
      value:   `${monthlyRevenue} €`,
      icon:    TrendingUp,
      color:   'text-green-600',
      bg:      'bg-green-50',
      note:    'Paiements Sprint 3',
    },
    {
      label:   'Commandes actives',
      value:   String(activeOrders),
      icon:    ShoppingBag,
      color:   'text-blue-600',
      bg:      'bg-blue-50',
      note:    'Commandes Sprint 3',
    },
    {
      label:   'Note moyenne',
      value:   profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '—',
      icon:    Star,
      color:   'text-[#C9963A]',
      bg:      'bg-[#FFF8ED]',
      note:    profile.total_reviews > 0 ? `${profile.total_reviews} avis` : 'Aucun avis',
    },
    {
      label:   'Services publiés',
      value:   String(servicesCount),
      icon:    Briefcase,
      color:   'text-[#1B3A6B]',
      bg:      'bg-[#E8F0FB]',
      note:    `${totalViews} vues au total`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A6B]">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici un aperçu de votre activité sur ThèsePro.
          </p>
        </div>
        <Button
          className="bg-[#1B3A6B] hover:bg-[#2E6DB4]"
          render={<Link href="/freelance/services/new" />}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer un service
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg, note }) => (
          <div key={label} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>

      {/* Mes services récents */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-[#1B3A6B]">Mes services récents</h2>
          <Link href="/freelance/services" className="text-sm text-[#2E6DB4] hover:underline">
            Voir tous →
          </Link>
        </div>

        {servicesCount === 0 ? (
          <div className="p-10 text-center space-y-4">
            <div className="text-4xl">📦</div>
            <p className="text-muted-foreground">Vous n'avez pas encore de services publiés.</p>
            <Button
              className="bg-[#1B3A6B] hover:bg-[#2E6DB4]"
              render={<Link href="/freelance/services/new" />}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier service
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {services!.map(service => (
              <li key={service.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#1B3A6B] truncate">{service.title}</p>
                    <Badge
                      variant={service.is_active ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{CATEGORY_LABEL[service.category] ?? service.category}</span>
                    <span>·</span>
                    <span className="font-medium text-[#1B3A6B]">{service.basic_price} €</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />{service.views_count} vues
                    </span>
                    {service.avg_rating > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#C9963A] text-[#C9963A]" />
                          {service.avg_rating.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Link
                  href={`/freelance/services/${service.id}/edit`}
                  className="text-xs text-[#2E6DB4] hover:underline shrink-0"
                >
                  Modifier
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Aide rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#E8F0FB] rounded-xl p-5 space-y-2">
          <h3 className="font-semibold text-[#1B3A6B]">Complétez votre profil</h3>
          <p className="text-sm text-muted-foreground">
            Un profil complet avec photo et diplôme vérifié augmente vos chances de commande.
          </p>
          <Link href="/freelance/settings" className="text-sm font-medium text-[#1B3A6B] hover:underline">
            Modifier mon profil →
          </Link>
        </div>
        <div className="bg-[#FFF8ED] rounded-xl p-5 space-y-2">
          <h3 className="font-semibold text-[#C9963A]">Vos services dans le catalogue</h3>
          <p className="text-sm text-muted-foreground">
            Consultez comment vos services apparaissent aux clients potentiels.
          </p>
          <Link href="/services" className="text-sm font-medium text-[#C9963A] hover:underline">
            Voir le catalogue →
          </Link>
        </div>
      </div>
    </div>
  )
}
