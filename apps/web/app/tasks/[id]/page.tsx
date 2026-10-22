import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, budget_paise, task_type, display_area')
    .eq('id', id)
    .single()

  if (!task) return { title: 'Task not found' }

  const budgetRs = Math.round((task.budget_paise as number) / 100)
  const desc = `₹${budgetRs.toLocaleString('en-IN')} · ${task.task_type} · ${task.display_area ?? 'India'}${task.description ? ' — ' + (task.description as string).slice(0, 120) : ''}`

  return {
    title: task.title as string,
    description: desc,
    openGraph: { title: `${task.title} — Taim`, description: desc, type: 'website' },
  }
}

import { formatDistanceToNow } from '@/lib/date'
import OfferButton from '@/components/tasks/OfferButton'
import OffersList from '@/components/tasks/OffersList'
import ChatPanel from '@/components/tasks/ChatPanel'
import BookingActions from '@/components/bookings/BookingActions'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open:        { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Open' },
  assigned:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Assigned' },
  in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'In progress' },
  tasker_done: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Awaiting confirmation' },
  completed:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Completed' },
  cancelled:   { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Cancelled' },
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: task } = await supabase
    .from('tasks')
    .select('*, categories(names, icon, slug), profiles!poster_id(name, photo_url, rating_avg, rating_count)')
    .eq('id', id)
    .single()

  if (!task) notFound()

  const isPoster = user?.id === task.poster_id
  const isAssignedTasker = user?.id === task.assigned_tasker_id

  const { data: myOffer } = user && !isPoster
    ? await supabase.from('offers').select('*').eq('task_id', id).eq('tasker_id', user.id).single()
    : { data: null }

  // Fetch booking for action buttons
  const { data: booking } = (isPoster || isAssignedTasker) && task.assigned_tasker_id
    ? await supabase.from('bookings').select('id, escrow_state').eq('task_id', id).single()
    : { data: null }

  type OfferRow = {
    id: string; taskerId: string; amount_paise: number; message: string | null; status: string; created_at: string;
    taskerName: string; taskerRating: number | null; taskerRatingCount: number; taskerTier: string;
  }
  let offers: OfferRow[] = []
  if (isPoster) {
    const { data: offerData } = await supabase
      .from('offers')
      .select('id, tasker_id, amount_paise, message, status, created_at, profiles!tasker_id(name, rating_avg, rating_count, verification_tier)')
      .eq('task_id', id)
      .order('amount_paise', { ascending: true })
    offers = (offerData ?? []).map(o => {
      const p = o.profiles as unknown as { name: string; rating_avg: number | null; rating_count: number; verification_tier: string } | null
      return {
        id: o.id, taskerId: o.tasker_id, amount_paise: o.amount_paise, message: o.message, status: o.status, created_at: o.created_at,
        taskerName: p?.name ?? 'Tasker', taskerRating: p?.rating_avg ?? null,
        taskerRatingCount: p?.rating_count ?? 0, taskerTier: p?.verification_tier ?? 'none',
      }
    })
  }

  const category = task.categories as { names: Record<string, string>; icon: string } | null
  const poster = task.profiles as { name: string; photo_url: string | null; rating_avg: number | null; rating_count: number } | null

  let assignedTaskerName: string | null = null
  if (task.assigned_tasker_id) {
    const { data: tp } = await supabase.from('profiles').select('name').eq('id', task.assigned_tasker_id).single()
    assignedTaskerName = tp?.name ?? null
  }

  const canChat = !!task.assigned_tasker_id && !!user && (isPoster || isAssignedTasker)
  const statusStyle = STATUS_STYLES[task.status as string] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: task.status }
  const budgetRs = Math.round(task.budget_paise / 100)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <Link href="/tasks" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Browse tasks</Link>
          {isPoster && (
            <>
              <span className="text-gray-200 mx-1">/</span>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Dashboard</Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* ── Main task card ─────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-brand-50 to-amber-50 px-6 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                {category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 mb-2">
                    {category.icon} {category.names?.['en']}
                  </span>
                )}
                <h1 className="text-xl font-black text-gray-900 leading-snug">{task.title as string}</h1>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            {/* Budget hero */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-brand-600">₹{budgetRs.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500 font-medium">budget</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Description */}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{task.description as string}</p>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              <MetaChip icon={task.task_type === 'in_person' ? '📍' : task.task_type === 'pickup_drop' ? '🛵' : '💻'}
                label={task.task_type === 'in_person' ? 'In person' : task.task_type === 'pickup_drop' ? 'Pickup–drop' : 'Remote'} />
              {task.display_area && <MetaChip icon="🗺" label={task.display_area as string} />}
              {task.date_from && <MetaChip icon="📅" label={task.date_from as string}
                sub={(task.date_flexibility as string) !== 'exact' ? `± ${task.date_flexibility}` : undefined} />}
              <MetaChip icon="🕐" label={formatDistanceToNow(task.created_at as string)} />
            </div>

            {/* Exact address (assigned tasker only) */}
            {task.precise_address && isAssignedTasker && (
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Exact address</p>
                  <p className="text-sm text-gray-800 font-medium">{task.precise_address as string}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.precise_address as string)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-800">
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            )}

            {/* Photos */}
            {(task.photos as string[])?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Photos</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(task.photos as string[]).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Photo ${i + 1}`}
                      className="h-28 w-28 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Posted by ──────────────────────────────────────────────── */}
        {poster && (
          <div className="rounded-2xl bg-white shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-black text-lg shrink-0">
              {poster.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Posted by</p>
              <p className="font-bold text-gray-900">{poster.name}</p>
              {(poster.rating_count ?? 0) > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">⭐ {poster.rating_avg?.toFixed(1)} · {poster.rating_count} reviews</p>
              )}
            </div>
          </div>
        )}

        {/* ── Offer CTA (tasker) ─────────────────────────────────────── */}
        {user && !isPoster && task.status === 'open' && (
          <OfferButton taskId={task.id} existingOffer={myOffer} />
        )}

        {/* ── Booking actions ────────────────────────────────────────── */}
        {booking && (isPoster || isAssignedTasker) && (
          <BookingActions
            bookingId={booking.id}
            taskId={task.id}
            escrowState={booking.escrow_state as string}
            isPoster={isPoster}
            isTasker={isAssignedTasker}
            taskStatus={task.status as string}
          />
        )}

        {/* ── Offers list (poster) ───────────────────────────────────── */}
        {isPoster && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Offers
                {offers.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-bold text-amber-700">{offers.length}</span>
                )}
              </h2>
            </div>
            {offers.length === 0 ? (
              <div className="rounded-2xl bg-white shadow-sm p-8 text-center text-gray-400 text-sm">
                No offers yet — check back soon.
              </div>
            ) : (
              <OffersList offers={offers} taskStatus={task.status as string} />
            )}
          </div>
        )}

        {/* ── Chat ───────────────────────────────────────────────────── */}
        {canChat && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
            <ChatPanel
              taskId={task.id}
              posterId={task.poster_id}
              taskerId={task.assigned_tasker_id!}
              currentUserId={user!.id}
              otherName={isPoster ? (assignedTaskerName ?? 'Tasker') : (poster?.name ?? 'Poster')}
            />
          </section>
        )}
      </div>
    </main>
  )
}

function MetaChip({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
      <span>{icon}</span>
      <span>{label}{sub ? ` (${sub})` : ''}</span>
    </span>
  )
}
