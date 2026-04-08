'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CATEGORIES, SORT_OPTIONS } from '@/lib/constants'
import { Search, SlidersHorizontal } from 'lucide-react'

export function ServicesFilters() {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const [q,        setQ]        = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '')
  const [delayMax, setDelayMax] = useState(searchParams.get('delay_max') || '')
  const [sort,     setSort]     = useState(searchParams.get('sort') || 'newest')

  const push = useCallback((overrides: Record<string, string>) => {
    const p = new URLSearchParams()
    const merged = { q, category, price_max: priceMax, delay_max: delayMax, sort, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    p.delete('page')
    router.push(`/services?${p.toString()}`)
  }, [q, category, priceMax, delayMax, sort, router])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    push({})
  }

  function handleReset() {
    setQ(''); setCategory(''); setPriceMax(''); setDelayMax(''); setSort('newest')
    router.push('/services')
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher un service…"
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
        </div>
        <Button type="submit" className="bg-[#1B3A6B] hover:bg-[#2E6DB4] shrink-0">
          Rechercher
        </Button>
      </form>

      {/* Filtres sidebar */}
      <aside className="space-y-6">
        <div className="flex items-center gap-2 font-semibold text-[#1B3A6B]">
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </div>

        {/* Catégorie */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1B3A6B]">Catégorie</p>
          <div className="space-y-1">
            <button
              onClick={() => { setCategory(''); push({ category: '' }) }}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${!category ? 'bg-[#E8F0FB] text-[#1B3A6B] font-medium' : 'hover:bg-gray-100'}`}
            >
              Toutes
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); push({ category: cat.value }) }}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${category === cat.value ? 'bg-[#E8F0FB] text-[#1B3A6B] font-medium' : 'hover:bg-gray-100'}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget max */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1B3A6B]">Budget maximum (€)</p>
          <input
            type="number"
            placeholder="Ex : 200"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
        </div>

        {/* Délai max */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1B3A6B]">Délai maximum (jours)</p>
          <input
            type="number"
            placeholder="Ex : 14"
            value={delayMax}
            onChange={e => setDelayMax(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
        </div>

        {/* Tri */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1B3A6B]">Trier par</p>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 pt-2">
          <Button onClick={() => push({})} className="w-full bg-[#1B3A6B] hover:bg-[#2E6DB4]">
            Appliquer
          </Button>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Réinitialiser
          </Button>
        </div>
      </aside>
    </div>
  )
}
