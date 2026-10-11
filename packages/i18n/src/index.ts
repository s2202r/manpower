export const LOCALES = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'ur', 'kn', 'or', 'ml', 'pa'] as const
export type Locale = typeof LOCALES[number]
export const RTL_LOCALES: Locale[] = ['ur']
export const DEFAULT_LOCALE: Locale = 'hi'
export const FALLBACK_LOCALE: Locale = 'en'

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale)
}

export function getDir(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  mr: 'मराठी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  ur: 'اردو',
  kn: 'ಕನ್ನಡ',
  or: 'ଓଡ଼ିଆ',
  ml: 'മലയാളം',
  pa: 'ਪੰਜਾਬੀ',
}
