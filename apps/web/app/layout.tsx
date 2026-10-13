import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import Navbar from '@/components/Navbar'
import { LocaleProvider } from '@/components/LocaleProvider'
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, getDir, type Locale } from '@taim/i18n'

export const metadata: Metadata = {
  metadataBase: new URL('https://taim.in'),
  title: {
    default: 'Taim — India\'s Task Marketplace',
    template: '%s — Taim',
  },
  description: 'Post any task, get verified Taskers to bid, pay securely in escrow. Available in 12 Indian languages.',
  keywords: ['task marketplace', 'hire help India', 'home services', 'gig work India', 'Taim'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://taim.in',
    siteName: 'Taim',
    title: 'Taim — India\'s Task Marketplace',
    description: 'Post any task, get verified Taskers to bid, pay securely in escrow.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taim — India\'s Task Marketplace',
    description: 'Post any task, get verified Taskers to bid, pay securely in escrow.',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const raw = jar.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE
  const dir = getDir(locale)

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <LocaleProvider initial={locale}>
          <Navbar />
          {children}
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  )
}
