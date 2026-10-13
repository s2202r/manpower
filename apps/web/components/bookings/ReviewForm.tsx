'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId: string
  revieweeId: string
  revieweeName: string
}

export default function ReviewForm({ bookingId, revieweeId, revieweeName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <p className="text-2xl mb-2">⭐</p>
        <p className="font-bold text-green-800">Review submitted!</p>
        <p className="text-sm text-green-600 mt-1">Thank you for your feedback.</p>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, revieweeId, rating, comment: body || undefined }),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    } else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Failed to submit review')
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="font-bold text-gray-900">Leave a review for {revieweeName}</h3>

      {/* Star picker */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${s} star${s > 1 ? 's' : ''}`}
          >
            {s <= (hovered || rating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Share your experience (optional)…"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none resize-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={rating === 0 || submitting}
        className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
