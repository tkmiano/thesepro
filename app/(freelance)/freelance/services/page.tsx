import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Eye, Pencil, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABEL } from '@/lib/constants'
import { deleteService } from '@/lib/supabase/service-actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes services' }

export default async function FreelanceServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('id, title, slug, category, basic_price, is_active, views_count, orders_count, avg_rating, created_at')
    .eq('freelance_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A6B]">Mes services</h1>
          <p className="text-muted-foreground mt-1">{services?.length ?? 0} service{(services?.length ?? 0) > 1 ? 's' : ''} publié{(services?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Button className="bg-[#1B3A6B] hover:bg-[#2E6DB4]" render={<Link href="/freelance/services/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau service
        </Button>
      </div>

      {!services || services.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-lg font-semibold text-[#1B3A6B] mb-2">Aucun service pour l'instant</h2>
          <p className="text-muted-foreground mb-6">Créez votre premier service pour commencer à recevoir des commandes.</p>
          <Button className="bg-[#1B3A6B] hover:bg-[#2E6DB4]" render={<Link href="/freelance/services/new" />}>
            <Plus className="w-4 h-4 mr-2" />
            Créer mon premier service
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-xl border p-5 flex items-center gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#1B3A6B] truncate">{service.title}</h3>
                  <Badge variant={service.is_active ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {service.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{CATEGORY_LABEL[service.category] ?? service.category}</span>
                  <span>·</span>
                  <span className="font-medium text-[#1B3A6B]">À partir de {service.basic_price} €</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />{service.views_count} vues
                  </span>
                  <span>·</span>
                  <span>{service.orders_count} commande{service.orders_count > 1 ? 's' : ''}</span>
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

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" render={<Link href={`/services/${service.slug}`} />}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />Voir
                </Button>
                <Button size="sm" variant="outline" render={<Link href={`/freelance/services/${service.id}/edit`} />}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />Modifier
                </Button>
                <form action={async () => {
                  'use server'
                  await deleteService(service.id)
                }}>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Supprimer
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
