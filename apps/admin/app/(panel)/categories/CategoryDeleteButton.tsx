'use client'

export default function CategoryDeleteButton({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  return (
    <form
      action={`/api/admin/categories/${categoryId}/delete`}
      method="POST"
      onSubmit={e => { if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) e.preventDefault() }}
    >
      <button type="submit" className="shrink-0 text-xs text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
        Delete
      </button>
    </form>
  )
}
