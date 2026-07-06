import { SupabaseClient } from '@supabase/supabase-js';

/** Look up a Worker row by the auth user's phone or email. */
export async function workerFromUser(
  sb: SupabaseClient,
  user: { phone?: string | null; email?: string | null }
): Promise<{ id: string } | null> {
  if (user.phone) {
    const { data } = await sb.from('Worker').select('id').eq('phone', user.phone).maybeSingle();
    if (data) return data as { id: string };
  }
  if (user.email) {
    const { data } = await sb.from('Worker').select('id').eq('email', user.email).maybeSingle();
    if (data) return data as { id: string };
  }
  return null;
}
