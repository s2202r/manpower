import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ step: 'auth', error: 'No auth user — token missing or invalid' });

  const sb = createServiceClient();

  // Check what columns Worker table has
  const { data: colCheck, error: colErr } = await sb
    .from('Worker')
    .select('id, phone, email')
    .limit(1);

  // Try phone lookup
  let byPhone = null, phoneErr = null;
  if (user.phone) {
    const r = await sb.from('Worker').select('id, phone, email').eq('phone', user.phone).maybeSingle();
    byPhone = r.data;
    phoneErr = r.error?.message ?? null;
  }

  // Try email lookup
  let byEmail = null, emailErr = null;
  if (user.email) {
    const r = await sb.from('Worker').select('id, phone, email').eq('email', user.email).maybeSingle();
    byEmail = r.data;
    emailErr = r.error?.message ?? null;
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, phone: user.phone },
    colCheck: { sample: colCheck?.[0] ?? null, error: colErr?.message ?? null },
    byPhone: { result: byPhone, error: phoneErr },
    byEmail: { result: byEmail, error: emailErr },
  });
}
