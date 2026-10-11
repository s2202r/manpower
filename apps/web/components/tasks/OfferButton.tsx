'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Offer {
  id: string
  amount_paise: number
  message: string | null
  status: string
}

export default function OfferButton({ taskId, existingOffer }: { taskId: string; existingOffer: Offer | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(existingOffer ? String(existingOffer.amount_paise / 100) : '')
  const [message, setMessage] = useState(existingOffer?.message ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (existingOffer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="font-semibold text-gray-900 mb-1">Your offer</p>
        <p className="text-2xl font-bold text-brand-600">₹{(existingOffer.amount_paise / 100).toLocaleString('en-IN')}</p>
        {existingOffer.message && <p className="mt-2 text-gray-600">{existingOffer.message}</p>}
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          existingOffer.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>{existingOffer.status}</span>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountPaise = Math.round(parseFloat(amount) * 100)
    if (isNaN(amountPaise) || amountPaise < 100) { setError('Offer must be at least ₹1'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/sign-in'); return }
    const { error } = await supabase.from('offers').insert({
      task_id: taskId,
      tasker_id: user.id,
      amount_paise: amountPaise,
      message: message || null,
    })
    if (error) setError(error.message)
    else { setOpen(false); router.refresh() }
    setLoading(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-brand-600 py-4 font-bold text-white hover:bg-brand-700">
        Send an offer
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-bold">Send your offer</h2>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Your price (₹)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
          <input type="number" min="1" step="1" required value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 focus:border-brand-500 focus:outline-none"
            placeholder="500" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Message (optional)</label>
        <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          placeholder="Tell the Poster why you're the right person for this task…" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-semibold text-gray-700">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Sending…' : 'Send offer'}
        </button>
      </div>
    </form>
  )
}
