import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { APP_NAME } from '@taim/config'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, roles')
    .eq('id', user.id)
    .single()

  const roles: string[] = profile?.roles ?? []
  const isPoster = roles.includes('poster') || roles.includes('admin')
  const isTasker = roles.includes('tasker') || roles.includes('admin')

  // Load poster's active tasks
  const { data: myTasks } = isPoster
    ? await supabase
        .from('tasks')
        .select('id, title, status, offer_count, budget_paise, created_at')
        .eq('poster_id', user.id)
        .in('status', ['open', 'assigned', 'in_progress', 'tasker_done'])
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: null }

  // Load tasker's accepted offers
  const { data: myOffers } = isTasker
    ? await supabase
        .from('offers')
        .select('id, amount_paise, status, task_id, tasks(id, title, status, poster_id)')
        .eq('tasker_id', user.id)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: null }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-2xl font-black text-brand-600">{APP_NAME}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{profile?.name ?? user.email}</span>
            <Link href="/auth/sign-out" className="text-sm text-gray-500 hover:text-gray-700">Sign out</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          {isPoster && (
            <Link href="/tasks/new" className="rounded-2xl bg-brand-600 p-6 text-white hover:bg-brand-700 transition-colors">
              <p className="text-2xl font-bold">+ Post a task</p>
              <p className="mt-1 text-brand-100">Describe what you need</p>
            </Link>
          )}
          {isTasker && (
            <Link href="/tasks" className="rounded-2xl border-2 border-brand-600 p-6 text-brand-600 hover:bg-brand-50 transition-colors">
              <p className="text-2xl font-bold">Browse tasks</p>
              <p className="mt-1 text-gray-600">Find tasks near you</p>
            </Link>
          )}
        </div>

        {/* My posted tasks */}
        {isPoster && myTasks && myTasks.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900">My tasks</h2>
            <div className="space-y-3">
              {myTasks.map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.offer_count} offer{task.offer_count !== 1 ? 's' : ''} ·
                      ₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    task.status === 'open' ? 'bg-green-100 text-green-700'
                    : task.status === 'assigned' ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                  }`}>{task.status}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* My offers */}
        {isTasker && myOffers && myOffers.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-gray-900">My offers</h2>
            <div className="space-y-3">
              {myOffers.map(offer => {
                const task = offer.tasks as { id: string; title: string; status: string } | null
                return (
                  <Link key={offer.id} href={`/tasks/${task?.id}`}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-semibold text-gray-900">{task?.title}</p>
                      <p className="text-sm text-brand-600 font-semibold">
                        ₹{Math.round(offer.amount_paise / 100).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      offer.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{offer.status}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
