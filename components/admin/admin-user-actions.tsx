'use client'

import { useState } from 'react'
import { verifyDiploma, suspendUser } from '@/lib/supabase/admin-actions'
import { CheckCircle, Ban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUserActionsProps {
  userId:          string
  role:            string
  diplomaVerified: boolean
}

export function AdminUserActions({ userId, role, diplomaVerified }: AdminUserActionsProps) {
  const [verifying,   setVerifying]   = useState(false)
  const [suspending,  setSuspending]  = useState(false)
  const [verified,    setVerified]    = useState(diplomaVerified)
  const [suspended,   setSuspended]   = useState(false)

  const isFreelance = role === 'freelance' || role === 'both'

  async function handleVerify() {
    setVerifying(true)
    try {
      const r = await verifyDiploma(userId)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      setVerified(true)
      toast.success('Diplôme vérifié !')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSuspend() {
    if (!confirm('Suspendre cet utilisateur définitivement ?')) return
    setSuspending(true)
    try {
      const r = await suspendUser(userId)
      if ('error' in r && r.error) { toast.error(String(r.error)); return }
      setSuspended(true)
      toast.success('Utilisateur suspendu')
    } finally {
      setSuspending(false)
    }
  }

  if (suspended) {
    return <span className="text-xs text-red-500 font-medium">Suspendu</span>
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {isFreelance && !verified && (
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center gap-1.5 text-xs font-medium text-[#C9963A] hover:text-[#b8872f] transition-colors disabled:opacity-50"
        >
          {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          Vérifier diplôme
        </button>
      )}
      <button
        onClick={handleSuspend}
        disabled={suspending}
        className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        {suspending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
        Suspendre
      </button>
    </div>
  )
}
