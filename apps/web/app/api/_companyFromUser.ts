import type { SupabaseClient } from '@supabase/supabase-js';

export async function companyFromUser(
  sb: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<{ id: string } | null> {
  // Try by Supabase auth UUID first
  let u: { id: string } | null = null;
  const byUuid = await sb.from('User').select('id').eq('supabaseId', user.id).maybeSingle();
  if (!byUuid.error && byUuid.data) {
    u = byUuid.data;
  } else if (user.email) {
    // Fallback: match by email (covers demo accounts where supabaseId isn't set to the real UUID)
    const byEmail = await sb.from('User').select('id').eq('email', user.email).maybeSingle();
    if (!byEmail.error && byEmail.data) u = byEmail.data;
  }
  if (!u) return null;
  const { data: c } = await sb.from('Company').select('id').eq('userId', u.id).maybeSingle();
  return c ?? null;
}
