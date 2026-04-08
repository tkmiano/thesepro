import { getDisputedOrders } from '@/lib/supabase/admin-actions'
import { AdminDisputeActions } from '@/components/admin/admin-dispute-actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Litiges' }

export default async function AdminDisputesPage() {
  const disputes = await getDisputedOrders()

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">
        Litiges <span className="text-muted-foreground font-normal text-lg">({disputes.length})</span>
      </h1>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-muted-foreground">
          Aucun litige en cours. 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => {
            const svc      = d.services  as unknown as { title: string }
            const client   = d.client    as unknown as { id: string; full_name: string }
            const freelance = d.freelance as unknown as { id: string; full_name: string; stripe_account_id: string | null }

            return (
              <div key={d.id} className="bg-white rounded-xl border border-red-100 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#1B3A6B]">{svc?.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{d.id.slice(0, 8).toUpperCase()} · Payée le {d.paid_at ? new Date(d.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-[#1B3A6B]">{(d.amount / 100).toFixed(2)} €</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#F5F7FF] rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Client</p>
                    <p className="font-medium text-[#333]">{client?.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Remboursement : <strong className="text-red-600">{(d.amount / 100).toFixed(2)} €</strong>
                    </p>
                  </div>
                  <div className="bg-[#F5F7FF] rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Freelance</p>
                    <p className="font-medium text-[#333]">{freelance?.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Libération : <strong className="text-green-600">{(d.freelance_amount / 100).toFixed(2)} €</strong>
                    </p>
                  </div>
                </div>

                <AdminDisputeActions
                  orderId={d.id}
                  hasStripeAccount={!!freelance?.stripe_account_id}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
