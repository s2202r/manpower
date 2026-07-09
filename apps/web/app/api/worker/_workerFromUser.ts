import { SupabaseClient } from '@supabase/supabase-js';

/** Look up a Worker row by the auth user's phone, email, or supabaseId. */
export async function workerFromUser(
  sb: SupabaseClient,
  user: { id?: string; phone?: string | null; email?: string | null }
): Promise<{ id: string } | null> {
  // 1. Try matching supabaseId via User table → Worker
  if (user.id) {
    const { data: u } = await sb.from('User').select('id').eq('supabaseId', user.id).maybeSingle();
    if (u) {
      const { data: w } = await sb.from('Worker').select('id').eq('userId', (u as any).id).maybeSingle();
      if (w) return w as { id: string };
    }
  }
  // 2. Normalised phone match (strip spaces/dashes)
  if (user.phone) {
    const normalised = user.phone.replace(/[\s\-]/g, '');
    const { data } = await sb.from('Worker').select('id').eq('phone', normalised).maybeSingle();
    if (data) return data as { id: string };
    // Also try raw value in case stored as-is
    const { data: raw } = await sb.from('Worker').select('id').eq('phone', user.phone).maybeSingle();
    if (raw) return raw as { id: string };
  }
  // 3. Email fallback
  if (user.email) {
    const { data } = await sb.from('Worker').select('id').eq('email', user.email).maybeSingle();
    if (data) return data as { id: string };
  }
  return null;
}
