import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { NewOrderForm } from '@/components/orders/new-order-form'
import { CATEGORY_LABEL } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Passer une commande' }

const FORMULA_LABEL: Record<string, string> = {
  basic:    'Basique',
  standard: 'Standard',
  premium:  'Premium',
}

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; formula?: string }>
}) {
  const { service: serviceId, formula: formulaParam } = await searchParams
  if (!serviceId) notFound()

  const formula = (formulaParam === 'standard' || formulaParam === 'premium') ? formulaParam : 'basic'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifier que l'utilisateur est un client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'freelance') redirect('/freelance/dashboard')

  // Charger le service
  const { data: service } = await supabase
    .from('services')
    .select(`
      id, title, category, slug,
      basic_price, basic_delivery_days, basic_description,
      standard_price, standard_delivery_days, standard_description,
      premium_price, premium_delivery_days, premium_description,
      profiles!freelance_id(full_name, avatar_url)
    `)
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  if (!service) notFound()

  // Construire les infos de la formule sélectionnée
  const formulaMap = {
    basic: {
      label:         FORMULA_LABEL.basic,
      price:         service.basic_price,
      delivery_days: service.basic_delivery_days,
      description:   service.basic_description,
    },
    standard: service.standard_price ? {
      label:         FORMULA_LABEL.standard,
      price:         service.standard_price,
      delivery_days: service.standard_delivery_days ?? 7,
      description:   service.standard_description,
    } : null,
    premium: service.premium_price ? {
      label:         FORMULA_LABEL.premium,
      price:         service.premium_price,
      delivery_days: service.premium_delivery_days ?? 14,
      description:   service.premium_description,
    } : null,
  }

  const formulaInfo = formulaMap[formula as 'basic' | 'standard' | 'premium']
  if (!formulaInfo) notFound()

  const freelance = service.profiles as unknown as { full_name: string; avatar_url: string | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Passer une commande</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {CATEGORY_LABEL[service.category] ?? service.category} · par {freelance.full_name}
        </p>
      </div>

      <NewOrderForm
        userId={user.id}
        serviceId={service.id}
        serviceTitle={service.title}
        formula={formula as 'basic' | 'standard' | 'premium'}
        formulaInfo={formulaInfo}
      />
    </div>
  )
}
