import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { DeliverOrderForm } from '@/components/orders/deliver-order-form'
import { ContactButton } from '@/components/orders/contact-button'
import { Clock, Download, FileText, CheckCircle2, Circle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Détail commande' }

const FORMULA_LABEL: Record<string, string> = {
  basic: 'Basique', standard: 'Standard', premium: 'Premium',
}

// Statuts "en cours" — inclut les valeurs Sprint 1 (active) et Sprint 3 (paid, in_progress)
const CAN_DELIVER_STATUSES = ['active', 'paid', 'in_progress', 'revision_requested'] as const

// ── Timeline ──────────────────────────────────────────────────────────────

type TimelineStep = { label: string; sublabel?: string; statuses: string[] }

const TIMELINE_STEPS: TimelineStep[] = [
  {
    label:    'Payée',
    sublabel: 'Paiement confirmé',
    statuses: ['paid', 'active', 'in_progress', 'delivered', 'revision_requested', 'completed'],
  },
  {
    label:    'En cours',
    sublabel: 'Travail en cours',
    statuses: ['active', 'in_progress', 'delivered', 'revision_requested', 'completed'],
  },
  {
    label:    'Livrée',
    sublabel: 'En attente de validation',
    statuses: ['delivered', 'revision_requested', 'completed'],
  },
  {
    label:    'Terminée',
    sublabel: 'Paiement libéré',
    statuses: ['completed'],
  },
]

function OrderTimeline({ status }: { status: string }) {
  const isCancelled = ['cancelled', 'refunded', 'disputed'].includes(status)
  if (isCancelled) return null

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-start gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done    = step.statuses.includes(status)
          const current = TIMELINE_STEPS[i].statuses.includes(status) &&
                          (i === TIMELINE_STEPS.length - 1 || !TIMELINE_STEPS[i + 1].statuses.includes(status))

          return (
            <div key={step.label} className="flex items-start flex-1 last:flex-none">
              {/* Étape */}
              <div className="flex flex-col items-center min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                  ${done
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <Circle className="w-4 h-4" />
                  }
                </div>
                <p className={`text-xs font-semibold mt-1.5 text-center whitespace-nowrap
                  ${done ? 'text-[#1B3A6B]' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {current && (
                  <p className="text-[10px] text-[#2E6DB4] text-center mt-0.5 whitespace-nowrap">
                    {step.sublabel}
                  </p>
                )}
              </div>

              {/* Connecteur */}
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-1
                  ${TIMELINE_STEPS[i + 1].statuses.includes(status)
                    ? 'bg-[#1B3A6B]'
                    : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function FreelanceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
      services!service_id(id, title, slug),
      profiles!client_id(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .eq('freelance_id', user.id)
    .single()

  if (!order) notFound()

  const service    = order.services as unknown as { id: string; title: string; slug: string }
  const client     = order.profiles as unknown as { id: string; full_name: string; avatar_url: string | null }
  const initials   = client.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const canDeliver = (CAN_DELIVER_STATUSES as readonly string[]).includes(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">{service.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Formule {FORMULA_LABEL[order.formula] ?? order.formula} · #{id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Timeline */}
      <OrderTimeline status={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">

          {/* Formulaire de livraison — affiché en premier quand actionnable */}
          {canDeliver && (
            <div className="bg-white rounded-xl border border-[#1B3A6B]/20 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1B3A6B] animate-pulse" />
                <h2 className="font-semibold text-[#1B3A6B]">
                  {order.status === 'revision_requested'
                    ? 'Envoyer la révision'
                    : 'Livrer la commande'}
                </h2>
              </div>
              <DeliverOrderForm orderId={order.id} userId={user.id} />
            </div>
          )}

          {/* Révision demandée */}
          {order.delivery_file_url && order.status === 'revision_requested' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-orange-800 text-sm">Révision demandée par le client</h2>
              <p className="text-sm text-orange-700">
                Préparez une nouvelle version et livrez-la via le formulaire ci-dessus.
              </p>
              <a
                href={order.delivery_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-orange-700 hover:underline"
              >
                <Download className="w-4 h-4" /> Voir ma livraison précédente
              </a>
            </div>
          )}

          {/* Livraison terminée */}
          {order.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
              <h2 className="font-semibold text-green-800">✓ Commande terminée</h2>
              <p className="text-sm text-green-700">
                Le client a validé votre livraison.{' '}
                <strong>{(order.freelance_amount / 100).toFixed(2)} €</strong> ont été transférés
                sur votre compte Stripe.
              </p>
            </div>
          )}

          {/* Livraison envoyée, en attente de validation */}
          {order.status === 'delivered' && order.delivery_file_url && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-purple-800 text-sm">Livraison envoyée — en attente de validation</h2>
              {order.delivery_message && (
                <p className="text-sm text-purple-700">{order.delivery_message}</p>
              )}
              <a
                href={order.delivery_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-purple-700 hover:underline"
              >
                <Download className="w-4 h-4" /> Fichier livré
              </a>
            </div>
          )}

          {/* Instructions du client */}
          {order.instructions && (
            <div className="bg-white rounded-xl border p-6 space-y-2">
              <h2 className="font-semibold text-[#1B3A6B]">Instructions du client</h2>
              <p className="text-sm text-[#333] whitespace-pre-line">{order.instructions}</p>
            </div>
          )}

          {/* Fichiers joints par le client */}
          {order.file_urls && (order.file_urls as string[]).length > 0 && (
            <div className="bg-white rounded-xl border p-6 space-y-3">
              <h2 className="font-semibold text-[#1B3A6B]">Fichiers joints par le client</h2>
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

          {/* Pas de contenu actionnable */}
          {!canDeliver && order.status !== 'completed' && order.status !== 'delivered' &&
           order.status !== 'revision_requested' && !order.instructions &&
           !(order.file_urls as string[])?.length && (
            <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground text-sm">
              En attente de confirmation de paiement par le client…
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Gains */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-[#1B3A6B] text-sm">Vos gains</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix client</span>
                <span>{(order.amount / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Commission (20%)</span>
                <span>−{(order.commission_amount / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-green-700 border-t pt-2 mt-1">
                <span>Votre net</span>
                <span>{(order.freelance_amount / 100).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                <span>Délai convenu</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{order.delivery_days} jours
                </span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Payée le</span>
                  <span>{new Date(order.paid_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold text-[#1B3A6B] text-sm">Client</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#1B3A6B]">{initials}</span>
                )}
              </div>
              <p className="font-medium text-[#333] text-sm">{client.full_name}</p>
            </div>
            <ContactButton otherUserId={client.id} redirectBase="/freelance/messages" />
          </div>

          <Link
            href={`/services/${service.slug}`}
            className="block text-sm text-[#2E6DB4] hover:underline"
          >
            Voir mon service →
          </Link>
        </div>
      </div>
    </div>
  )
}
