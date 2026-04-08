'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod/v4'

// ── Schéma de validation ───────────────────────────────────────────────────

const ReviewSchema = z.object({
  orderId:              z.string().uuid(),
  rating:               z.number().int().min(1).max(5),
  qualityRating:        z.number().int().min(1).max(5).optional(),
  communicationRating:  z.number().int().min(1).max(5).optional(),
  delayRating:          z.number().int().min(1).max(5).optional(),
  comment:              z.string().min(20, 'Minimum 20 caractères').max(500, 'Maximum 500 caractères'),
})

export type ReviewInput = z.infer<typeof ReviewSchema>

// ── Créer un avis ─────────────────────────────────────────────────────────

export async function createReview(input: ReviewInput) {
  const parsed = ReviewSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que la commande est bien complétée et appartient au client
  const { data: order } = await supabase
    .from('orders')
    .select('id, service_id, freelance_id, status')
    .eq('id', parsed.data.orderId)
    .eq('client_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!order) return { error: 'Commande introuvable ou non terminée' }

  // Vérifier qu'un avis n'existe pas déjà
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', parsed.data.orderId)
    .single()

  if (existing) return { error: 'Vous avez déjà laissé un avis pour cette commande' }

  const { error } = await supabase.from('reviews').insert({
    order_id:             parsed.data.orderId,
    client_id:            user.id,
    freelance_id:         order.freelance_id,
    service_id:           order.service_id,
    rating:               parsed.data.rating,
    quality_rating:       parsed.data.qualityRating ?? null,
    communication_rating: parsed.data.communicationRating ?? null,
    delay_rating:         parsed.data.delayRating ?? null,
    comment:              parsed.data.comment,
  })

  if (error) return { error: error.message }

  revalidatePath(`/client/orders/${parsed.data.orderId}`)
  revalidatePath(`/services`)
  return { success: true }
}

// ── Répondre à un avis (freelance) ────────────────────────────────────────

export async function addFreelanceReply(reviewId: string, reply: string) {
  if (!reply.trim() || reply.length > 300) return { error: 'Réponse invalide (1–300 caractères)' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('reviews')
    .update({ freelance_reply: reply.trim() })
    .eq('id', reviewId)
    .eq('freelance_id', user.id)
    .is('freelance_reply', null)  // une seule réponse par avis

  if (error) return { error: error.message }

  revalidatePath('/freelance/orders')
  return { success: true }
}

// ── Récupérer les avis d'un service ───────────────────────────────────────

export async function getServiceReviews(serviceId: string, page = 1, perPage = 5) {
  const supabase = await createClient()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  const [{ data: reviews }, { count }] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, rating, quality_rating, communication_rating, delay_rating,
        comment, freelance_reply, created_at,
        profiles!client_id(full_name, avatar_url)
      `)
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId),
  ])

  return { reviews: reviews ?? [], total: count ?? 0 }
}

// ── Récupérer les avis d'un freelance ────────────────────────────────────────

export async function getFreelanceReviews(freelanceId: string, page = 1, perPage = 10) {
  const supabase = await createClient()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  const [{ data: reviews }, { count }] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, rating, quality_rating, communication_rating, delay_rating,
        comment, freelance_reply, created_at,
        profiles!client_id(full_name, avatar_url)
      `)
      .eq('freelance_id', freelanceId)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('freelance_id', freelanceId),
  ])

  return { reviews: reviews ?? [], total: count ?? 0 }
}
