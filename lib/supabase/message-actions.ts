'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from './notification-actions'

// ── Filtre anti-contact ────────────────────────────────────────────────────

const EMAIL_REGEX    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/
const PHONE_REGEX    = /(\+?\d{1,3}[\s.\-]?)?\b(0[67]\d{8}|0[1-9](\s?\d{2}){4}|\d{10})\b/

function containsContact(text: string): boolean {
  return EMAIL_REGEX.test(text) || PHONE_REGEX.test(text)
}

// ── Obtenir ou créer une conversation ─────────────────────────────────────

export async function getOrCreateConversation(otherUserId: string, orderId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (user.id === otherUserId) return { error: 'Impossible de vous écrire à vous-même' }

  // Chercher une conversation existante entre les deux participants
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),` +
      `and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`
    )
    .limit(1)
    .maybeSingle()

  if (existing) return { conversationId: existing.id }

  // Créer une nouvelle conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      participant_1_id: user.id,
      participant_2_id: otherUserId,
      order_id:         orderId ?? null,
    })
    .select('id')
    .single()

  if (error || !newConv) return { error: error?.message ?? 'Erreur création conversation' }

  return { conversationId: newConv.id }
}

// ── Envoyer un message ────────────────────────────────────────────────────

export async function sendMessage({
  conversationId,
  content,
  fileUrl,
  fileName,
  fileSize,
}: {
  conversationId: string
  content?:       string
  fileUrl?:       string
  fileName?:      string
  fileSize?:      number
}) {
  if (!content?.trim() && !fileUrl) return { error: 'Message vide' }

  // Filtre anti-contact (côté serveur)
  if (content && containsContact(content)) {
    return {
      error: 'Les coordonnées personnelles (email, téléphone) sont interdites dans les messages pour votre sécurité. Utilisez la plateforme pour tous vos échanges.',
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que l'utilisateur est bien participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_1_id, participant_2_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return { error: 'Conversation introuvable' }
  const isParticipant = conv.participant_1_id === user.id || conv.participant_2_id === user.id
  if (!isParticipant) return { error: 'Accès refusé' }

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id:       user.id,
      content:         content?.trim() ?? null,
      file_url:        fileUrl ?? null,
      file_name:       fileName ?? null,
      file_size:       fileSize ?? null,
      is_read:         false,
    })
    .select('id')
    .single()

  if (error || !msg) return { error: error?.message ?? 'Erreur envoi' }

  // Notification au destinataire (non bloquant)
  const recipientId = conv.participant_1_id === user.id
    ? conv.participant_2_id
    : conv.participant_1_id

  createNotification({
    userId:  recipientId,
    type:    'new_message',
    title:   'Nouveau message',
    message: content?.slice(0, 80) ?? 'Fichier joint',
    link:    `/client/messages/${conversationId}`,
  }).catch(console.error)

  revalidatePath(`/client/messages/${conversationId}`)
  revalidatePath(`/freelance/messages/${conversationId}`)
  return { success: true, messageId: msg.id }
}

// ── Liste des conversations de l'utilisateur ──────────────────────────────

export async function getConversations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('conversations')
    .select(`
      id, last_message_at, order_id,
      participant_1:profiles!participant_1_id(id, full_name, avatar_url),
      participant_2:profiles!participant_2_id(id, full_name, avatar_url)
    `)
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  if (!data) return []

  // Pour chaque conversation : dernier message + unread count
  const enriched = await Promise.all(
    data.map(async (conv) => {
      const [{ data: lastMsg }, { count: unreadCount }] = await Promise.all([
        supabase
          .from('messages')
          .select('content, file_name, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', user.id),
      ])

      const otherParticipant =
        (conv.participant_1 as unknown as { id: string; full_name: string; avatar_url: string | null }).id === user.id
          ? conv.participant_2
          : conv.participant_1

      return {
        id:               conv.id,
        lastMessageAt:    conv.last_message_at,
        orderId:          conv.order_id,
        otherParticipant: otherParticipant as unknown as { id: string; full_name: string; avatar_url: string | null },
        lastMessage:      lastMsg,
        unreadCount:      unreadCount ?? 0,
      }
    })
  )

  return enriched
}

// ── Messages d'une conversation ───────────────────────────────────────────

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { messages: [], currentUserId: '' }

  // Vérifier la participation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_1_id, participant_2_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return { messages: [], currentUserId: user.id }
  const isParticipant = conv.participant_1_id === user.id || conv.participant_2_id === user.id
  if (!isParticipant) return { messages: [], currentUserId: user.id }

  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, content, file_url, file_name, file_size, is_read, created_at,
      sender:profiles!sender_id(id, full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  return { messages: messages ?? [], currentUserId: user.id }
}

// ── Marquer les messages comme lus ────────────────────────────────────────

export async function markMessagesRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', user.id)  // Marquer seulement les messages reçus
}

// ── Compter les messages non lus total ────────────────────────────────────

export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Récupérer toutes les conversations de l'utilisateur
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)

  if (!convs?.length) return 0

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', convs.map(c => c.id))
    .eq('is_read', false)
    .neq('sender_id', user.id)

  return count ?? 0
}
