'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'new_message'
  | 'new_order'
  | 'order_delivered'
  | 'order_completed'
  | 'revision_requested'

// ── Créer une notification (service role) ─────────────────────────────────

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId:  string
  type:    NotificationType
  title:   string
  message: string
  link?:   string
}) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link:    link ?? null,
    is_read: false,
  })
  if (error) console.error('[createNotification]', error.message)
}

// ── Compter les non lues (pour le badge) ──────────────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}

// ── Récupérer les 10 dernières notifications ──────────────────────────────

export async function getRecentNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, message, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return data ?? []
}

// ── Marquer une notification comme lue ────────────────────────────────────

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

// ── Tout marquer comme lu ─────────────────────────────────────────────────

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/', 'layout')
}
