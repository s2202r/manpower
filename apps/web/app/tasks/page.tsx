import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import SearchBox from '@/components/tasks/SearchBox'
import TaskFilters from '@/components/tasks/TaskFilters'

export const metadata = { title: 'Browse tasks' }
export const revalidate = 0

export default async function TaskFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; category?: string; minBudget?: string; maxBudget?: string; sort?: string }>
}) {
  const { type, q, category, minBudget, maxBudget, sort } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name')

  const sortBy = sort === 'budget_asc' ? { col: 'budget_paise', asc: true }
    : sort === 'budget_desc' ? { col: 'budget_paise', asc: false }
    : { col: 'created_at', asc: false }

  let query = supabase
    .from('tasks')
    .select('id, title, description, task_type, budget_paise, display_area, status, date_from, date_flexibility, created_at, categories(names, icon)')
    .eq('status', 'open')
    .order(sortBy.col, { ascending: sortBy.asc })
    .limit(50)

  if (type && ['in_person', 'pickup_drop', 'remote'].includes(type)) {
    query = query.eq('task_type', type)
  }

  if (q) {
    query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
  }

  if (category) {
    const cat = categories?.find(c => c.slug === category)
    if (cat) query = query.eq('category_id', cat.id)
  }

  const minP = minBudget ? Math.round(parseFloat(minBudget) * 100) : null
  const maxP = maxBudget ? Math.round(parseFloat(maxBudget) * 100) : null
  if (minP && minP > 0) query = query.gte('budget_paise', minP)
  if (maxP && maxP > 0) query = query.lte('budget_paise', maxP)

  const { data: tasks } = await query

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-16 z-10 border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">Browse tasks</h1>
            <Link href="/tasks/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              + Post task
            </Link>
          </div>
          {/* Search */}
          <div className="mb-3">
            <Suspense fallback={
              <div className="flex gap-2">
                <input placeholder="Search tasks…" className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm" disabled />
                <button className="rounded-xl bg-amber-500 text-white px-4 py-2.5 text-sm font-bold">Search</button>
              </div>
            }>
              <SearchBox defaultValue={q ?? ''} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <TaskFilters
              categories={categories ?? []}
              current={{ type, category, minBudget, maxBudget, sort, q }}
            />
          </Suspense>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {(!tasks || tasks.length === 0) ? (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            <p className="text-xl">No tasks available right now</p>
            <p className="text-sm mt-2">Check back soon or post a task yourself.</p>
          </div>
        ) : (
          tasks.map(task => {
            const cat = task.categories as unknown as { names: Record<string, string>; icon: string } | null
            return (
              <Link key={task.id} href={`/tasks/${task.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-brand-600 font-semibold">
                      {cat?.icon} {cat?.names?.['en']}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">{task.title}</h2>
                  </div>
                  <span className="text-xl font-black text-brand-600 whitespace-nowrap ml-4">
                    ₹{Math.round(task.budget_paise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{task.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    {task.task_type === 'in_person' ? '📍' : task.task_type === 'pickup_drop' ? '🛵' : '💻'}
                    {' '}{task.display_area ?? task.task_type}
                  </span>
                  {task.date_from && <span>📅 {task.date_from}</span>}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
