'use client'

import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CATEGORIES, SUBCATEGORIES } from '@/lib/constants'
import { createService, updateService } from '@/lib/supabase/service-actions'
import { TagInput } from './tag-input'
import { ImageUploader } from './image-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then(m => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-48 border rounded-md bg-gray-100 animate-pulse" /> }
)

const CATEGORY_VALUES = [
  'correction-revision', 'redaction-academique', 'statistiques-analyse',
  'tutorat-coaching', 'traduction-academique', 'publication-scientifique',
] as const

const serviceSchema = z.object({
  title:                  z.string().min(10, 'Minimum 10 caractères').max(100, 'Maximum 100 caractères'),
  category:               z.enum(CATEGORY_VALUES, { error: 'Catégorie requise' }),
  subcategory:            z.string().optional(),
  basic_price:            z.coerce.number({ error: 'Prix requis' }).min(5, 'Minimum 5 €'),
  basic_delivery_days:    z.coerce.number().min(1, 'Minimum 1 jour').max(90, 'Maximum 90 jours'),
  basic_description:      z.string().min(10, 'Description trop courte'),
  standard_price:         z.coerce.number().optional(),
  standard_delivery_days: z.coerce.number().optional(),
  standard_description:   z.string().optional(),
  premium_price:          z.coerce.number().optional(),
  premium_delivery_days:  z.coerce.number().optional(),
  premium_description:    z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>
type FormulaTab = 'basic' | 'standard' | 'premium'

interface ExistingService {
  id: string
  title: string
  category: string
  subcategory: string | null
  description: string
  basic_price: number
  basic_delivery_days: number
  basic_description: string | null
  standard_price: number | null
  standard_delivery_days: number | null
  standard_description: string | null
  premium_price: number | null
  premium_delivery_days: number | null
  premium_description: string | null
  tags: string[]
  image_urls: string[]
  freelance_id: string
}

interface ServiceFormProps {
  service?: ExistingService
  userId: string
}

export function ServiceForm({ service, userId }: ServiceFormProps) {
  const router = useRouter()
  const [description, setDescription] = useState(service?.description ?? '')
  const [tags, setTags]               = useState<string[]>(service?.tags ?? [])
  const [images, setImages]           = useState<string[]>(service?.image_urls ?? [])
  const [activeTab, setActiveTab]     = useState<FormulaTab>('basic')

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForm<ServiceFormData>({
      resolver: zodResolver(serviceSchema) as any,
      defaultValues: {
        title:                  service?.title ?? '',
        category:               (service?.category as typeof CATEGORY_VALUES[number]) ?? undefined,
        subcategory:            service?.subcategory ?? '',
        basic_price:            service?.basic_price ?? undefined,
        basic_delivery_days:    service?.basic_delivery_days ?? undefined,
        basic_description:      service?.basic_description ?? '',
        standard_price:         service?.standard_price ?? undefined,
        standard_delivery_days: service?.standard_delivery_days ?? undefined,
        standard_description:   service?.standard_description ?? '',
        premium_price:          service?.premium_price ?? undefined,
        premium_delivery_days:  service?.premium_delivery_days ?? undefined,
        premium_description:    service?.premium_description ?? '',
      },
    })

  const selectedCategory = watch('category')

  async function onSubmit(data: ServiceFormData) {
    const plainText = description.replace(/<[^>]*>/g, '').trim()
    if (plainText.length < 50) {
      toast.error('La description doit faire au moins 50 caractères')
      return
    }

    const payload = { ...data, description, tags, image_urls: images }

    const result = service
      ? await updateService(service.id, payload)
      : await createService(payload)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(service ? 'Service mis à jour !' : 'Service publié !')
      router.push('/freelance/services')
    }
  }

  const tabClass = (tab: FormulaTab) =>
    `flex-1 py-2 text-sm font-medium transition-colors rounded-t-lg ${
      activeTab === tab
        ? 'bg-white text-[#1B3A6B] border border-b-white shadow-sm'
        : 'text-muted-foreground hover:text-[#1B3A6B]'
    }`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Informations générales */}
      <div className="bg-white rounded-xl border p-6 space-y-6">
        <h2 className="font-semibold text-[#1B3A6B] text-lg">Informations générales</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Titre du service *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Ex : Correction complète de votre mémoire de master"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <select
              id="category"
              {...register('category')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Choisir une catégorie</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Sous-catégorie</Label>
            <select
              id="subcategory"
              {...register('subcategory')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={!selectedCategory}
            >
              <option value="">Choisir…</option>
              {(SUBCATEGORIES[selectedCategory] ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description détaillée * <span className="text-xs text-muted-foreground">(min. 50 caractères)</span></Label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Décrivez précisément votre service, votre méthode de travail, ce que vous livrez…"
          />
        </div>

        <div className="space-y-2">
          <Label>Tags <span className="text-xs text-muted-foreground">(max 5)</span></Label>
          <TagInput
            tags={tags}
            onChange={setTags}
            placeholder="Ajouter un tag…"
            max={5}
          />
        </div>
      </div>

      {/* Formules tarifaires */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-[#1B3A6B] text-lg">Formules tarifaires</h2>
        <p className="text-sm text-muted-foreground">La formule Basique est obligatoire. Standard et Premium sont optionnelles.</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['basic', 'standard', 'premium'] as FormulaTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#1B3A6B] shadow-sm'
                  : 'text-muted-foreground hover:text-[#1B3A6B]'
              }`}
            >
              {tab === 'basic' ? 'Basique *' : tab === 'standard' ? 'Standard' : 'Premium'}
            </button>
          ))}
        </div>

        {/* Basic */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic_price">Prix (€) *</Label>
                <Input id="basic_price" type="number" min={5} {...register('basic_price')} placeholder="50" />
                {errors.basic_price && <p className="text-xs text-red-500">{errors.basic_price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_delivery_days">Délai (jours) *</Label>
                <Input id="basic_delivery_days" type="number" min={1} max={90} {...register('basic_delivery_days')} placeholder="7" />
                {errors.basic_delivery_days && <p className="text-xs text-red-500">{errors.basic_delivery_days.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basic_description">Description de la formule *</Label>
              <Textarea id="basic_description" {...register('basic_description')} rows={3} placeholder="Ce qui est inclus dans cette formule…" />
              {errors.basic_description && <p className="text-xs text-red-500">{errors.basic_description.message}</p>}
            </div>
          </div>
        )}

        {/* Standard */}
        {activeTab === 'standard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standard_price">Prix (€)</Label>
                <Input id="standard_price" type="number" min={5} {...register('standard_price')} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard_delivery_days">Délai (jours)</Label>
                <Input id="standard_delivery_days" type="number" min={1} max={90} {...register('standard_delivery_days')} placeholder="14" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="standard_description">Description de la formule</Label>
              <Textarea id="standard_description" {...register('standard_description')} rows={3} placeholder="Ce qui est inclus en plus de la formule Basique…" />
            </div>
          </div>
        )}

        {/* Premium */}
        {activeTab === 'premium' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premium_price">Prix (€)</Label>
                <Input id="premium_price" type="number" min={5} {...register('premium_price')} placeholder="200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premium_delivery_days">Délai (jours)</Label>
                <Input id="premium_delivery_days" type="number" min={1} max={90} {...register('premium_delivery_days')} placeholder="21" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium_description">Description de la formule</Label>
              <Textarea id="premium_description" {...register('premium_description')} rows={3} placeholder="L'offre complète premium avec tous les services inclus…" />
            </div>
          </div>
        )}
      </div>

      {/* Galerie */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-[#1B3A6B] text-lg">Galerie d'images</h2>
        <ImageUploader images={images} onChange={setImages} userId={userId} maxImages={5} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#1B3A6B] hover:bg-[#2E6DB4] min-w-[160px]"
        >
          {isSubmitting ? 'Publication…' : service ? 'Mettre à jour' : 'Publier le service'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/freelance/services')}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
