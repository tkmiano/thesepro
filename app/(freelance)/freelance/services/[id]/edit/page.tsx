import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ServiceForm } from '@/components/freelance/service-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Modifier le service' }

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: service } = await supabase
    .from('services')
    .select(`
      id, title, slug, category, subcategory, description,
      basic_price, basic_delivery_days, basic_description,
      standard_price, standard_delivery_days, standard_description,
      premium_price, premium_delivery_days, premium_description,
      tags, freelance_id,
      service_images(url, position)
    `)
    .eq('id', id)
    .eq('freelance_id', user.id)
    .single()

  if (!service) notFound()

  const imageUrls = (service.service_images as { url: string; position: number }[])
    ?.sort((a, b) => a.position - b.position)
    .map(img => img.url) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Modifier le service</h1>
        <p className="text-muted-foreground mt-1">{service.title}</p>
      </div>
      <ServiceForm
        userId={user.id}
        service={{
          id:                     service.id,
          title:                  service.title,
          category:               service.category,
          subcategory:            service.subcategory,
          description:            service.description,
          basic_price:            service.basic_price,
          basic_delivery_days:    service.basic_delivery_days,
          basic_description:      service.basic_description,
          standard_price:         service.standard_price,
          standard_delivery_days: service.standard_delivery_days,
          standard_description:   service.standard_description,
          premium_price:          service.premium_price,
          premium_delivery_days:  service.premium_delivery_days,
          premium_description:    service.premium_description,
          tags:                   service.tags ?? [],
          image_urls:             imageUrls,
          freelance_id:           service.freelance_id,
        }}
      />
    </div>
  )
}
