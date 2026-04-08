import { getAdminOrders } from '@/lib/supabase/admin-actions'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Commandes' }

const STATUSES = [
  '', 'pending_payment', 'paid', 'in_progress', 'delivered',
  'completed', 'revision_requested', 'disputed', 'cancelled', 'refunded',
]
const STATUS_LABEL: Record<string, string> = {
  '':                  'Toutes',
  pending_payment:     'En attente',
  paid:                'Payées',
  in_progress:         'En cours',
  delivered:           'Livrées',
  completed:           'Terminées',
  revision_requested:  'Révision',
  disputed:            'Litiges',
  cancelled:           'Annulées',
  refunded:            'Remboursées',
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page } = await searchParams
  const currentPage = parseInt(page ?? '1')
  const { orders, total } = await getAdminOrders(currentPage, status)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">
        Commandes <span className="text-muted-foreground font-normal text-lg">({total})</span>
      </h1>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <a
            key={s}
            href={s ? `?status=${s}` : '?'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              (status ?? '') === s
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-muted-foreground border-gray-200 hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
            }`}
          >
            {STATUS_LABEL[s]}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Service</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Freelance</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Montant</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const svc      = o.services  as unknown as { title: string }
              const client   = o.client    as unknown as { full_name: string }
              const freelance = o.freelance as unknown as { full_name: string }
              return (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-[#333] max-w-[180px] truncate">{svc?.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{client?.full_name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{freelance?.full_name}</td>
                  <td className="px-5 py-3 text-right font-semibold">{(o.amount / 100).toFixed(2)} €</td>
                  <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`?${status ? `status=${status}&` : ''}page=${p}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border ${
                p === currentPage ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-muted-foreground border-gray-200'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
