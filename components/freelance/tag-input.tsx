'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[]
  max?: number
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Ajouter...',
  suggestions = [],
  max = 10,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed) || tags.length >= max) return
    onChange([...tags, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex flex-wrap gap-2 min-h-[42px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm cursor-text',
          'focus-within:ring-1 focus-within:ring-ring'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-[#E8F0FB] text-[#1B3A6B] text-xs font-medium px-2 py-1 rounded-md"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length < max && (
          <input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKey}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border rounded-md shadow-md">
          {filtered.slice(0, 8).map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#E8F0FB] hover:text-[#1B3A6B] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        {tags.length}/{max} — Entrée pour valider
      </p>
    </div>
  )
}
