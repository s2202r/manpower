import Link from 'next/link'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/users', label: 'Users' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/reports', label: 'Reports' },
  { href: '/kyc', label: 'KYC' },
  { href: '/webhooks', label: 'Webhooks' },
  { href: '/categories', label: 'Categories' },
]

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 bg-gray-900 text-white">
        <div className="px-5 py-5 border-b border-gray-700">
          <span className="text-lg font-black text-amber-400">Taim</span>
          <span className="ml-1 text-xs text-gray-400 uppercase tracking-wider">Admin</span>
        </div>
        <nav className="px-3 py-4 flex flex-col h-[calc(100vh-61px)]">
          <div className="flex-1 space-y-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                {n.label}
              </Link>
            ))}
          </div>
          <form action="/auth/sign-out" method="POST" className="pb-2">
            <button type="submit"
              className="w-full rounded-lg border border-gray-700 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              ↩ Sign out
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
