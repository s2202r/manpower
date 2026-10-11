'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OfferProfile {
  name: string
  photo_url: string | null
  rating_avg: number | null
  rating_count: number
}

interface Offer {
  id: string
  tasker_id: string
  amount_paise: number
  message: string | null
  status: string
  profiles: OfferProfile | null
}

export default function OffersList({ taskId, offers, taskStatus }: {
  taskId: string
  offers: Offer[]
  taskStatus: string
}) {
  const router = useRouter()
  const [accepting, setAccepting] = useState<string | null>(null)

  async function acceptOffer(offerId: string, taskerId: string) {
    setAccepting(offerId)
    const supabase = createClient()
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId)
    await supabase.from('offers').update({ status: 'rejected' }).eq('task_id', taskId).neq('id', offerId)
    await supabase.from('tasks').update({ status: 'assigned', assigned_tasker_id: taskerId }).eq('id', taskId)
    setAccepting(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Offers ({offers.length})</h2>
      {offers.map(offer => {
        const profile = offer.profiles
        return (
          <div key={offer.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                  {profile?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{profile?.name}</p>
                  {profile && profile.rating_count > 0 && (
                    <p className="text-xs text-gray-500">⭐ {profile.rating_avg?.toFixed(1)} ({profile.rating_count})</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">
                  ₹{(offer.amount_paise / 100).toLocaleString('en-IN')}
                </p>
                <span className={`text-xs font-semibold capitalize ${
                  offer.status === 'accepted' ? 'text-green-600'
                  : offer.status === 'rejected' ? 'text-red-500'
                  : 'text-yellow-600'
                }`}>{offer.status}</span>
              </div>
            </div>
            {offer.message && <p className="text-gray-600 text-sm mb-3">{offer.message}</p>}
            {taskStatus === 'open' && offer.status === 'pending' && (
              <button
                onClick={() => acceptOffer(offer.id, offer.tasker_id)}
                disabled={accepting === offer.id}
                className="w-full rounded-xl bg-green-600 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {accepting === offer.id ? 'Accepting…' : 'Accept this offer'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
