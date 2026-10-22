import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/disputes', label: 'Disputes' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/kyc', label: 'KYC' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/categories', label: 'Categories' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
              <Link
                key={n.href}
                href={n.href}
                className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="pb-2 space-y-1">
            <Link
              href="/"
              className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              ← Back to app
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="w-full rounded-lg border border-gray-700 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                ↩ Sign out
              </button>
            </form>
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  )
}
