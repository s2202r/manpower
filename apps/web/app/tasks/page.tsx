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
    .select('id, names, slug, icon')
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

  const taskCount = tasks?.length ?? 0

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Sticky filter header */}
      <header className="sticky top-16 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-2xl space-y-3">
          <div className="flex items-center gap-3">
            <Suspense fallback={
              <input placeholder="Search tasks…" className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm bg-gray-50" disabled />
            }>
              <SearchBox defaultValue={q ?? ''} />
            </Suspense>
            <Link href="/tasks/new"
              className="shrink-0 rounded-full bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors shadow-sm">
              + Post
            </Link>
          </div>
          <Suspense fallback={null}>
            <TaskFilters
              categories={categories ?? []}
              current={{ type, category, minBudget, maxBudget, sort, q }}
            />
          </Suspense>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {/* Result count */}
        {taskCount > 0 && (
          <p className="text-xs text-gray-400 font-medium mb-4">
            {taskCount} task{taskCount !== 1 ? 's' : ''} found
            {q ? ` for "${q}"` : ''}
          </p>
        )}

        {taskCount === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-bold text-gray-900 mb-1">No tasks found</p>
            <p className="text-sm text-gray-500 mb-5">Try different filters or be the first to post one.</p>
            <Link href="/tasks/new"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-white hover:bg-amber-600 transition-colors">
              Post a task
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks!.map(task => {
              const cat = task.categories as unknown as { names: Record<string, string>; icon: string } | null
              const budgetRs = Math.round(task.budget_paise / 100)
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}
                  className="group block rounded-2xl bg-white px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
                  {/* Top row: category + budget */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      {cat && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 mb-1.5">
                          {cat.icon} {cat.names?.['en']}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
                        {task.title}
                      </h2>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-brand-600">₹{budgetRs.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      {task.task_type === 'in_person' ? '📍' : task.task_type === 'pickup_drop' ? '🛵' : '💻'}
                      <span>{task.display_area ?? (task.task_type === 'remote' ? 'Remote' : 'Location TBD')}</span>
                    </span>
                    {task.date_from && (
                      <span className="flex items-center gap-1">
                        📅 <span>{task.date_from}</span>
                      </span>
                    )}
                    <span className="ml-auto text-gray-300">
                      {new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
