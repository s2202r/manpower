'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AreaPicker, { AddressInput, type AreaValue } from '@/components/AreaPicker'

interface Category {
  id: string
  slug: string
  names: Record<string, string>
  icon: string | null
  allowed_types: string[]
  is_live: boolean
}

export default function PostTaskForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'location' | 'budget'>('details')

  // Form state
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

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      {/* Category */}
      <div>
        <label className={labelClass}>Category</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass} required>
          <option value="">Select a category</option>
          {categories.filter(c => c.is_live).map(c => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.names['en'] ?? c.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Task type */}
      <div>
        <label className={labelClass}>Task type</label>
        <div className="flex gap-3">
          {(['in_person', 'pickup_drop', 'remote'] as const).filter(t => allowedTypes.includes(t)).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTaskType(t)}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition-colors ${
                taskType === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              {t === 'in_person' ? '📍 In person' : t === 'pickup_drop' ? '🛵 Pickup–drop' : '💻 Remote'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Title</label>
        <input type="text" required minLength={10} maxLength={200} value={title} onChange={e => setTitle(e.target.value)}
          className={inputClass} placeholder="e.g. Help moving furniture to new flat" />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea required minLength={20} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
          rows={4} className={inputClass} placeholder="Describe what you need in detail…" />
      </div>

      {/* Location */}
      {taskType === 'in_person' && (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="font-medium text-gray-700">📍 Service area</p>
          <AreaPicker value={area} onChange={setArea} hideOnline />
          <AddressInput onAddress={(addr, lat, lng) => setArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))} />
        </div>
      )}

      {taskType === 'pickup_drop' && (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4">
          <p className="font-medium text-gray-700">🛵 Pickup location</p>
          <AreaPicker value={pickupArea} onChange={setPickupArea} hideOnline />
          <AddressInput placeholder="Exact pickup address (optional)" onAddress={(addr, lat, lng) => setPickupArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))} />
          <p className="font-medium text-gray-700 pt-2">📦 Dropoff location</p>
          <AreaPicker value={dropoffArea} onChange={setDropoffArea} hideOnline />
          <AddressInput placeholder="Exact dropoff address (optional)" onAddress={(addr, lat, lng) => setDropoffArea(a => ({ ...a, lat: lat ?? a.lat, lng: lng ?? a.lng, address: addr }))} />
        </div>
      )}

      {/* Budget */}
      <div>
        <label className={labelClass}>Budget (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
          <input type="number" min="1" step="1" required value={budgetRupees} onChange={e => setBudgetRupees(e.target.value)}
            className={`${inputClass} pl-7`} placeholder="500" />
        </div>
        <p className="mt-1 text-xs text-gray-500">Taskers will send offers — this is your starting budget.</p>
      </div>

      {/* Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass}
            min={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <label className={labelClass}>Flexibility</label>
          <select value={dateFlexibility} onChange={e => setDateFlexibility(e.target.value as 'exact' | 'week' | 'month')} className={inputClass}>
            <option value="exact">Exact date</option>
            <option value="week">Within a week</option>
            <option value="month">Within a month</option>
          </select>
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className={labelClass}>Photos (optional)</label>
        <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))}
          className="w-full rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-600" />
        {photos.length > 0 && <p className="mt-1 text-xs text-gray-500">{photos.length} photo(s) selected</p>}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-xl bg-brand-600 py-4 font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {uploading ? 'Posting task…' : 'Post task'}
      </button>
    </form>
  )
}
