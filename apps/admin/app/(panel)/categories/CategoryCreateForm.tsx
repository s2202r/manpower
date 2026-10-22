'use client'

import { useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'in_person', label: '📍 In person' },
  { value: 'pickup_drop', label: '🛵 Pickup–drop' },
  { value: 'remote', label: '💻 Remote' },
]

export default function CategoryCreateForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [icon, setIcon] = useState('')
  const [types, setTypes] = useState<string[]>(['in_person', 'pickup_drop', 'remote'])

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function toggleType(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Add new category</p>
      </div>
      <form action="/api/admin/categories/create" method="POST" className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name (English)</label>
            <input
              name="name"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Plumbing"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Icon (emoji)</label>
            <input
              name="icon"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="🔧"
              maxLength={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Slug
            <span className="ml-1 font-normal text-gray-400">— URL-safe, lowercase, hyphens only</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">/categories/</span>
            <input
              name="slug"
              required
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              pattern="[a-z0-9-]+"
              placeholder="plumbing"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed task types</label>
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(t => (
              <label key={t.value} className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors select-none ${
                types.includes(t.value)
                  ? 'border-amber-400 bg-amber-50 text-amber-800 font-semibold'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  name="allowed_types"
                  value={t.value}
                  checked={types.includes(t.value)}
                  onChange={() => toggleType(t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !slug.trim() || types.length === 0}
          className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-3 text-sm font-bold transition-colors"
        >
          Create category
        </button>
      </form>
    </div>
  )
}
