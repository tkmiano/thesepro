import { StarDisplay } from './star-rating'
import { ReplyForm } from './reply-form'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Review {
  id:                   string
  rating:               number
  quality_rating:       number | null
  communication_rating: number | null
  delay_rating:         number | null
  comment:              string | null
  freelance_reply:      string | null
  created_at:           string
  profiles:             { full_name: string; avatar_url: string | null } | null
}

interface ReviewListProps {
  reviews:        Review[]
  total:          number
  isFreelance?:   boolean  // Si true, afficher le formulaire de réponse
}

export function ReviewList({ reviews, total, isFreelance = false }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucun avis pour le moment.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{total} avis</p>
      {reviews.map(review => {
        const client   = review.profiles
        const initials = client?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
        const time     = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: fr })

        return (
          <div key={review.id} className="bg-white rounded-xl border p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
                  {client?.avatar_url ? (
                    <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-[#1B3A6B]">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#333]">{client?.full_name ?? 'Anonyme'}</p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
              </div>
              <StarDisplay rating={review.rating} size="sm" />
            </div>

            {/* Sous-critères */}
            {(review.quality_rating || review.communication_rating || review.delay_rating) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {review.quality_rating && (
                  <div className="flex items-center gap-1">
                    <span>Qualité</span>
                    <StarDisplay rating={review.quality_rating} size="sm" />
                  </div>
                )}
                {review.communication_rating && (
                  <div className="flex items-center gap-1">
                    <span>Communication</span>
                    <StarDisplay rating={review.communication_rating} size="sm" />
                  </div>
                )}
                {review.delay_rating && (
                  <div className="flex items-center gap-1">
                    <span>Délais</span>
                    <StarDisplay rating={review.delay_rating} size="sm" />
                  </div>
                )}
              </div>
            )}

            {/* Commentaire */}
            {review.comment && (
              <p className="text-sm text-[#333] leading-relaxed">{review.comment}</p>
            )}

            {/* Réponse freelance existante */}
            {review.freelance_reply && (
              <div className="bg-[#F5F5F5] rounded-lg px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-[#1B3A6B]">Réponse du freelance</p>
                <p className="text-sm text-[#555]">{review.freelance_reply}</p>
              </div>
            )}

            {/* Formulaire de réponse (freelance) */}
            {isFreelance && !review.freelance_reply && (
              <ReplyForm reviewId={review.id} />
            )}
          </div>
        )
      })}
    </div>
  )
}
