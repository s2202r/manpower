import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Expire open tasks older than 30 days
  const { data: expiredTasks, error: taskErr } = await supabase
    .from('tasks')
    .update({ status: 'expired' })
    .eq('status', 'open')
    .lt('created_at', thirtyDaysAgo.toISOString())
    .select('id, title, poster_id')

  // Reject stale pending offers older than 14 days
  const { data: expiredOffers, error: offerErr } = await supabase
    .from('offers')
    .update({ status: 'rejected' })
    .eq('status', 'pending')
    .lt('created_at', fourteenDaysAgo.toISOString())
    .select('id, task_id, tasker_id')

  // Notify posters about expired tasks
  if (expiredTasks && expiredTasks.length > 0) {
    const notifications = expiredTasks.map((t: { id: string; title: string; poster_id: string }) => ({
      user_id: t.poster_id,
      kind: 'task_expired',
      title: 'Task expired',
      body: `Your task "${t.title}" expired after 30 days. Re-post it to receive new offers.`,
      link: `/tasks/${t.id}`,
    }))
    await supabase.from('notifications').insert(notifications)
  }

  const result = {
    tasks_expired: expiredTasks?.length ?? 0,
    offers_expired: expiredOffers?.length ?? 0,
    task_error: taskErr?.message ?? null,
    offer_error: offerErr?.message ?? null,
  }

  console.log('expire-stale-items result:', JSON.stringify(result))
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  })
})
