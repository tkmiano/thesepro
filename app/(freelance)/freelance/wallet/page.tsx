import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFreelanceBalance, getFreelanceEarnings, getWithdrawalRequests } from '@/lib/supabase/wallet-actions'
import { WithdrawalForm } from '@/components/wallet/withdrawal-form'
import { TrendingUp, Clock, ArrowDownCircle, CheckCircle2, Loader, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon wallet' }

const WITHDRAWAL_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'En attente',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  processing: { label: 'En cours',    color: 'text-blue-700 bg-blue-50 border-blue-200' },
  completed:  { label: 'Effectué',    color: 'text-green-700 bg-green-50 border-green-200' },
  rejected:   { label: 'Refusé',      color: 'text-red-700 bg-red-50 border-red-200' },
}

export default async function FreelanceWalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [balance, earnings, withdrawals] = await Promise.all([
    getFreelanceBalance(),
    getFreelanceEarnings(),
    getWithdrawalRequests(),
  ])

  const totalEarned = earnings.reduce((sum, o) => sum + (o.freelance_amount ?? 0), 0)

  const hasStripe = 'hasStripe' in balance && balance.hasStripe
  const available = 'available' in balance ? (balance.available ?? 0) : 0
  const pending   = 'pending'   in balance ? (balance.pending   ?? 0) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Mon wallet</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="w-4 h-4" /> Disponible
          </div>
          <p className="text-3xl font-bold text-green-600">
            {hasStripe ? `${(available / 100).toFixed(2)} €` : '—'}
          </p>
          {!hasStripe && (
            <p className="text-xs text-muted-foreground">Connectez Stripe pour voir votre solde</p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" /> En attente
          </div>
          <p className="text-3xl font-bold text-[#1B3A6B]">
            {hasStripe ? `${(pending / 100).toFixed(2)} €` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Libéré dans 2–5 jours ouvrés</p>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CheckCircle2 className="w-4 h-4" /> Total gagné
          </div>
          <p className="text-3xl font-bold text-[#1B3A6B]">
            {(totalEarned / 100).toFixed(2)} €
          </p>
          <p className="text-xs text-muted-foreground">{earnings.length} commande{earnings.length !== 1 ? 's' : ''} terminée{earnings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historique */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-[#1B3A6B]">Historique des gains</h2>

          {earnings.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground text-sm">
              Aucun gain pour le moment. Complétez votre première commande !
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net reçu</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(order => {
                    const svc = order.services as unknown as { title: string }
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-[#333] max-w-[200px] truncate">
                          {svc?.title ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {(order.amount / 100).toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          +{(order.freelance_amount / 100).toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                          {order.completed_at
                            ? new Date(order.completed_at).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Historique des retraits */}
          {withdrawals.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-[#1B3A6B]">Demandes de retrait</h2>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Montant</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => {
                      const st = WITHDRAWAL_STATUS[w.status] ?? WITHDRAWAL_STATUS.pending
                      return (
                        <tr key={w.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-semibold text-[#333]">
                            {(w.amount / 100).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {new Date(w.created_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Formulaire retrait */}
        <div className="space-y-4">
          <h2 className="font-semibold text-[#1B3A6B]">Demander un retrait</h2>
          {!hasStripe ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
              Vous devez d'abord connecter votre compte Stripe dans{' '}
              <a href="/freelance/settings" className="underline font-medium">Paramètres</a>.
            </div>
          ) : (
            <WithdrawalForm availableBalance={available} />
          )}

          <div className="bg-[#F5F7FF] rounded-xl p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-[#1B3A6B]">Comment ça marche ?</p>
            <ul className="space-y-1.5 text-xs">
              <li>• Montant minimum de retrait : <strong>20 €</strong></li>
              <li>• Virement sous <strong>3–5 jours ouvrés</strong></li>
              <li>• Une seule demande à la fois</li>
              <li>• IBAN optionnel — sinon virement sur votre compte Stripe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
