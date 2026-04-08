'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/supabase/profile-actions'
import { LANGUAGES, ACADEMIC_DISCIPLINES } from '@/lib/constants'
import { TagInput } from './tag-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Upload } from 'lucide-react'

const profileSchema = z.object({
  full_name:      z.string().min(2, 'Minimum 2 caractères'),
  academic_title: z.string().optional(),
  bio:            z.string().max(1000, 'Maximum 1000 caractères').optional(),
  disciplines:    z.array(z.string()),
  languages:      z.array(z.string()),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileData {
  id: string
  full_name: string
  academic_title: string | null
  bio: string | null
  disciplines: string[]
  languages: string[]
  avatar_url: string | null
  diploma_url: string | null
  diploma_verified: boolean
}

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [avatarUrl, setAvatarUrl]   = useState(profile.avatar_url ?? '')
  const [diplomaUrl, setDiplomaUrl] = useState(profile.diploma_url ?? '')
  const [uploading, setUploading]   = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema) as any,
      defaultValues: {
        full_name:      profile.full_name,
        academic_title: profile.academic_title ?? '',
        bio:            profile.bio ?? '',
        disciplines:    profile.disciplines ?? [],
        languages:      profile.languages ?? [],
      },
    })

  const disciplines = watch('disciplines')
  const languages   = watch('languages')

  async function uploadFile(
    file: File,
    bucket: string,
    path: string
  ): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo max 5MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const url = await uploadFile(file, 'avatars', `${profile.id}/avatar.${ext}`)
    if (url) { setAvatarUrl(url); toast.success('Photo mise à jour') }
    else toast.error("Erreur lors de l'upload")
    setUploading(false)
  }

  async function handleDiplomaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Diplôme max 10MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const url = await uploadFile(file, 'diplomas', `${profile.id}/diploma.${ext}`)
    if (url) { setDiplomaUrl(url); toast.success('Diplôme envoyé — en attente de vérification') }
    else toast.error("Erreur lors de l'upload du diplôme")
    setUploading(false)
  }

  async function onSubmit(data: ProfileFormData) {
    const result = await updateProfile({
      ...data,
      avatar_url:  avatarUrl || null,
      diploma_url: diplomaUrl || null,
    })
    if (result.error) toast.error(result.error)
    else toast.success('Profil mis à jour !')
  }

  const initials = profile.full_name.slice(0, 2).toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#E8F0FB] flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#1B3A6B]/20">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-[#1B3A6B]">{initials}</span>
          )}
        </div>
        <div className="space-y-1">
          <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-[#1B3A6B] hover:underline">
            <Upload className="w-4 h-4" />
            {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP · Max 5MB</p>
        </div>
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Nom complet *</Label>
        <Input id="full_name" {...register('full_name')} />
        {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
      </div>

      {/* Titre académique */}
      <div className="space-y-2">
        <Label htmlFor="academic_title">Titre académique</Label>
        <Input
          id="academic_title"
          {...register('academic_title')}
          placeholder="Ex : Doctorant en sciences sociales, PhD en économie…"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Biographie</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          rows={5}
          placeholder="Décrivez votre expertise, vos expériences, vos spécialités académiques…"
        />
        {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
      </div>

      {/* Disciplines */}
      <div className="space-y-2">
        <Label>Disciplines</Label>
        <TagInput
          tags={disciplines}
          onChange={tags => setValue('disciplines', tags)}
          placeholder="Ajouter une discipline…"
          suggestions={ACADEMIC_DISCIPLINES}
          max={10}
        />
      </div>

      {/* Langues */}
      <div className="space-y-2">
        <Label>Langues</Label>
        <TagInput
          tags={languages}
          onChange={tags => setValue('languages', tags)}
          placeholder="Ajouter une langue…"
          suggestions={LANGUAGES}
          max={8}
        />
      </div>

      {/* Diplôme */}
      <div className="space-y-2">
        <Label>Diplôme (pour badge vérifié)</Label>
        <div className="border rounded-lg p-4 space-y-3">
          {profile.diploma_verified ? (
            <div className="flex items-center gap-2 text-[#C9963A]">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Diplôme vérifié</span>
            </div>
          ) : diplomaUrl ? (
            <p className="text-sm text-green-600">✓ Document envoyé — en attente de vérification par l'équipe</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Uploadez un justificatif de diplôme pour obtenir le badge <strong>Diplôme vérifié</strong>
            </p>
          )}
          {!profile.diploma_verified && (
            <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-[#1B3A6B] hover:underline">
              <Upload className="w-4 h-4" />
              {diplomaUrl ? 'Remplacer le document' : 'Uploader un justificatif'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleDiplomaUpload}
                disabled={uploading}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG · Max 10MB</p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || uploading}
        className="bg-[#1B3A6B] hover:bg-[#2E6DB4] min-w-[140px]"
      >
        {isSubmitting ? 'Enregistrement…' : 'Sauvegarder'}
      </Button>
    </form>
  )
}
