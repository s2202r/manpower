'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Offer {
  id: string
  taskerId: string
  amount_paise: number
  message: string | null
  status: string
  created_at: string
  taskerName: string
  taskerRating: number | null
  taskerRatingCount: number
  taskerTier: string
}

export default function OffersList({ offers, taskStatus }: { offers: Offer[]; taskStatus: string }) {
  const router = useRouter()
  const [accepting, setAccepting] = useState<string | null>(null)

  async function accept(offerId: string) {
    setAccepting(offerId)
    const res = await fetch(`/api/offers/${offerId}/accept`, { method: 'POST' })
    setAccepting(null)
    if (res.ok) router.refresh()
    else {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Something went wrong')
    }
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
        <p className="text-lg font-semibold">No offers yet</p>
        <p className="text-sm mt-1">Taskers nearby will send you offers soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {offers.map(offer => (
        <div
          key={offer.id}
          className={`rounded-2xl border p-5 transition-colors ${
            offer.status === 'accepted'
              ? 'border-green-200 bg-green-50'
              : offer.status === 'rejected'
              ? 'border-gray-100 bg-gray-50 opacity-60'
              : 'border-gray-200 bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a href={`/taskers/${offer.taskerId}`} className="font-bold text-gray-900 hover:text-amber-600 transition-colors">
                  {offer.taskerName}
                </a>
                {offer.taskerTier === 'kyc' && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">KYC ✓</span>
                )}
                {offer.taskerRating && offer.taskerRatingCount > 0 && (
                  <span className="text-sm text-amber-600 font-semibold">
                    ⭐ {offer.taskerRating.toFixed(1)} ({offer.taskerRatingCount})
                  </span>
                )}
              </div>
              {offer.message && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{offer.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {new Date(offer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-2xl font-black text-amber-600">
                ₹{Math.round(offer.amount_paise / 100).toLocaleString('en-IN')}
              </span>
              {offer.status === 'accepted' && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Accepted ✓</span>
              )}
              {offer.status === 'rejected' && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">Rejected</span>
              )}
              {offer.status === 'pending' && taskStatus === 'open' && (
                <button
                  onClick={() => accept(offer.id)}
                  disabled={accepting === offer.id}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  {accepting === offer.id ? 'Accepting…' : 'Accept offer'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
