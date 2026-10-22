'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AreaPicker, { type AreaValue } from '@/components/AreaPicker'
import Spinner from '@/components/Spinner'

const LOCALES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' }, { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' }, { code: 'ta', label: 'தமிழ்' },
  { code: 'gu', label: 'ગુજรાતી' }, { code: 'ur', label: 'اردو' },
  { code: 'kn', label: 'ಕನ್ನಡ' }, { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'ml', label: 'മലയാളം' }, { code: 'pa', label: 'ਪੰਜਾਬੀ' },
]

interface Props {
  initialName: string; initialBio: string; initialLocale: string; initialArea: string
  tier: string; rating: number | null; ratingCount: number; email: string
}

export default function ProfileEditForm({ initialName, initialBio, initialLocale, initialArea, tier, rating, ratingCount, email }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [locale, setLocale] = useState(initialLocale)
  const [area, setArea] = useState<AreaValue>({
    mode: initialArea.toLowerCase().includes('online') ? 'online' : 'city',
    displayArea: initialArea,
    lat: null,
    lng: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, preferred_locale: locale, display_area: area.displayArea }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); router.refresh() }
    else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Failed to save')
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Editable fields */}
      <div className="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Profile</p>

        <Field label="Display name" required>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            minLength={2}
            required
            placeholder="Your name"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
          />
        </Field>

        <Field label="Bio" hint="Shown on your public profile">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Tell posters about your skills and experience…"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{bio.length}/500</p>
        </Field>

        <Field label="Service area" hint="Where you offer your services">
          <AreaPicker value={area} onChange={setArea} />
        </Field>

        <Field label="Preferred language">
          <select
            value={locale}
            onChange={e => setLocale(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none bg-white"
          >
            {LOCALES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 mt-0.5">⚠</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <span className="text-green-500">✓</span>
          <p className="text-sm text-green-700 font-semibold">Profile saved successfully</p>
        </div>
      )}

      <div className="flex gap-3 pb-2">
        <Link href="/dashboard" className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </Link>
        <button type="submit" disabled={saving || name.trim().length < 2} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm">
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="font-normal text-gray-400 ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
