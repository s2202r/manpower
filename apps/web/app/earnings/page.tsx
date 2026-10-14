import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'My Earnings — Taim' }

// Ceiling division for fee calculation (mirrors packages/core/src/fees.ts)
function rateCeil(amount: bigint, numer: bigint, denom: bigint): bigint {
  const product = amount * numer
  const quotient = product / denom
  return product % denom > 0n ? quotient + 1n : quotient
}

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles, verification_tier')
    .eq('id', user.id)
    .single()

  const roles = (profile?.roles as string[]) ?? []
  if (!roles.includes('tasker') && !roles.includes('both') && !roles.includes('admin')) {
    redirect('/dashboard')
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, amount_paise, escrow_state, created_at, tasks!task_id(title, task_type)')
    .eq('tasker_id', user.id)
    .in('escrow_state', ['released', 'paid_out'])
    .order('created_at', { ascending: false })
    .limit(50)

  // Fee tier: 0=10%, 1=7%, 2=0%
  // tier 1 = KYC verified (veteran handled server-side; surface only basic tiers here)
  const tier = profile?.verification_tier === 'kyc' ? 1 : 0

  const TASKER_FEE_RATES = [
    { numer: 10n, denom: 100n }, // tier 0: 10%
    { numer: 7n,  denom: 100n }, // tier 1: 7%
    { numer: 0n,  denom: 100n }, // tier 2: 0%
  ]
  const rate = TASKER_FEE_RATES[tier] ?? TASKER_FEE_RATES[0]

  const fmtRs = (p: bigint) => `₹${Number(p / 100n).toLocaleString('en-IN')}`

  type Booking = NonNullable<typeof bookings>[number]

  function netAmount(b: Booking): bigint {
    const gross = BigInt(b.amount_paise as number)
    const fee = rateCeil(gross, rate.numer, rate.denom)
    const gst = rateCeil(fee, 18n, 100n)
    return gross - fee - gst
  }

  const totalNet = (bookings ?? []).reduce((sum, b) => sum + netAmount(b), 0n)
  const paidOut = (bookings ?? []).filter(b => b.escrow_state === 'paid_out')
  const pendingPayout = (bookings ?? []).filter(b => b.escrow_state === 'released')

  const STATUS_C: Record<string, string> = {
    released: 'bg-amber-100 text-amber-700',
    paid_out: 'bg-green-100 text-green-700',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Dashboard</Link>
          <span className="text-gray-200">/</span>
          <span className="font-semibold text-gray-900">My earnings</span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Total net</p>
            <p className="text-xl font-black text-gray-900">{fmtRs(totalNet)}</p>
          </div>
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Paid out</p>
            <p className="text-xl font-black text-green-700">{paidOut.length}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Pending</p>
            <p className="text-xl font-black text-amber-700">{pendingPayout.length}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Fee tier {tier}: {Number(rate.numer)}% platform fee + 18% GST deducted. Net amount shown after deductions.
        </p>

        {/* Earnings table */}
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          {(bookings ?? []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No completed bookings yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {(bookings ?? []).map(b => {
                const task = b.tasks as unknown as { title: string; type: string } | null
                const net = netAmount(b)
                return (
                  <li key={b.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{task?.title ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Gross ₹{Math.round((b.amount_paise as number) / 100).toLocaleString('en-IN')} · {new Date(b.created_at as string).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-base font-black text-gray-900">{fmtRs(net)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_C[b.escrow_state as string] ?? ''}`}>
                        {b.escrow_state === 'paid_out' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
