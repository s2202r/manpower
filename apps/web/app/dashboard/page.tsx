import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from '@/components/NotificationBell'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, roles, verification_tier, rating_avg, rating_count, referral_code, referral_count')
    .eq('id', user.id)
    .single()

  const roles: string[] = (profile?.roles as string[]) ?? []
  const isPoster = roles.includes('poster') || roles.includes('admin')
  const isTasker = roles.includes('tasker') || roles.includes('admin')

  // --- Poster stats ---
  const [posterTasksRes, posterInProgressRes, posterSpentRes, posterRecentRes] = isPoster
    ? await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('poster_id', user.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('poster_id', user.id).in('status', ['assigned', 'in_progress', 'tasker_done']),
        supabase.from('bookings').select('amount_paise').eq('poster_id', user.id).eq('escrow_state', 'released'),
        supabase.from('tasks').select('id, title, status, offer_count, budget_paise, created_at').eq('poster_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
    : [null, null, null, null]

  // --- Tasker stats ---
  const [taskerOffersRes, taskerAcceptedRes, taskerEarnedRes, taskerRecentRes] = isTasker
    ? await Promise.all([
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('tasker_id', user.id),
        supabase.from('offers').select('id', { count: 'exact', head: true }).eq('tasker_id', user.id).eq('status', 'accepted'),
        supabase.from('bookings').select('tasker_payout_paise').eq('tasker_id', user.id).eq('escrow_state', 'released'),
        supabase.from('offers').select('id, amount_paise, status, task_id, created_at, tasks(title)').eq('tasker_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
    : [null, null, null, null]

  const totalSpent = (posterSpentRes?.data ?? []).reduce((s, b) => s + (b.amount_paise as number), 0)
  const totalEarned = (taskerEarnedRes?.data ?? []).reduce((s, b) => s + (b.tasker_payout_paise as number), 0)
  const tier = profile?.verification_tier ?? 'none'

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Hey {profile?.name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {tier === 'kyc' ? '✅ KYC verified' : tier === 'email' ? '📧 Email verified' : '⚠️ Not verified'}
              {profile?.rating_count ? ` · ⭐ ${(profile.rating_avg ?? 0).toFixed(1)} (${profile.rating_count} reviews)` : ''}
            </p>
            <Link href="/profile/edit" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Edit profile →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {isPoster && (
              <Link href="/tasks/new" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
                + Post task
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Poster section */}
        {isPoster && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your tasks</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              <StatTile label="Total posted" value={posterTasksRes?.count ?? 0} />
              <StatTile label="In progress" value={posterInProgressRes?.count ?? 0} color="blue" />
              <StatTile label="Open tasks" value={(posterTasksRes?.count ?? 0) - (posterInProgressRes?.count ?? 0)} color="green" />
              <StatTile label="Total spent" value={`₹${Math.round(totalSpent / 100).toLocaleString('en-IN')}`} color="amber" />
            </div>

            {posterRecentRes?.data && posterRecentRes.data.length > 0 && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Recent tasks</span>
                  <Link href="/tasks" className="text-sm text-amber-600 hover:text-amber-700 font-medium">View all →</Link>
                </div>
                <ul className="divide-y divide-gray-50">
                  {posterRecentRes.data.map(task => (
                    <li key={task.id}>
                      <Link href={`/tasks/${task.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{task.offer_count} offers · ₹{Math.round((task.budget_paise as number) / 100).toLocaleString('en-IN')}</p>
                        </div>
                        <StatusBadge status={task.status as string} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!posterRecentRes?.data || posterRecentRes.data.length === 0) && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-gray-500 mb-4">No tasks yet. Post your first task to get started.</p>
                <Link href="/tasks/new" className="inline-block rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-white hover:bg-amber-600 transition-colors">
                  Post a task
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Tasker section */}
        {isTasker && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your work</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              <StatTile label="Offers sent" value={taskerOffersRes?.count ?? 0} />
              <StatTile label="Accepted" value={taskerAcceptedRes?.count ?? 0} color="green" />
              <StatTile label="Completed" value={taskerAcceptedRes?.count ?? 0} color="blue" />
              <StatTile label="Total earned" value={`₹${Math.round(totalEarned / 100).toLocaleString('en-IN')}`} color="amber" />
            </div>

            {taskerRecentRes?.data && taskerRecentRes.data.length > 0 && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Recent offers</span>
                  <Link href="/tasks" className="text-sm text-amber-600 hover:text-amber-700 font-medium">Browse tasks →</Link>
                </div>
                <ul className="divide-y divide-gray-50">
                  {taskerRecentRes.data.map((offer: Record<string, unknown>) => {
                    const task = offer.tasks as { title: string } | null
                    return (
                      <li key={offer.id as string}>
                        <Link href={`/tasks/${offer.task_id as string}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{task?.title ?? 'Task'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">₹{Math.round((offer.amount_paise as number) / 100).toLocaleString('en-IN')}</p>
                          </div>
                          <StatusBadge status={offer.status as string} />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {(!taskerRecentRes?.data || taskerRecentRes.data.length === 0) && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <p className="text-gray-500 mb-4">No offers yet. Browse tasks and send your first offer.</p>
                <Link href="/tasks" className="inline-block rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-white hover:bg-amber-600 transition-colors">
                  Browse tasks
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Invite friends */}
        {profile?.referral_code && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <h3 className="font-bold text-amber-900 mb-1">Invite friends 🎁</h3>
            <p className="text-sm text-amber-700 mb-3">Share your link and grow the community.</p>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-amber-200 mb-2">
              <code className="flex-1 text-sm font-mono text-amber-800">taim.in/invite/{profile.referral_code}</code>
            </div>
            <p className="text-xs text-amber-600">{(profile.referral_count as number) ?? 0} people joined with your code</p>
          </div>
        )}

        {/* Empty state for new users */}
        {!isPoster && !isTasker && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-900 mb-2">Welcome to Taim!</p>
            <p className="text-gray-500 mb-6">Tell us how you want to use Taim to get started.</p>
            <Link href="/onboarding" className="inline-block rounded-xl bg-amber-500 px-6 py-3 font-bold text-white hover:bg-amber-600 transition-colors">
              Set up your profile
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

function StatTile({ label, value, color = 'gray' }: { label: string; value: string | number; color?: 'gray' | 'amber' | 'green' | 'blue' }) {
  const colors = {
    gray:  'bg-white',
    amber: 'bg-amber-50',
    green: 'bg-green-50',
    blue:  'bg-blue-50',
  }
  const valueColors = {
    gray:  'text-gray-900',
    amber: 'text-amber-700',
    green: 'text-green-700',
    blue:  'text-blue-700',
  }
  return (
    <div className={`rounded-2xl ${colors[color]} p-5 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${valueColors[color]}`}>{value}</p>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-green-100 text-green-700',
  assigned:    'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  tasker_done: 'bg-orange-100 text-orange-700',
  completed:   'bg-gray-100 text-gray-600',
  cancelled:   'bg-red-100 text-red-600',
  pending:     'bg-yellow-100 text-yellow-700',
  accepted:    'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-500',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
