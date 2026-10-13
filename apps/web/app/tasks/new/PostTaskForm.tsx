'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string; icon: string | null }

const STEPS = ['Describe', 'Details', 'Review'] as const

export default function PostTaskForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'fixed' | 'hourly'>('fixed')
  const [budgetRs, setBudgetRs] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [area, setArea] = useState('')

  function canNext() {
    if (step === 0) return title.length >= 5 && description.length >= 20
    if (step === 1) return Number(budgetRs) >= 100
    return true
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        type,
        budget_paise: Math.round(Number(budgetRs) * 100),
        category_id: categoryId || null,
        display_area: area || null,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      const { id } = await res.json() as { id: string }
      router.push(`/tasks/${id}?posted=1`)
    } else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Failed to post task')
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${i <= step ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? 'bg-amber-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                What do you need done? <span className="text-gray-400 font-normal">({title.length}/120)</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. Fix leaking kitchen tap"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Describe the task <span className="text-gray-400 font-normal">({description.length} chars, min 20)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Include as much detail as possible — location, materials needed, timing, etc."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing type</label>
              <div className="flex gap-3">
                {(['fixed', 'hourly'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold capitalize transition-colors ${type === t ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {t === 'fixed' ? '💰 Fixed price' : '⏱️ Hourly rate'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Budget (₹) — min ₹100
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={budgetRs}
                  onChange={e => setBudgetRs(e.target.value)}
                  min={100}
                  step={50}
                  placeholder="500"
                  className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category (optional)</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryId('')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${!categoryId ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    Any
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${categoryId === c.id ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / area (optional)</label>
              <input
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="e.g. Bandra, Mumbai"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Review your task</h3>
            <div className="rounded-xl bg-gray-50 p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Title</p>
                <p className="text-sm text-gray-900 mt-0.5">{title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-3">{description}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Budget</p>
                  <p className="text-sm font-bold text-gray-900">₹{Number(budgetRs).toLocaleString('en-IN')} {type}</p>
                </div>
                {area && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Area</p>
                    <p className="text-sm text-gray-900">{area}</p>
                  </div>
                )}
              </div>
            </div>
            {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 rounded-xl border border-gray-200 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-3.5 text-sm font-bold transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white py-3.5 text-sm font-bold transition-colors"
          >
            {submitting ? 'Posting…' : 'Post task 🚀'}
          </button>
        )}
      </div>
    </div>
  )
}
