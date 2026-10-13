'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'in_person', label: '📍 In person' },
  { value: 'pickup_drop', label: '🛵 Pickup–drop' },
  { value: 'remote', label: '💻 Remote' },
]

export default function SearchBar({ defaultQ = '', defaultType = '' }: { defaultQ?: string; defaultType?: string }) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [type, setType] = useState(defaultType)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (type) params.set('type', type)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm focus:border-amber-400 focus:bg-white focus:outline-none transition-colors"
        />
      </div>
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
      >
        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
        Search
      </button>
    </form>
  )
}
