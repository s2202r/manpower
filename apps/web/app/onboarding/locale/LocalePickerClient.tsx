'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LOCALES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
]

export default function LocalePickerClient() {
  const router = useRouter()
  const [selected, setSelected] = useState('en')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ preferred_locale: selected }).eq('id', user.id)
    }
    setSaving(false)
    router.push('/dashboard')
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {LOCALES.map(locale => (
          <button
            key={locale.code}
            onClick={() => setSelected(locale.code)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              selected === locale.code
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 bg-white hover:border-amber-200'
            }`}
          >
            <p className="font-bold text-gray-900 text-sm">{locale.native}</p>
            <p className="text-xs text-gray-400">{locale.label}</p>
          </button>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-2xl bg-amber-500 py-4 font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Get started →'}
      </button>
    </div>
  )
}
