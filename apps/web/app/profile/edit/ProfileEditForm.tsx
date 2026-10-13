'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [area, setArea] = useState(initialArea)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const tierLabel = tier === 'kyc' ? '✅ KYC Verified' : tier === 'email' ? '📧 Email Verified' : '⚪ Not verified'

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, preferred_locale: locale, display_area: area }),
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
      {/* Account info (read-only) */}
      <div className="rounded-2xl bg-white shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Account</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-semibold text-gray-900">{email}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">{tierLabel}</span>
        </div>
        {ratingCount > 0 && rating && (
          <p className="mt-3 text-sm text-amber-600 font-semibold">⭐ {rating.toFixed(1)} ({ratingCount} reviews)</p>
        )}
      </div>

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

        <Field label="Service area" hint="City, neighbourhood, or 'Online'">
          <input
            value={area}
            onChange={e => setArea(e.target.value)}
            maxLength={100}
            placeholder="e.g. Andheri, Mumbai"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none"
          />
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

      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-semibold">Profile saved ✓</p>}

      <div className="flex gap-3">
        <Link href="/dashboard" className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </Link>
        <button type="submit" disabled={saving || name.trim().length < 2} className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
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
