import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import CategoryDeleteButton from './CategoryDeleteButton'
import CategoryCreateForm from './CategoryCreateForm'

export const metadata = { title: 'Categories — Admin' }
export const dynamic = 'force-dynamic'

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; detail?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { msg, detail } = await searchParams

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, names, icon, allowed_types, is_live, sort_order')
    .order('sort_order')
    .order('slug')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">{categories?.length ?? 0} categories total</p>
      </div>

      {msg === 'created' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-5 text-sm text-green-700 font-medium">
          ✓ Category created successfully.
        </div>
      )}
      {msg === 'deleted' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5 text-sm text-amber-700 font-medium">
          Category deleted.
        </div>
      )}
      {msg === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 text-sm text-red-700">
          <p className="font-semibold">⚠ Failed to create category</p>
          {detail && <p className="mt-1 font-mono text-xs text-red-600">{detail}</p>}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Existing categories</p>
        </div>
        {(categories ?? []).length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No categories yet — create one below.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {(categories ?? []).map(cat => {
              const names = cat.names as Record<string, string>
              const label = names['en'] ?? names[Object.keys(names)[0]] ?? cat.slug
              const types = (cat.allowed_types as string[]) ?? []
              return (
                <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl w-8 text-center shrink-0">{cat.icon ?? '📋'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{label}</p>
                        {!cat.is_live && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">hidden</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        /{cat.slug}
                        {types.length > 0 && (
                          <span className="ml-2 text-gray-300">
                            {types.map(t => t === 'in_person' ? '📍' : t === 'pickup_drop' ? '🛵' : '💻').join(' ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <CategoryDeleteButton categoryId={cat.id} categoryName={label} />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <CategoryCreateForm />
    </div>
  )
}
