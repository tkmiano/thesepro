import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { CompleteOrderButton } from '@/components/orders/complete-order-button'
import { RequestRevisionButton } from '@/components/orders/request-revision-button'
import { ReviewTrigger } from '@/components/orders/review-trigger'
import { ContactButton } from '@/components/orders/contact-button'
import { CheckCircle, Clock, Download, FileText, User } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Suivi de commande' }

const FORMULA_LABEL: Record<string, string> = {
  basic: 'Basique', standard: 'Standard', premium: 'Premium',
}

const STATUS_STEPS = [
  { key: 'pending_payment', label: 'Paiement'   },
  { key: 'paid',            label: 'En attente' },
  { key: 'in_progress',     label: 'En cours'   },
  { key: 'delivered',       label: 'Livré'      },
  { key: 'completed',       label: 'Terminé'    },
]

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status)
  if (idx !== -1) return idx
  if (status === 'revision_requested') return 3
  return 0
}

export default async function ClientOrderDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ paid?: string }>
}) {
  const { id }    = await params
  const { paid }  = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, formula, amount, freelance_amount, commission_amount,
      delivery_days, instructions, file_urls,
      delivery_file_url, delivery_message,
      created_at, paid_at, delivered_at, completed_at,
      stripe_payment_intent_id,
      services!service_id(id, title, slug, category),
      profiles!freelance_id(id, full_name, avatar_url, slug)
    `)
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!order) notFound()

  const service   = order.services as unknown as { id: string; title: string; slug: string; category: string }
  const freelance = order.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; slug: string | null }
  const stepIndex = getStepIndex(order.status)

  const initials = freelance.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // Vérifier si un avis a déjà été soumis pour cette commande
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', id)
    .single()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B] leading-snug">{service.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Formule {FORMULA_LABEL[order.formula] ?? order.formula} · #{id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Confirmation paiement */}
      {paid === '1' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Paiement confirmé ! Le freelance a été notifié et va commencer votre commande.
        </div>
      )}

      {/* Stepper */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                    ${i <= stepIndex
                      ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                      : 'bg-white border-gray-200 text-muted-foreground'
                    }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium whitespace-nowrap
                    ${i <= stepIndex ? 'text-[#1B3A6B]' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4
                    ${i < stepIndex ? 'bg-[#1B3A6B]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Livraison */}
          {order.delivery_file_url && (
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-[#1B3A6B]">Livraison du freelance</h2>
              {order.delivery_message && (
                <p className="text-sm text-[#333] whitespace-pre-line">{order.delivery_message}</p>
              )}
              <a
                href={order.delivery_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#E8F0FB] text-[#1B3A6B] text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#1B3A6B] hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Télécharger le fichier livré
              </a>

              {/* Actions client */}
              {order.status === 'delivered' && (
                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <CompleteOrderButton orderId={order.id} />
                  <RequestRevisionButton orderId={order.id} />
                </div>
              )}

              {/* Laisser un avis (commande terminée, pas encore noté) */}
              {order.status === 'completed' && !existingReview && (
                <div className="pt-2 border-t">
                  <ReviewTrigger orderId={order.id} serviceTitle={service.title} />
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {order.instructions && (
            <div className="bg-white rounded-xl border p-6 space-y-2">
              <h2 className="font-semibold text-[#1B3A6B]">Vos instructions</h2>
              <p className="text-sm text-[#333] whitespace-pre-line">{order.instructions}</p>
            </div>
          )}

          {/* Fichiers joints */}
          {order.file_urls && (order.file_urls as string[]).length > 0 && (
            <div className="bg-white rounded-xl border p-6 space-y-3">
              <h2 className="font-semibold text-[#1B3A6B]">Fichiers joints</h2>
              <ul className="space-y-2">
                {(order.file_urls as string[]).map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#2E6DB4] hover:underline"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      Fichier {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Récap financier */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-[#1B3A6B] text-sm">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant payé</span>
                <span className="font-bold text-[#1B3A6B]">{(order.amount / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Délai convenu</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{order.delivery_days} jours
                </span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payé le</span>
                  <span>{new Date(order.paid_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Freelance */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-[#1B3A6B] text-sm">Freelance</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
                {freelance.avatar_url ? (
                  <img src={freelance.avatar_url} alt={freelance.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#1B3A6B]">{initials}</span>
                )}
              </div>
              <div>
                <p className="font-medium text-[#333] text-sm">{freelance.full_name}</p>
                {freelance.slug && (
                  <Link
                    href={`/freelances/${freelance.slug}`}
                    className="text-xs text-[#2E6DB4] hover:underline"
                  >
                    Voir le profil →
                  </Link>
                )}
              </div>
            </div>
            <ContactButton otherUserId={freelance.id} redirectBase="/client/messages" />
          </div>

          {/* Lien service */}
          <Link
            href={`/services/${service.slug}`}
            className="flex items-center gap-2 text-sm text-[#2E6DB4] hover:underline"
          >
            <User className="w-3.5 h-3.5" />
            Voir le service
          </Link>
        </div>
      </div>
    </div>
  )
}
