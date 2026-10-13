import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import Navbar from '@/components/Navbar'
import { LocaleProvider } from '@/components/LocaleProvider'
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, getDir, type Locale } from '@taim/i18n'

const SITE_URL = 'https://taim.in'

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Taim — India\'s Task Marketplace',
    template: '%s — Taim',
  },
  description: 'Post any task, get offers from verified Taskers, pay securely in escrow. Available in Hindi, Tamil, Telugu, Bengali and 8 more Indian languages.',
  keywords: ['task marketplace India', 'hire help India', 'home services India', 'gig work India', 'Taim', 'काम', 'tasker'],
  applicationName: 'Taim',
  authors: [{ name: 'Taim Technologies Pvt. Ltd.', url: SITE_URL }],
  creator: 'Taim Technologies Pvt. Ltd.',
  publisher: 'Taim Technologies Pvt. Ltd.',
  category: 'marketplace',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Taim',
    title: 'Taim — India\'s Task Marketplace',
    description: 'Post any task, get offers from verified Taskers, pay securely in escrow.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Taim — India\'s Task Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@taimindia',
    creator: '@taimindia',
    title: 'Taim — India\'s Task Marketplace',
    description: 'Post any task, get offers from verified Taskers, pay securely in escrow.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: SITE_URL },
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
