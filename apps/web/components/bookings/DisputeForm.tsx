'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DisputeForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5 text-center">
        <p className="font-bold text-orange-800">Dispute raised</p>
        <p className="text-sm text-orange-600 mt-1">Our team will review and contact both parties within 24 hours.</p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-orange-200 py-4 text-sm font-semibold text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-colors"
      >
        ⚠️ Raise a dispute
      </button>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 10) return
    setSubmitting(true)
    const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    setSubmitting(false)
    if (res.ok) { setDone(true); router.refresh() }
    else {
      const d = await res.json() as { error?: string }
      alert(d.error ?? 'Failed to raise dispute')
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-orange-200 bg-orange-50 p-5 space-y-3">
      <h3 className="font-bold text-orange-900">Raise a dispute</h3>
      <p className="text-sm text-orange-700">Explain the issue. Our team will review within 24 hours.</p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Describe the problem in detail…"
        rows={4}
        minLength={10}
        maxLength={1000}
        required
        className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm focus:border-orange-400 focus:outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={reason.trim().length < 10 || submitting}
          className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Raising…' : 'Raise dispute'}
        </button>
      </div>
    </form>
  )
}
