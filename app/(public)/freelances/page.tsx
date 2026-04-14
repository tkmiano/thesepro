import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Star, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABEL } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nos experts académiques — ThèsePro',
  description: 'Découvrez nos freelances vérifiés : thèse, mémoire, correction, statistiques. Diplômes validés, avis réels.',
}

export default async function FreelancesPage() {
  const supabase = await createClient()

  const { data: freelances } = await supabase
    .from('profiles')
    .select('id, full_name, slug, avatar_url, bio, specialties, avg_rating, total_reviews, diploma_verified')
    .eq('role', 'freelance')
    .eq('is_active', true)
    .order('avg_rating', { ascending: false })
    .limit(48)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">Nos experts académiques</h1>
          <p className="text-blue-100 text-lg">
            Tous nos freelances sont diplômés et vérifiés par notre équipe.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {!freelances || freelances.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Aucun expert disponible pour le moment.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelances.map((f) => (
              <Link
                key={f.id}
                href={`/freelances/${f.slug ?? f.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.avatar_url}
                      alt={f.full_name ?? ''}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#E8F0FB] flex items-center justify-center text-[#1B3A6B] font-bold text-lg">
                      {(f.full_name ?? 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-[#1B3A6B]">{f.full_name}</div>
                    {f.diploma_verified && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Diplôme vérifié
                      </div>
                    )}
                  </div>
                </div>

                {f.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">{f.bio}</p>
                )}

                {f.specialties && (f.specialties as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(f.specialties as string[]).slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {CATEGORY_LABEL[s as keyof typeof CATEGORY_LABEL] ?? s}
                      </Badge>
                    ))}
                  </div>
                )}

                {(f.total_reviews ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="w-4 h-4 fill-[#C9963A] text-[#C9963A]" />
                    <span className="font-medium text-gray-700">{Number(f.avg_rating).toFixed(1)}</span>
                    <span>({f.total_reviews} avis)</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
