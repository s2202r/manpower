import { SupabaseClient } from '@supabase/supabase-js'

interface NotifyParams {
  supabase: SupabaseClient
  userId: string
  kind: string
  title: string
  body: string
  link?: string
}

export async function notify(params: NotifyParams) {
  const { supabase, userId, kind, title, body, link } = params
  await supabase.from('notifications').insert({ user_id: userId, kind, title, body, link })
}
