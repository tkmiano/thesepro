import { getAdminUsers } from '@/lib/supabase/admin-actions'
import { AdminUserActions } from '@/components/admin/admin-user-actions'
import { CheckCircle, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Utilisateurs' }

const ROLE_LABEL: Record<string, string> = {
  client:   'Client',
  freelance: 'Freelance',
  both:     'Les deux',
  admin:    'Admin',
}

const ROLE_COLOR: Record<string, string> = {
  client:   'bg-blue-50 text-blue-700',
  freelance: 'bg-purple-50 text-purple-700',
  both:     'bg-indigo-50 text-indigo-700',
  admin:    'bg-red-50 text-red-700',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; page?: string; q?: string }>
}) {
  const { role, page, q } = await searchParams
  const currentPage = parseInt(page ?? '1')
  const { users, total } = await getAdminUsers(currentPage, role, q)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Utilisateurs <span className="text-muted-foreground font-normal text-lg">({total})</span></h1>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['', 'client', 'freelance', 'both', 'admin'].map(r => (
          <a
            key={r}
            href={r ? `?role=${r}` : '?'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              (role ?? '') === r
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-muted-foreground border-gray-200 hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
            }`}
          >
            {r === '' ? 'Tous' : ROLE_LABEL[r]}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Utilisateur</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rôle</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Inscrit le</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8F0FB] flex items-center justify-center shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#1B3A6B]">
                          {u.full_name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#333]">{u.full_name}</p>
                      {u.diploma_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#C9963A]">
                          <CheckCircle className="w-3 h-3" /> Diplôme vérifié
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-5 py-3 text-right">
                  <AdminUserActions userId={u.id} role={u.role} diplomaVerified={u.diploma_verified} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`?${role ? `role=${role}&` : ''}page=${p}`}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium border transition-colors ${
                p === currentPage
                  ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                  : 'bg-white text-muted-foreground border-gray-200 hover:border-[#1B3A6B]'
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
