import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostTaskForm from '@/components/tasks/PostTaskForm'

export const metadata = { title: 'Post a task' }

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, names, icon, allowed_types, is_live')
    .order('sort_order')

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Post a task</h1>
        <PostTaskForm categories={categories ?? []} />
      </div>
    </main>
  )
}
