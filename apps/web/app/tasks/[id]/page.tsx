import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from '@/lib/date'
import OfferButton from '@/components/tasks/OfferButton'
import OffersList from '@/components/tasks/OffersList'
import ChatPanel from '@/components/tasks/ChatPanel'

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

  // Fetch assigned tasker name for chat header
  let assignedTaskerName: string | null = null
  if (task.assigned_tasker_id) {
    const { data: taskerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', task.assigned_tasker_id)
      .single()
    assignedTaskerName = taskerProfile?.name ?? null
  }

  const canChat = !!task.assigned_tasker_id && !!user && (isPoster || isAssignedTasker)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-6">
        {/* Task card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
                {category?.icon} {category?.names?.['en']}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              task.status === 'open' ? 'bg-green-100 text-green-700'
              : task.status === 'assigned' ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
            }`}>{task.status}</span>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap mb-4">{task.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4">
            <div>
              <span className="font-semibold">Budget:</span>{' '}
              ₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}
            </div>
            <div>
              <span className="font-semibold">Type:</span>{' '}
              {task.task_type === 'in_person' ? '📍 In person' : task.task_type === 'pickup_drop' ? '🛵 Pickup–drop' : '💻 Remote'}
            </div>
            {task.display_area && (
              <div><span className="font-semibold">Area:</span> {task.display_area}</div>
            )}
            {task.date_from && (
              <div><span className="font-semibold">Date:</span> {task.date_from}</div>
            )}
          </div>

          {task.photos?.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {(task.photos as string[]).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-24 w-24 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>
          )}
        </div>

        {/* Poster info */}
        {poster && (
          <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
              {poster.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{poster.name}</p>
              {poster.rating_count > 0 && (
                <p className="text-sm text-gray-500">⭐ {poster.rating_avg?.toFixed(1)} ({poster.rating_count} reviews)</p>
              )}
            </div>
          </div>
        )}

        {/* Offer button for taskers */}
        {user && !isPoster && task.status === 'open' && (
          <OfferButton taskId={task.id} existingOffer={myOffer} />
        )}

        {/* Offers list for poster */}
        {isPoster && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Offers ({offers.length})</h2>
            <OffersList offers={offers} taskStatus={task.status} />
          </div>
        )}

        {/* In-task chat (shown once a tasker is assigned) */}
        {canChat && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
            <ChatPanel
              taskId={task.id}
              posterId={task.poster_id}
              taskerId={task.assigned_tasker_id!}
              currentUserId={user!.id}
              otherName={
                isPoster
                  ? (assignedTaskerName ?? 'Tasker')
                  : (poster?.name ?? 'Poster')
              }
            />
          </section>
        )}
      </div>
    </main>
  )
}
