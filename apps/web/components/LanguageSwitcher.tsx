'use client'

import { LOCALES, LOCALE_LABELS, type Locale } from '@taim/i18n'
import { useState } from 'react'

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('hi')

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Select language"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
