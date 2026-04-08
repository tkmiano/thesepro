import Link from 'next/link'
import { Star, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABEL } from '@/lib/constants'

interface ServiceCardProps {
  service: {
    id: string
    slug: string
    title: string
    category: string
    basic_price: number
    basic_delivery_days: number
    avg_rating: number
    total_reviews?: number
    tags: string[]
  }
  freelance: {
    full_name: string
    avatar_url: string | null
    academic_title?: string | null
    diploma_verified: boolean
    avg_rating?: number
    total_reviews?: number
  }
  imageUrl?: string
}

export function ServiceCard({ service, freelance, imageUrl }: ServiceCardProps) {
  const initials = freelance.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Link href={`/services/${service.slug}`} className="group block">
      <article className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="aspect-video bg-gradient-to-br from-[#E8F0FB] to-[#C9D9F5] overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {['✏️','📝','📊','🎓','🌐','📚'][
                ['correction-revision','redaction-academique','statistiques-analyse','tutorat-coaching','traduction-academique','publication-scientifique']
                  .indexOf(service.category)
              ] ?? '📄'}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Freelance */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
              {freelance.avatar_url ? (
                <img src={freelance.avatar_url} alt={freelance.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-[#1B3A6B]">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#1B3A6B] truncate">{freelance.full_name}</p>
              {freelance.diploma_verified && (
                <span className="text-[10px] text-[#C9963A] font-medium">✓ Diplôme vérifié</span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-[#1B3A6B] line-clamp-2 flex-1 group-hover:text-[#2E6DB4] transition-colors">
            {service.title}
          </h3>

          {/* Category */}
          <Badge variant="secondary" className="text-xs w-fit">
            {CATEGORY_LABEL[service.category] ?? service.category}
          </Badge>

          {/* Rating + Price */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#C9963A] text-[#C9963A]" />
              <span className="text-xs font-medium">
                {service.avg_rating > 0 ? service.avg_rating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{service.basic_delivery_days}j</span>
            </div>
            <span className="text-sm font-bold text-[#1B3A6B]">
              À partir de {service.basic_price} €
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
