'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'

interface Props {
  bookingId: string
  taskId: string
  escrowState: string
  taskStatus: string
  isPoster: boolean
  isTasker: boolean
}

export default function BookingActions({ bookingId, taskId, escrowState, taskStatus, isPoster, isTasker }: Props) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  async function callApi(path: string, body: Record<string, unknown> = {}) {
    setLoading(path)
    setError(null)
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json() as Record<string, unknown>
    setLoading(null)
    if (!res.ok) setError(data.error as string ?? 'Something went wrong')
    else router.refresh()
    return { ok: res.ok, data }
  }

  // Tasker: mark work done
  if (isTasker && escrowState === 'held' && taskStatus === 'in_progress') {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-gray-900">Mark work as done</h2>
        <p className="text-sm text-gray-600">This generates an OTP for the Poster to confirm completion.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {devOtp && (
          <div className="rounded-xl bg-green-50 p-3">
            <p className="text-sm font-mono font-bold text-green-800">Dev OTP: {devOtp}</p>
          </div>
        )}
        <button
          onClick={async () => {
            const { data } = await callApi(`/api/bookings/${bookingId}/done`)
            if (data.otp) setDevOtp(data.otp as string)
          }}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && <Spinner />}
          {loading ? 'Processing…' : 'Mark as done'}
        </button>
      </div>
    )
  }

  // Poster: confirm with OTP
  if (isPoster && escrowState === 'held' && taskStatus === 'tasker_done') {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-gray-900">Confirm completion</h2>
        <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to you by the Tasker to release payment.</p>
        <input
          type="text" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-widest focus:border-brand-500 focus:outline-none"
          placeholder="123456"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={() => callApi(`/api/bookings/${bookingId}/confirm`, { otp })}
          disabled={otp.length !== 6 || loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading === `/api/bookings/${bookingId}/confirm` && <Spinner />}
          {loading ? 'Confirming…' : 'Confirm & release payment'}
        </button>
        <button
          onClick={() => callApi(`/api/bookings/${bookingId}/refund`, { reason: 'Poster disputed completion' })}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-400 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loading === `/api/bookings/${bookingId}/refund` && <Spinner className="h-4 w-4 text-red-600" />}
          Raise a dispute
        </button>
      </div>
    )
  }

  if (escrowState === 'released') {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="font-bold text-green-800 mt-2">Task completed and payment released!</p>
      </div>
    )
  }

  if (escrowState === 'refunded') {
    return (
      <div className="rounded-2xl bg-orange-50 p-6 text-center">
        <p className="text-2xl">↩️</p>
        <p className="font-bold text-orange-800 mt-2">Payment refunded.</p>
      </div>
    )
  }

  void taskId // used by parent for chat link

  return null
}
