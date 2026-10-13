import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar'

export const metadata = { title: 'Search tasks' }

interface SearchParams { q?: string; type?: string; min?: string; max?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const q = params.q?.trim() ?? ''
  const type = params.type ?? ''

  let query = supabase
    .from('tasks')
    .select('id, title, description, task_type, budget_paise, display_area, offer_count, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch', config: 'simple' })
  if (type && ['in_person', 'pickup_drop', 'remote'].includes(type)) query = query.eq('task_type', type)

  const { data: tasks } = await query

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <SearchBar defaultQ={q} defaultType={type} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {q && (
          <p className="text-sm text-gray-500">
            {tasks?.length ?? 0} result{tasks?.length !== 1 ? 's' : ''} for &ldquo;<strong className="text-gray-900">{q}</strong>&rdquo;
          </p>
        )}

        {(!tasks || tasks.length === 0) ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <p className="text-xl mb-2">{q ? 'No tasks match your search.' : 'No open tasks right now.'}</p>
            <p className="text-sm">Try different keywords or <Link href="/tasks" className="text-amber-600 font-semibold">browse all tasks</Link>.</p>
          </div>
        ) : (
          tasks.map(task => (
            <Link key={task.id} href={`/tasks/${task.id}`}
              className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">{task.title}</h2>
                <span className="text-xl font-black text-amber-600 whitespace-nowrap ml-4">
                  ₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{task.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{task.task_type === 'in_person' ? '📍' : task.task_type === 'pickup_drop' ? '🛵' : '💻'} {task.display_area ?? task.task_type}</span>
                <span>{task.offer_count} offers</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
