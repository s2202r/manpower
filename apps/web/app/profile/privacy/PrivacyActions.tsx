'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PrivacyActions({ name }: { name: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function deleteAccount() {
    setDeleting(true)
    setError('')
    const res = await fetch('/api/profile/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }),
    })
    setDeleting(false)
    if (res.ok) {
      router.push('/?deleted=1')
    } else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Failed to delete account')
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <>
        {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-3">{error}</p>}
        <button
          onClick={() => setConfirm(true)}
          className="w-full rounded-xl border-2 border-red-200 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete my account
        </button>
      </>
    )
  }

  return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
      <p className="text-sm font-semibold text-red-800">
        Are you sure you want to delete <span className="font-black">{name}</span>&apos;s account? This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={deleteAccount}
          disabled={deleting}
          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
      </div>
    </div>
  )
}
