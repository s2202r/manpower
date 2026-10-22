import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PostTaskForm from '@/components/tasks/PostTaskForm'

export const metadata = { title: 'Post a Task — Taim' }

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?next=/tasks/new')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, names, icon, allowed_types, is_live')
    .order('slug')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto max-w-lg flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Back</Link>
          <span className="text-gray-200 mx-1">/</span>
          <span className="font-semibold text-gray-900 text-sm">Post a task</span>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-6">
        <PostTaskForm categories={categories ?? []} />
      </div>
    </main>
  )
}
