'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ServiceGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-[#E8F0FB] to-[#C9D9F5] flex items-center justify-center text-6xl">
        📄
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group">
        <img src={images[active]} alt="" className="w-full h-full object-cover" />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActive(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                active === i ? 'border-[#1B3A6B]' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
