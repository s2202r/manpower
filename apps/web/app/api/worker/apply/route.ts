import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 });

  // Verify request is still open
  const { data: request } = await sb
    .from('Request')
    .select('id, status, headcount, bookedHeadcount')
    .eq('id', requestId)
    .eq('status', 'OPEN')
    .single();

  if (!request) return NextResponse.json({ error: 'Shift not available' }, { status: 404 });

  // Prevent duplicate application
  const { data: existing } = await sb
    .from('ShiftOffer')
    .select('id')
    .eq('workerId', worker.id)
    .eq('requestId', requestId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: 'Already applied to this shift' }, { status: 409 });

  const { data, error } = await sb
    .from('ShiftOffer')
    .insert({ workerId: worker.id, requestId, status: 'PENDING' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
