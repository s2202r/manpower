import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data: worker, error } = await sb
    .from('Worker')
    .select('id, name, phone, skills, reliabilityScore, totalShifts, noShowCount, lateCount, isActive')
    .eq('phone', user.phone ?? '')
    .single();

  if (error || !worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  return NextResponse.json(worker);
}
