'use client'

import { useState } from 'react'
import { requestWithdrawal } from '@/lib/supabase/wallet-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowDownCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawalFormProps {
  availableBalance: number  // en centimes
}

export function WithdrawalForm({ availableBalance }: WithdrawalFormProps) {
  const [amount,     setAmount]     = useState('')
  const [iban,       setIban]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  const maxAmount = Math.floor(availableBalance / 100)  // en euros (entiers)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amountEuros = parseFloat(amount)
    if (isNaN(amountEuros) || amountEuros < 20) {
      toast.error('Montant minimum : 20 €')
      return
    }
    if (amountEuros > maxAmount) {
      toast.error(`Montant maximum disponible : ${maxAmount} €`)
      return
    }

    setSubmitting(true)
    try {
      const result = await requestWithdrawal({
        amount: Math.round(amountEuros * 100),
        iban:   iban.trim() || undefined,
      })
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setDone(true)
      toast.success('Demande de retrait envoyée !')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Demande envoyée !</p>
          <p className="text-xs text-green-700 mt-1">
            Votre virement sera traité sous 3–5 jours ouvrés.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-5 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="amount">Montant à retirer (€)</Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            min="20"
            max={maxAmount}
            step="0.01"
            placeholder="Ex : 150.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
        </div>
        {availableBalance > 0 && (
          <p className="text-xs text-muted-foreground">
            Solde disponible : {(availableBalance / 100).toFixed(2)} €
            {maxAmount >= 20 && (
              <button
                type="button"
                onClick={() => setAmount(String(maxAmount))}
                className="ml-2 text-[#2E6DB4] hover:underline"
              >
                Tout retirer
              </button>
            )}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="iban">IBAN (optionnel)</Label>
        <Input
          id="iban"
          type="text"
          placeholder="FR76 1234 5678 9012 3456 7890 123"
          value={iban}
          onChange={e => setIban(e.target.value.replace(/\s/g, '').toUpperCase())}
          maxLength={34}
        />
        <p className="text-xs text-muted-foreground">Laissez vide pour un virement sur votre compte Stripe</p>
      </div>

      <Button
        type="submit"
        disabled={submitting || !amount || parseFloat(amount) < 20}
        className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4]"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <ArrowDownCircle className="w-4 h-4 mr-2" />
        )}
        Demander le retrait
      </Button>
    </form>
  )
}
