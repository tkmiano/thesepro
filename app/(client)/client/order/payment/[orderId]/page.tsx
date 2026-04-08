import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PaymentFormLoader } from '@/components/stripe/payment-form-loader'
import { Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Paiement sécurisé' }

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params:       Promise<{ orderId: string }>
  searchParams: Promise<{ cs?: string; amount?: string }>
}) {
  const { orderId } = await params
  const { cs: clientSecret, amount: amountStr } = await searchParams

  if (!clientSecret) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, amount, services!service_id(title)')
    .eq('id', orderId)
    .eq('client_id', user.id)
    .single()

  if (!order) notFound()

  // Si la commande est déjà payée → redirige vers le suivi
  if (order.status !== 'pending_payment') {
    redirect(`/client/orders/${orderId}`)
  }

  const amountCents = parseInt(amountStr ?? '0') || order.amount
  const serviceTitle = (order.services as unknown as { title: string })?.title ?? 'Service'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Paiement sécurisé</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Votre commande sera activée dès confirmation du paiement.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-[#E8F0FB] rounded-lg px-4 py-3 text-sm text-[#1B3A6B]">
        <Shield className="w-4 h-4 shrink-0" />
        Le paiement est sécurisé. Les fonds sont libérés au freelance seulement après validation de votre livraison.
      </div>

      <PaymentFormLoader
        clientSecret={clientSecret}
        orderId={orderId}
        amountCents={amountCents}
        serviceTitle={serviceTitle}
      />
    </div>
  )
}
