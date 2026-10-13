import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Taim Admin', description: 'Taim platform admin panel' }

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/kyc', label: 'KYC' },
  { href: '/webhooks', label: 'Webhooks' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 font-sans antialiased">
        <div className="flex min-h-screen">
          <aside className="w-52 shrink-0 bg-gray-900 text-white">
            <div className="px-5 py-5 border-b border-gray-700">
              <span className="text-lg font-black text-amber-400">Taim</span>
              <span className="ml-1 text-xs text-gray-400 uppercase tracking-wider">Admin</span>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
