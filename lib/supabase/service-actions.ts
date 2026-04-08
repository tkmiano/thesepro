'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/slugify'

export interface ServiceData {
  title: string
  category: string
  subcategory?: string
  description: string
  basic_price: number
  basic_delivery_days: number
  basic_description: string
  standard_price?: number
  standard_delivery_days?: number
  standard_description?: string
  premium_price?: number
  premium_delivery_days?: number
  premium_description?: string
  tags: string[]
  image_urls: string[]
}

async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title)
  let slug = base
  let i = 0
  while (true) {
    let q = supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { count } = await q
    if (!count) break
    i++
    slug = `${base}-${i}`
  }
  return slug
}

export async function createService(
  data: ServiceData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const slug = await generateUniqueSlug(supabase, data.title)

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      freelance_id:           user.id,
      title:                  data.title,
      slug,
      category:               data.category,
      subcategory:            data.subcategory || null,
      description:            data.description,
      basic_price:            data.basic_price,
      basic_delivery_days:    data.basic_delivery_days,
      basic_description:      data.basic_description,
      standard_price:         data.standard_price || null,
      standard_delivery_days: data.standard_delivery_days || null,
      standard_description:   data.standard_description || null,
      premium_price:          data.premium_price || null,
      premium_delivery_days:  data.premium_delivery_days || null,
      premium_description:    data.premium_description || null,
      tags:                   data.tags,
      is_active:              true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Service creation error:', error)
    return { error: error.message }
  }

  if (data.image_urls.length > 0) {
    await supabase.from('service_images').insert(
      data.image_urls.map((url, position) => ({ service_id: service.id, url, position }))
    )
  }

  revalidatePath('/freelance/services')
  revalidatePath('/services')
  return { id: service.id }
}

export async function updateService(
  id: string,
  data: ServiceData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('services')
    .update({
      title:                  data.title,
      category:               data.category,
      subcategory:            data.subcategory || null,
      description:            data.description,
      basic_price:            data.basic_price,
      basic_delivery_days:    data.basic_delivery_days,
      basic_description:      data.basic_description,
      standard_price:         data.standard_price || null,
      standard_delivery_days: data.standard_delivery_days || null,
      standard_description:   data.standard_description || null,
      premium_price:          data.premium_price || null,
      premium_delivery_days:  data.premium_delivery_days || null,
      premium_description:    data.premium_description || null,
      tags:                   data.tags,
    })
    .eq('id', id)
    .eq('freelance_id', user.id)

  if (error) {
    console.error('Service update error:', error)
    return { error: error.message }
  }

  await supabase.from('service_images').delete().eq('service_id', id)
  if (data.image_urls.length > 0) {
    await supabase.from('service_images').insert(
      data.image_urls.map((url, position) => ({ service_id: id, url, position }))
    )
  }

  revalidatePath('/freelance/services')
  revalidatePath('/services')
  return {}
}

export async function deleteService(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('freelance_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/freelance/services')
  revalidatePath('/services')
  return {}
}

export async function incrementServiceViews(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_service_views', { p_service_id: id })
}
