'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deliverOrder } from '@/lib/supabase/order-actions'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeliverOrderFormProps {
  orderId:  string
  userId:   string
}

export function DeliverOrderForm({ orderId, userId }: DeliverOrderFormProps) {
  const [message, setMessage]       = useState('')
  const [fileUrl, setFileUrl]       = useState<string | null>(null)
  const [fileName, setFileName]     = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router  = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `${userId}/delivery-${orderId}.${ext}`

    const { error } = await supabase.storage
      .from('order-files')
      .upload(path, file, { upsert: true })

    if (error) {
      toast.error('Erreur upload : ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('order-files').getPublicUrl(path)
    setFileUrl(urlData.publicUrl)
    setFileName(file.name)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fileUrl) {
      toast.error('Veuillez joindre un fichier de livraison')
      return
    }

    setSubmitting(true)
    try {
      const result = await deliverOrder(orderId, fileUrl, message)

      if ('error' in result) {
        toast.error(result.error ?? 'Erreur inconnue', { duration: 8000 })
        return
      }

      toast.success('Livraison envoyée au client !')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[DeliverOrderForm] Exception :', msg)
      toast.error(`Erreur inattendue : ${msg}`, { duration: 8000 })
    } finally {
      // Toujours réinitialiser l'état de chargement — qu'il y ait succès ou erreur
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
          Message de livraison
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="Décrivez ce que vous livrez, les points importants, instructions d'utilisation…"
          className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
        />
      </div>

      {/* Fichier */}
      <div>
        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
          Fichier livrable <span className="text-red-500">*</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm text-[#2E6DB4] hover:text-[#1B3A6B] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Upload en cours…' : fileName ?? 'Choisir le fichier à livrer'}
        </button>
        {fileName && !uploading && (
          <p className="text-xs text-green-600 mt-1">✓ {fileName}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting || !fileUrl}
        className="bg-[#1B3A6B] hover:bg-[#2E6DB4]"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Envoyer la livraison
      </Button>
    </form>
  )
}
