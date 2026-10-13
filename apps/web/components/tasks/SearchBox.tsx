'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Suggestion {
  id: string
  title: string
  type: string
  budget_paise: number
  display_area: string | null
}

export default function SearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (val: string) => {
    if (val.length < 2) { setSuggestions([]); return }
    setLoading(true)
    const res = await fetch(`/api/tasks/search?q=${encodeURIComponent(val)}`)
    const data = await res.json() as Suggestion[]
    setSuggestions(data)
    setLoading(false)
  }, [])

  function handleChange(val: string) {
    setQ(val)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 220)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set('q', q); else params.delete('q')
    router.push(`${pathname}?${params.toString()}`)
  }

  function pick(s: Suggestion) {
    setOpen(false)
    router.push(`/tasks/${s.id}`)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={q}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          placeholder="Search tasks…"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
        <button type="submit" className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 text-sm font-bold transition-colors">
          Search
        </button>
      </form>

      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {loading && <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>}
          {!loading && suggestions.map(s => (
            <button
              key={s.id}
              onClick={() => pick(s)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-400">{s.display_area ?? 'India'} · {s.type}</p>
              </div>
              <span className="text-sm font-bold text-amber-600 ml-4">
                ₹{Math.round(s.budget_paise / 100).toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
