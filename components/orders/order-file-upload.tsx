'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Paperclip, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OrderFileUploadProps {
  userId: string
  onUpload: (urls: string[]) => void
  maxFiles?: number
}

export function OrderFileUpload({ userId, onUpload, maxFiles = 5 }: OrderFileUploadProps) {
  const [files, setFiles]     = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    if (files.length + selected.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} fichiers autorisés`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const uploaded: { name: string; url: string }[] = []

    for (const file of selected) {
      const ext  = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('order-files')
        .upload(path, file)

      if (error) {
        toast.error(`Erreur upload : ${file.name}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('order-files')
        .getPublicUrl(path)

      uploaded.push({ name: file.name, url: urlData.publicUrl })
    }

    const next = [...files, ...uploaded]
    setFiles(next)
    onUpload(next.map(f => f.url))
    setUploading(false)

    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeFile(url: string) {
    const next = files.filter(f => f.url !== url)
    setFiles(next)
    onUpload(next.map(f => f.url))
  }

  return (
    <div className="space-y-3">
      {/* Zone d'upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || files.length >= maxFiles}
        className="flex items-center gap-2 text-sm text-[#2E6DB4] hover:text-[#1B3A6B] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
        {uploading ? 'Envoi en cours…' : `Joindre des fichiers (${files.length}/${maxFiles})`}
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
        onChange={handleFileChange}
      />

      {/* Liste des fichiers uploadés */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map(f => (
            <li key={f.url} className="flex items-center gap-2 text-sm bg-[#F5F5F5] rounded-md px-3 py-1.5">
              <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-[#333]">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(f.url)}
                className="text-muted-foreground hover:text-red-500 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
