'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return }
    router.push('/?deleted=1')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Delete your account</h1>
        <p className="text-gray-600 mb-2 text-sm">
          This is irreversible. Your profile will be anonymised and your account will be signed out.
        </p>
        <p className="text-gray-600 mb-6 text-sm">
          You cannot delete your account while funds are held in escrow.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
            </label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none"
              placeholder="DELETE MY ACCOUNT" />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading || confirm !== 'DELETE MY ACCOUNT'}
            className="w-full rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Deleting…' : 'Delete my account'}
          </button>
          <Link href="/profile" className="block text-center text-sm text-gray-500 hover:text-gray-700">
            Cancel — keep my account
          </Link>
        </form>
      </div>
    </main>
  )
}
