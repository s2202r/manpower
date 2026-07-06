import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!user.email || !adminEmails.includes(user.email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, sb: createServiceClient() };
}
