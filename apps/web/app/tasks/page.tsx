import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import SearchBox from '@/components/tasks/SearchBox'

export const metadata = { title: 'Browse tasks' }
export const revalidate = 30

export default async function TaskFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; category?: string }>
}) {
  const { type, q, category } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name')

  let query = supabase
    .from('tasks')
    .select('id, title, description, task_type, budget_paise, display_area, status, date_from, date_flexibility, created_at, categories(names, icon)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
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
          {/* Type filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: '', label: 'All' },
              { value: 'in_person', label: '📍 In person' },
              { value: 'pickup_drop', label: '🛵 Pickup–drop' },
              { value: 'remote', label: '💻 Remote' },
            ].map(({ value, label }) => (
              <Link
                key={value}
                href={value ? `/tasks?type=${value}${category ? `&category=${category}` : ''}` : `/tasks${category ? `?category=${category}` : ''}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  (type ?? '') === value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          {/* Category chips */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href={type ? `/tasks?type=${type}` : '/tasks'}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  !category
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                }`}
              >
                All
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/tasks?category=${cat.slug}${type ? `&type=${type}` : ''}`}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    category === cat.slug
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-amber-300'
                  }`}
                >
                  {cat.icon} {cat.name}
                </Link>
              ))}
            </div>
          )}
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
