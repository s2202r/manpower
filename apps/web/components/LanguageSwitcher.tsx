'use client'

import { LOCALES, LOCALE_LABELS } from '@taim/i18n'
import { useLocale } from '@/components/LocaleProvider'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as typeof LOCALES[number])}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      aria-label="Select language"
    >
      {LOCALES.map(l => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  )
}
