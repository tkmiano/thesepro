'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/supabase/message-actions'
import { Button } from '@/components/ui/button'
import { Paperclip, Send, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MessageInputProps {
  conversationId: string
  userId:         string
  onMessageSent?: () => void
}

export function MessageInput({ conversationId, userId, onMessageSent }: MessageInputProps) {
  const [content, setContent]       = useState('')
  const [sending, setSending]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [attachment, setAttachment] = useState<{
    url: string; name: string; size: number
  } | null>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const textRef  = useRef<HTMLTextAreaElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 20 Mo)')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('message-files')
      .upload(path, file)

    if (error) {
      toast.error('Erreur upload : ' + error.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('message-files').getPublicUrl(path)
    setAttachment({ url: urlData.publicUrl, name: file.name, size: file.size })
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!content.trim() && !attachment) return

    setSending(true)
    try {
      const result = await sendMessage({
        conversationId,
        content:  content.trim() || undefined,
        fileUrl:  attachment?.url,
        fileName: attachment?.name,
        fileSize: attachment?.size,
      })

      if ('error' in result) {
        toast.error(result.error, { duration: 8000 })
        return
      }

      setContent('')
      setAttachment(null)
      onMessageSent?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      {/* Pièce jointe sélectionnée */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 bg-[#E8F0FB] rounded-lg px-3 py-2 text-sm">
          <Paperclip className="w-3.5 h-3.5 text-[#1B3A6B] shrink-0" />
          <span className="flex-1 truncate text-[#1B3A6B]">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-[#1B3A6B] hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Bouton fichier */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !!attachment}
          className="text-muted-foreground hover:text-[#1B3A6B] disabled:opacity-40 shrink-0 pb-2.5"
        >
          {uploading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Paperclip className="w-5 h-5" />
          }
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.txt"
          onChange={handleFileChange}
        />

        {/* Zone de texte */}
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
          rows={1}
          className="flex-1 resize-none border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] max-h-32 overflow-y-auto"
          style={{ minHeight: '42px' }}
          onInput={e => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 128) + 'px'
          }}
        />

        {/* Bouton envoyer */}
        <Button
          type="submit"
          disabled={sending || uploading || (!content.trim() && !attachment)}
          size="icon"
          className="bg-[#1B3A6B] hover:bg-[#2E6DB4] shrink-0 rounded-xl w-10 h-10"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </form>
  )
}
