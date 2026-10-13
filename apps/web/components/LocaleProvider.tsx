'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, getDir, t, type Locale, type TranslationKey } from '@taim/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children, initial }: { children: ReactNode; initial: Locale }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initial)

  const setLocale = useCallback((l: Locale) => {
    if (!LOCALES.includes(l)) return
    setLocaleState(l)
    // Persist in cookie (1 year, SameSite=Lax, no httpOnly so JS can read)
    document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=31536000;SameSite=Lax`
    // Update <html> attributes without a full reload
    document.documentElement.lang = l
    document.documentElement.dir = getDir(l)
    // Refresh server components so any server-rendered copy re-renders with new locale
    router.refresh()
  }, [router])

  const translate = useCallback((key: TranslationKey) => t(locale, key), [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translate, dir: getDir(locale) }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}
