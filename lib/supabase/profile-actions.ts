'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateProfileData {
  full_name: string
  academic_title?: string
  bio?: string
  disciplines: string[]
  languages: string[]
  avatar_url?: string | null
  diploma_url?: string | null
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:      data.full_name,
      academic_title: data.academic_title || null,
      bio:            data.bio || null,
      disciplines:    data.disciplines,
      languages:      data.languages,
      avatar_url:     data.avatar_url ?? undefined,
      diploma_url:    data.diploma_url ?? undefined,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { error: error.message }
  }

  revalidatePath('/freelance/settings')
  revalidatePath('/', 'layout')
  return {}
}
