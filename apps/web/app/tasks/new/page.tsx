import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostTaskForm from './PostTaskForm'

export const metadata = { title: 'Post a Task — Taim' }

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?next=/tasks/new')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-lg">
          <h1 className="text-xl font-black text-gray-900">Post a task</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tell us what you need done</p>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-6">
        <PostTaskForm categories={categories ?? []} />
      </div>
    </main>
  )
}
