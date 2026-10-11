'use client'

import { APP_NAME } from '@taim/config'
import { LOCALES, LOCALE_LABELS, getDir, type Locale } from '@taim/i18n'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LanguagePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Locale>('hi')

  function handleContinue() {
    document.cookie = `locale=${selected};path=/;max-age=31536000`
    router.push('/onboarding/role')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4" dir={getDir(selected)}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-black text-brand-600">{APP_NAME}</h1>
        <p className="mb-8 text-center text-gray-600">Choose your language / अपनी भाषा चुनें</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setSelected(l)}
              className={`rounded-xl border-2 px-4 py-3 text-center font-semibold transition-colors ${
                selected === l
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-brand-300'
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
        <button
          onClick={handleContinue}
          className="mt-8 w-full rounded-xl bg-brand-600 py-4 font-bold text-white hover:bg-brand-700"
        >
          Continue / जारी रखें
        </button>
      </div>
    </main>
  )
}
