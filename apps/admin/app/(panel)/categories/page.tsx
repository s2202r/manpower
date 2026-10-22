import Link from 'next/link'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'

export const metadata = { title: 'Categories — Admin' }

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { msg } = await searchParams

  const { data: categories } = await supabase
    .from('task_categories')
    .select('id, name, slug, icon, task_count:tasks(count)')
    .order('name')

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      {msg === 'created' && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">Category created.</div>}
      {msg === 'deleted' && <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5 text-sm text-amber-700 font-medium">Category deleted.</div>}

      {/* Existing categories */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        {(categories ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {(categories ?? []).map(cat => {
              const count = (cat.task_count as unknown as Array<{ count: number }>)?.[0]?.count ?? 0
              return (
                <li key={cat.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon ?? '📋'}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">/{cat.slug} · {count} tasks</p>
                    </div>
                  </div>
                  <form action={`/api/admin/categories/${cat.id}/delete`} method="POST" onSubmit={(e) => { if (!confirm(`Delete "${cat.name}"?`)) e.preventDefault() }}>
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                      Delete
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Create new category */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold text-gray-900 mb-4">New category</h2>
        <form action="/api/admin/categories/create" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input name="name" required placeholder="e.g. Plumbing" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input name="slug" required placeholder="e.g. plumbing" pattern="[a-z0-9-]+" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon (emoji)</label>
            <input name="icon" placeholder="🔧" maxLength={4} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white py-3 text-sm font-bold transition-colors">
            Create category
          </button>
        </form>
      </div>
    </div>
  )
}
