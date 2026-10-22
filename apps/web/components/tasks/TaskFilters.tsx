'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface Category { id: string; slug: string; names: Record<string, string>; icon: string | null }

interface Current {
  type?: string; category?: string
  minBudget?: string; maxBudget?: string
  sort?: string; q?: string
}

export default function TaskFilters({ categories, current }: { categories: Category[]; current: Current }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const [minB, setMinB] = useState(current.minBudget ?? '')
  const [maxB, setMaxB] = useState(current.maxBudget ?? '')

  function buildHref(overrides: Partial<Current>) {
    const merged: Record<string, string> = {}
    const all = { ...current, ...overrides }
    if (all.q) merged.q = all.q
    if (all.type) merged.type = all.type
    if (all.category) merged.category = all.category
    if (all.sort) merged.sort = all.sort
    if (all.minBudget) merged.minBudget = all.minBudget
    if (all.maxBudget) merged.maxBudget = all.maxBudget
    const qs = new URLSearchParams(merged).toString()
    return pathname + (qs ? `?${qs}` : '')
  }

  function applyBudget() {
    router.push(buildHref({ minBudget: minB || undefined, maxBudget: maxB || undefined }))
  }

  const activeCount = [current.type, current.category, current.minBudget, current.maxBudget, current.sort].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Type pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'All types' },
          { value: 'in_person', label: '📍 In person' },
          { value: 'pickup_drop', label: '🛵 Pickup–drop' },
          { value: 'remote', label: '💻 Remote' },
        ].map(({ value, label }) => (
          <a
            key={value}
            href={buildHref({ type: value || undefined })}
            className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
              (current.type ?? '') === value
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </a>
        ))}
        {/* Sort */}
        <select
          value={current.sort ?? ''}
          onChange={e => router.push(buildHref({ sort: e.target.value || undefined }))}
          className="ml-auto rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 focus:outline-none focus:border-amber-400"
        >
          <option value="">Newest first</option>
          <option value="budget_asc">Budget: low → high</option>
          <option value="budget_desc">Budget: high → low</option>
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a
            href={buildHref({ category: undefined })}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              !current.category ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
            }`}
          >
            All
          </a>
          {categories.map(cat => (
            <a
              key={cat.slug}
              href={buildHref({ category: cat.slug })}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                current.category === cat.slug
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
              }`}
            >
              {cat.icon} {cat.names?.['en'] ?? cat.slug}
            </a>
          ))}
        </div>
      )}

      {/* Budget + more filters toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowMore(s => !s)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
            showMore || current.minBudget || current.maxBudget
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          ₹ Budget {current.minBudget || current.maxBudget ? '•' : ''}
        </button>
        {activeCount > 0 && (
          <a href={pathname} className="text-xs text-gray-400 hover:text-red-500 font-semibold">
            Clear all ({activeCount})
          </a>
        )}
      </div>

      {showMore && (
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
          <span className="text-sm text-gray-500 font-medium">₹</span>
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minB}
            onChange={e => setMinB(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxB}
            onChange={e => setMaxB(e.target.value)}
            className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={applyBudget}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
