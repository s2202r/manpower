import type { SupabaseClient } from '@supabase/supabase-js';

export async function companyFromUser(sb: SupabaseClient, user: { id: string }): Promise<{ id: string } | null> {
  const { data: u } = await sb.from('User').select('id').eq('supabaseId', user.id).maybeSingle();
  if (!u) return null;
  const { data: c } = await sb.from('Company').select('id').eq('userId', u.id).maybeSingle();
  return c ?? null;
}
