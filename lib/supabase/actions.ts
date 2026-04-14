'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  full_name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  role: z.enum(['client', 'freelance', 'both']),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.role === 'freelance') {
    redirect('/freelance/dashboard')
  }
  redirect('/client/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      },
    },
  })

  if (error) {
    console.error('Supabase signup error:', error)
    if (error.message.includes('already registered')) {
      return { error: 'Un compte existe déjà avec cet email' }
    }
    return { error: error.message }
  }

  // Email de bienvenue (non-bloquant)
  const { sendWelcomeEmail } = await import('@/lib/email/send')
  sendWelcomeEmail({
    name:  parsed.data.full_name,
    email: parsed.data.email,
    role:  parsed.data.role,
  }).catch(console.error)

  redirect('/login?registered=true')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'Erreur lors de la connexion avec Google' }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
