'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // requireAdmin will check the role; redirect there and let it gate
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-black text-amber-400">Taim</span>
          <span className="ml-2 text-sm font-semibold uppercase tracking-widest text-gray-400">Admin</span>
          <p className="mt-2 text-sm text-gray-500">Sign in to the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-gray-800 p-8 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full rounded-xl bg-gray-700 border border-gray-600 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl bg-gray-700 border border-gray-600 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/40 border border-red-700 px-4 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-400 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Admin access only — contact your system administrator
        </p>
      </div>
    </main>
  )
}
