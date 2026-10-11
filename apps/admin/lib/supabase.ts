import { createClient } from '@supabase/supabase-js'

// This module must ONLY be imported in server components and route handlers.
// Never import it in client components — it uses the service role key.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase admin env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}
