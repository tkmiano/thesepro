import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { Briefcase } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes commandes reçues' }

const FORMULA_LABEL: Record<string, string> = {
  basic: 'Basique', standard: 'Standard', premium: 'Premium',
}

export default async function FreelanceOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, formula, amount, freelance_amount, delivery_days, created_at, paid_at,
      services!service_id(title),
      profiles!client_id(full_name, avatar_url)
    `)
    .eq('freelance_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Commandes reçues</h1>

      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center space-y-4">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Vous n&apos;avez pas encore reçu de commande.</p>
          <Link
            href="/services"
            className="inline-flex text-sm font-medium text-[#1B3A6B] hover:underline"
          >
            Voir mes services dans le catalogue →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const service = order.services as unknown as { title: string }
            const client  = order.profiles as unknown as { full_name: string }

            return (
              <Link key={order.id} href={`/freelance/orders/${order.id}`}>
                <div className="bg-white rounded-xl border p-5 hover:border-[#1B3A6B]/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-[#1B3A6B] truncate">{service?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Formule {FORMULA_LABEL[order.formula] ?? order.formula} · de {client?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <OrderStatusBadge status={order.status} />
                      <p className="text-base font-bold text-green-700">
                        +{(order.freelance_amount / 100).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
