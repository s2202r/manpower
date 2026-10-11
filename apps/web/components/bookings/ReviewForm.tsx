'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewForm({ bookingId, revieweeId }: { bookingId: string; revieweeId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) { setError('Please select a rating'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, revieweeId, rating, comment: comment || undefined }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) setError(data.error ?? 'Failed to submit review')
    else router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-gray-900">Leave a review</h2>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button" onClick={() => setRating(s)}
            className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={3} value={comment} onChange={e => setComment(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        placeholder="Write a comment (optional)…"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading || rating < 1}
        className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
