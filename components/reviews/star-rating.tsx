'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value:     number
  onChange?: (value: number) => void
  size?:     'sm' | 'md' | 'lg'
  readOnly?: boolean
}

const SIZES = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }

export function StarRating({ value, onChange, size = 'md', readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        >
          <Star
            className={`${SIZES[size]} transition-colors ${
              star <= active
                ? 'fill-[#C9963A] text-[#C9963A]'
                : 'fill-transparent text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// Version statique pour l'affichage (decimal support)
export function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${SIZES[size]} ${
            star <= rating
              ? 'fill-[#C9963A] text-[#C9963A]'
              : star - 0.5 <= rating
              ? 'fill-[#C9963A]/50 text-[#C9963A]'
              : 'fill-transparent text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}
