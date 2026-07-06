import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const ref = await workerFromUser(sb, user);
  if (!ref) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const { data: worker, error } = await sb
    .from('Worker')
    .select('id, name, phone, email, skills, reliabilityScore, totalShifts, noShowCount, lateCount, isActive')
    .eq('id', ref.id)
    .single();

  if (error || !worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  return NextResponse.json(worker);
}
