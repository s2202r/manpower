import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ChatWindow from '@/components/chat/ChatWindow'

export const metadata = { title: 'Chat' }

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, poster_id, assigned_tasker_id, status')
    .eq('id', taskId)
    .single()

  if (!task) notFound()

  const isPoster = user.id === task.poster_id
  const isTasker = user.id === task.assigned_tasker_id

  if (!isPoster && !isTasker) redirect(`/tasks/${taskId}`)

  // Get or create conversation
  const posterId = task.poster_id
  const taskerId = task.assigned_tasker_id!

  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('task_id', taskId)
    .eq('poster_id', posterId)
    .eq('tasker_id', taskerId)
    .single()

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ task_id: taskId, poster_id: posterId, tasker_id: taskerId })
      .select('id')
      .single()
    conversation = newConv
  }

  if (!conversation) notFound()

  // Load initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, profiles!sender_id(name)')
    .eq('conversation_id', conversation.id)
    .order('created_at')
    .limit(100)

  return (
    <main className="flex h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-4 py-4">
        <h1 className="font-bold text-gray-900">{task.title}</h1>
        <p className="text-sm text-gray-500">
          {isPoster ? 'Chatting with your Tasker' : 'Chatting with the Poster'}
        </p>
      </header>
      <ChatWindow
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={(messages ?? []).map(m => ({
          id: m.id,
          senderId: m.sender_id,
          body: m.body,
          createdAt: m.created_at,
          senderName: (m.profiles as { name: string } | null)?.name ?? 'User',
        }))}
      />
    </main>
  )
}
