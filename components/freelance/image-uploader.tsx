'use client'

import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
  userId: string
  maxImages?: number
}

export function ImageUploader({ images, onChange, userId, maxImages = 5 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`)
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of fileArray) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`)
        continue
      }
      const ext  = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from('service-images').upload(path, file)
      if (error) {
        toast.error(`Erreur upload : ${file.name}`)
      } else {
        const { data } = supabase.storage.from('service-images').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
    }

    onChange([...images, ...newUrls])
    setIsUploading(false)
  }

  function removeImage(url: string) {
    onChange(images.filter(u => u !== url))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50">
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-[#1B3A6B]/30 hover:border-[#1B3A6B] cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#1B3A6B] transition-colors">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-[10px] text-center">Ajouter</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} images · JPG, PNG, WebP · Max 5MB chacune
      </p>
    </div>
  )
}
