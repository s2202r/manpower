import type { Metadata } from 'next'
import { APP_NAME, APP_TAGLINE } from '@taim/config'
import './globals.css'

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
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
