import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { recalcReliability } from '../../../_recalcReliability';

// Called by ops/system when a worker doesn't show up for an accepted shift
export async function POST(req: NextRequest, { params }: { params: { workerId: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();

  // Increment no-show count
  const { data: w } = await sb.from('Worker').select('"totalNoShows"').eq('id', params.workerId).single();
  if (!w) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  await sb.from('Worker')
    .update({ totalNoShows: ((w as any).totalNoShows ?? 0) + 1 })
    .eq('id', params.workerId);

  await recalcReliability(sb, params.workerId);
  return NextResponse.json({ ok: true });
}
