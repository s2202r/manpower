'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string; icon: string | null }

const STEPS = ['Describe', 'Details', 'Review'] as const

const TASK_TYPES = [
  { value: 'in_person', label: '📍 In person', desc: 'Tasker comes to you' },
  { value: 'pickup_drop', label: '🛵 Pickup & drop', desc: 'Item collected and returned' },
  { value: 'remote', label: '💻 Remote', desc: 'Done online / over call' },
] as const

export default function PostTaskForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<'in_person' | 'pickup_drop' | 'remote'>('in_person')
  const [budgetRs, setBudgetRs] = useState('')
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly'>('fixed')
  const [categoryId, setCategoryId] = useState<string>('')

  // Location state
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [locError, setLocError] = useState('')

  function canNext() {
    if (step === 0) return title.length >= 5 && description.length >= 20
    if (step === 1) return Number(budgetRs) >= 100
    return true
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        // Reverse-geocode using free Nominatim API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          if (res.ok) {
            const data = await res.json() as { display_name?: string; address?: Record<string, string> }
            const a = data.address ?? {}
            const parts = [a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village, a.state].filter(Boolean)
            setAddress(parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',').trim() || '')
          }
        } catch { /* ignore reverse geocode failure */ }
        setLocating(false)
      },
      err => {
        setLocError(err.code === 1 ? 'Location access denied — please type your area below' : 'Could not get location')
        setLocating(false)
      },
      { timeout: 10000 }
    )
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
        task_type: taskType,
        pricing_type: pricingType,
        budget_paise: Math.round(Number(budgetRs) * 100),
        category_id: categoryId || null,
        display_area: address || null,
        location_lat: coords?.lat ?? null,
        location_lng: coords?.lng ?? null,
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task type</label>
              <div className="flex flex-col gap-2">
                {TASK_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTaskType(t.value)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${taskType === t.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-lg">{t.label.split(' ')[0]}</span>
                    <div>
                      <p className={`text-sm font-semibold ${taskType === t.value ? 'text-amber-800' : 'text-gray-700'}`}>{t.label.split(' ').slice(1).join(' ')}</p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
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
                    onClick={() => setPricingType(t)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold capitalize transition-colors ${pricingType === t ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
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

            {/* Location picker */}
            {taskType !== 'remote' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-3"
                >
                  {locating ? (
                    <svg className="animate-spin h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {locating ? 'Detecting…' : coords ? 'Update my location' : 'Use my location'}
                </button>
                {locError && <p className="text-xs text-red-500 mb-2">{locError}</p>}
                {coords && (
                  <p className="text-xs text-green-600 mb-2">
                    ✓ Location detected ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                  </p>
                )}
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Bandra West, Mumbai"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <p className="text-xs text-gray-400 mt-1">Edit or type your area / neighbourhood</p>
              </div>
            )}

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
              <div className="flex gap-6 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Type</p>
                  <p className="text-sm text-gray-900 capitalize">{taskType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Budget</p>
                  <p className="text-sm font-bold text-gray-900">₹{Number(budgetRs).toLocaleString('en-IN')} {pricingType}</p>
                </div>
                {address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Area</p>
                    <p className="text-sm text-gray-900">{address}{coords ? ' 📍' : ''}</p>
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
