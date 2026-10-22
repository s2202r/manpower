'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AreaPicker, { AddressInput, type AreaValue } from '@/components/AreaPicker'
import Spinner from '@/components/Spinner'

interface Category {
  id: string
  slug: string
  names: Record<string, string>
  icon: string | null
  allowed_types: string[]
  is_live: boolean
}

type Step = 'details' | 'location' | 'budget'

const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Category & type' },
  { key: 'location', label: 'Location & date' },
  { key: 'budget', label: 'Budget & review' },
]

const BUDGET_PRESETS = [500, 1000, 2500, 5000]

const TYPE_LABELS: Record<string, string> = {
  in_person: '📍 In person',
  pickup_drop: '🛵 Pickup–drop',
  remote: '💻 Remote',
}

const FLEXIBILITY_LABELS: Record<string, string> = {
  exact: 'Exact date',
  week: 'Within a week',
  month: 'Within a month',
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 text-gray-400 font-medium">{label}</span>
      <span className="text-gray-700 font-medium min-w-0 break-words">{value}</span>
    </div>
  )
}

export default function PostTaskForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')

  // Form state — unchanged
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [taskType, setTaskType] = useState<'in_person' | 'pickup_drop' | 'remote'>('in_person')
  const [area, setArea] = useState<AreaValue>({ mode: 'city', displayArea: '', lat: null, lng: null })
  const [pickupArea, setPickupArea] = useState<AreaValue>({ mode: 'city', displayArea: '', lat: null, lng: null })
  const [dropoffArea, setDropoffArea] = useState<AreaValue>({ mode: 'city', displayArea: '', lat: null, lng: null })
  const [budgetRupees, setBudgetRupees] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateFlexibility, setDateFlexibility] = useState<'exact' | 'week' | 'month'>('exact')
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCategory = categories.find(c => c.id === categoryId)
  const allowedTypes = selectedCategory?.allowed_types ?? ['in_person', 'pickup_drop', 'remote']

  // ── unchanged business logic ────────────────────────────────────────────────

  async function uploadPhotos(taskId: string): Promise<string[]> {
    if (photos.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    for (const file of photos) {
      const ext = file.name.split('.').pop()
      const path = `${taskId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('task-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('task-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId) { setError('Please select a category'); return }
    const budgetPaise = Math.round(parseFloat(budgetRupees) * 100)
    if (isNaN(budgetPaise) || budgetPaise < 100) { setError('Budget must be at least ₹1'); return }

    setUploading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/sign-in'); return }

    function toPoint(lat: number | null, lng: number | null) {
      if (lat === null || lng === null) return null
      return `SRID=4326;POINT(${lng} ${lat})`
    }

    const taskPayload: Record<string, unknown> = {
      poster_id: user.id,
      category_id: categoryId,
      title,
      description,
      task_type: taskType,
      budget_paise: budgetPaise,
      date_from: dateFrom || null,
      date_flexibility: dateFlexibility,
      status: 'open',
      photos: [],
    }

    if (taskType === 'in_person') {
      if (!area.displayArea) { setError('Please select a service area'); setUploading(false); return }
      taskPayload.display_area = area.displayArea
      if (area.address) taskPayload.precise_address = area.address
      const point = toPoint(area.lat, area.lng)
      if (point) taskPayload.location = point
    } else if (taskType === 'pickup_drop') {
      if (!pickupArea.displayArea || !dropoffArea.displayArea) {
        setError('Please select pickup and dropoff areas'); setUploading(false); return
      }
      taskPayload.display_area = `${pickupArea.displayArea} → ${dropoffArea.displayArea}`
      const pickupAddr = [pickupArea.address, dropoffArea.address].filter(Boolean).join(' → ')
      if (pickupAddr) taskPayload.precise_address = pickupAddr
      const pickup = toPoint(pickupArea.lat, pickupArea.lng)
      const dropoff = toPoint(dropoffArea.lat, dropoffArea.lng)
      if (pickup) { taskPayload.pickup_location = pickup; taskPayload.location = pickup }
      if (dropoff) taskPayload.dropoff_location = dropoff
    } else {
      // remote
      taskPayload.display_area = 'Online / Remote'
    }

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert(taskPayload)
      .select('id')
      .single()

    if (insertError || !task) {
      setError(insertError?.message ?? 'Failed to create task')
      setUploading(false)
      return
    }

    // Upload photos and update task
    const photoUrls = await uploadPhotos(task.id)
    if (photoUrls.length > 0) {
      await supabase.from('tasks').update({ photos: photoUrls }).eq('id', task.id)
    }

    setUploading(false)
    router.push(`/tasks/${task.id}`)
  }

  // ── step navigation ─────────────────────────────────────────────────────────

  function goNext() {
    setError(null)
    if (step === 'details') {
      if (!categoryId) { setError('Please select a category'); return }
      if (!title.trim() || title.length < 10) { setError('Title must be at least 10 characters'); return }
      if (!description.trim() || description.length < 20) { setError('Description must be at least 20 characters'); return }
      setStep('location')
    } else if (step === 'location') {
      if (taskType === 'in_person' && !area.displayArea) {
        setError('Please select a service area'); return
      }
      if (taskType === 'pickup_drop' && (!pickupArea.displayArea || !dropoffArea.displayArea)) {
        setError('Please select pickup and dropoff areas'); return
      }
      setStep('budget')
    }
  }

  function goBack() {
    setError(null)
    if (step === 'location') setStep('details')
    else if (step === 'budget') setStep('location')
  }

  // ── shared style tokens ──────────────────────────────────────────────────────

  const stepIndex = STEPS.findIndex(s => s.key === step)

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors bg-white'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-gray-700'

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Pill progress bar ── */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const isPast = i < stepIndex
          const isCurrent = i === stepIndex
          return (
            <div key={s.key} className="flex items-center flex-1 min-w-0">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-amber-500 text-white shadow-sm'
                    : isPast
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className="font-bold">
                  {isPast ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 transition-colors ${
                    i < stepIndex ? 'bg-amber-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          Step 1 — Category & type
      ══════════════════════════════════════════════════ */}
      {step === 'details' && (
        <div className="rounded-2xl bg-white shadow-sm p-6 space-y-6">

          {/* Category grid */}
          <div>
            <p className={labelCls}>Category</p>
            {categories.filter(c => c.is_live).length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">No categories available yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.filter(c => c.is_live).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      categoryId === c.id
                        ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 ring-offset-1'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <span className="text-3xl leading-none">{c.icon ?? '📋'}</span>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      {c.names['en'] ?? c.slug}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!categoryId && (
              <p className="mt-2 text-xs text-gray-400 text-center">Tap a category to continue</p>
            )}
          </div>

          {/* Task type pills */}
          <div>
            <p className={labelCls}>Task type</p>
            <div className="flex gap-2">
              {(['in_person', 'pickup_drop', 'remote'] as const)
                .filter(t => allowedTypes.includes(t))
                .map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTaskType(t)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                      taskType === t
                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="task-title" className={labelCls}>Title</label>
            <input
              id="task-title"
              type="text"
              required
              minLength={10}
              maxLength={200}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputCls}
              placeholder="e.g. Help moving furniture to new flat"
            />
            <p className="mt-1 text-xs text-gray-400 tabular-nums">{title.length}/200 · min 10</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className={labelCls}>Description</label>
            <textarea
              id="task-desc"
              required
              minLength={20}
              maxLength={2000}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="Describe what you need in detail…"
            />
            <p className="mt-1 text-xs text-gray-400 tabular-nums">{description.length}/2000 · min 20</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-4 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Step 2 — Location & date
      ══════════════════════════════════════════════════ */}
      {step === 'location' && (
        <div className="rounded-2xl bg-white shadow-sm p-6 space-y-6">

          {taskType === 'in_person' && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-800">📍 Service area</p>
              <AreaPicker value={area} onChange={setArea} hideOnline />
              <AddressInput
                onAddress={(addr, lat, lng) =>
                  setArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))
                }
              />
            </div>
          )}

          {taskType === 'pickup_drop' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="font-semibold text-gray-800">🛵 Pickup location</p>
                <AreaPicker value={pickupArea} onChange={setPickupArea} hideOnline />
                <AddressInput
                  placeholder="Exact pickup address (optional)"
                  onAddress={(addr, lat, lng) =>
                    setPickupArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))
                  }
                />
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-gray-800">📦 Dropoff location</p>
                <AreaPicker value={dropoffArea} onChange={setDropoffArea} hideOnline />
                <AddressInput
                  placeholder="Exact dropoff address (optional)"
                  onAddress={(addr, lat, lng) =>
                    setDropoffArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))
                  }
                />
              </div>
            </div>
          )}

          {taskType === 'remote' && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-sm text-blue-700 font-medium">
                💻 This task will be listed as <strong>Online / Remote</strong> — no location required.
              </p>
            </div>
          )}

          {/* Date */}
          <div>
            <p className="font-semibold text-gray-800 mb-3">📅 When do you need it?</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-date" className={labelCls}>Date</label>
                <input
                  id="task-date"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className={inputCls}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label htmlFor="task-flex" className={labelCls}>Flexibility</label>
                <select
                  id="task-flex"
                  value={dateFlexibility}
                  onChange={e => setDateFlexibility(e.target.value as 'exact' | 'week' | 'month')}
                  className={inputCls}
                >
                  <option value="exact">Exact date</option>
                  <option value="week">Within a week</option>
                  <option value="month">Within a month</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 rounded-xl border-2 border-gray-200 text-gray-600 font-bold py-4 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex-[2] rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-4 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Step 3 — Budget & review
      ══════════════════════════════════════════════════ */}
      {step === 'budget' && (
        <div className="rounded-2xl bg-white shadow-sm p-6 space-y-6">

          {/* Budget input */}
          <div>
            <label htmlFor="task-budget" className={labelCls}>Budget (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg select-none">
                ₹
              </span>
              <input
                id="task-budget"
                type="number"
                min="1"
                step="1"
                required
                value={budgetRupees}
                onChange={e => setBudgetRupees(e.target.value)}
                className={`${inputCls} pl-9 text-lg font-semibold tabular-nums`}
                placeholder="0"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Taskers send offers — this is your starting budget.</p>

            {/* Quick presets */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {BUDGET_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBudgetRupees(String(p))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    budgetRupees === String(p)
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  ₹{p.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Photos drop-zone */}
          <div>
            <p className={labelCls}>Photos</p>
            <label
              htmlFor="task-photos"
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm font-medium text-gray-500">Add photos (optional)</span>
              {photos.length > 0 && (
                <span className="text-xs text-amber-700 font-semibold bg-amber-100 rounded-full px-2.5 py-0.5">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </label>
            <input
              id="task-photos"
              type="file"
              accept="image/*"
              multiple
              onChange={e => setPhotos(Array.from(e.target.files ?? []))}
              className="sr-only"
            />
          </div>

          {/* Review summary */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Review</p>
            <ReviewRow
              label="Category"
              value={
                selectedCategory
                  ? `${selectedCategory.icon ?? ''} ${selectedCategory.names['en'] ?? selectedCategory.slug}`.trim()
                  : '—'
              }
            />
            <ReviewRow label="Type" value={TYPE_LABELS[taskType] ?? taskType} />
            <ReviewRow label="Title" value={title || '—'} />
            <ReviewRow
              label="Details"
              value={description ? description.slice(0, 80) + (description.length > 80 ? '…' : '') : '—'}
            />
            {taskType === 'in_person' && (
              <ReviewRow label="Area" value={area.displayArea || '—'} />
            )}
            {taskType === 'pickup_drop' && (
              <ReviewRow
                label="Route"
                value={
                  pickupArea.displayArea && dropoffArea.displayArea
                    ? `${pickupArea.displayArea} → ${dropoffArea.displayArea}`
                    : '—'
                }
              />
            )}
            {taskType === 'remote' && (
              <ReviewRow label="Location" value="Online / Remote" />
            )}
            {dateFrom && (
              <ReviewRow label="Date" value={`${dateFrom} · ${FLEXIBILITY_LABELS[dateFlexibility]}`} />
            )}
            {budgetRupees && (
              <ReviewRow label="Budget" value={`₹${Number(budgetRupees).toLocaleString('en-IN')}`} />
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 rounded-xl border-2 border-gray-200 text-gray-600 font-bold py-4 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 text-white font-bold py-4 transition-colors"
            >
              {uploading && <Spinner />}
              {uploading ? 'Posting task…' : 'Post task'}
            </button>
          </div>
        </div>
      )}

    </form>
  )
}
