import { getAdminKPIs, getTopServices } from '@/lib/supabase/admin-actions'
import { Users, ShoppingBag, TrendingUp, Star } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord' }

function KPICard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1B3A6B]">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [kpis, topServices] = await Promise.all([
    getAdminKPIs(),
    getTopServices(5),
  ])

  if (!kpis) {
    return <div className="text-center py-12 text-muted-foreground">Accès refusé</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Tableau de bord</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Utilisateurs"
          value={kpis.totalUsers.toLocaleString('fr-FR')}
          sub={`+${kpis.newUsersMonth} ce mois`}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <KPICard
          label="Commandes"
          value={kpis.totalOrders.toLocaleString('fr-FR')}
          sub={`+${kpis.ordersMonth} ce mois`}
          icon={ShoppingBag}
          color="bg-purple-50 text-purple-600"
        />
        <KPICard
          label="Revenu plateforme"
          value={`${(kpis.totalRevenue / 100).toFixed(2)} €`}
          sub="Commissions (20%)"
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
        />
        <KPICard
          label="Revenu ce mois"
          value="—"
          sub="Commandes en cours"
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Top services */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-[#1B3A6B]">Top services</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Service</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Freelance</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Commandes</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Note</th>
            </tr>
          </thead>
          <tbody>
            {topServices.map(s => {
              const prof = s.profiles as unknown as { full_name: string }
              return (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-[#333] max-w-[220px] truncate">{s.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{prof?.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold">{s.orders_count}</td>
                  <td className="px-5 py-3 text-right">
                    {s.avg_rating > 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#C9963A] text-[#C9963A]" />
                        {Number(s.avg_rating).toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
