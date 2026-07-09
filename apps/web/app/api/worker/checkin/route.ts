import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { request_id, lat, lng } = await req.json();
  const sb = createServiceClient();

  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  // Fetch siteId from the request (required NOT NULL in CheckIn)
  const { data: requestRow } = await sb.from('Request').select('"siteId"').eq('id', request_id).single();
  if (!requestRow) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { data, error } = await sb.from('CheckIn').insert({
    workerId: worker.id,
    requestId: request_id,
    siteId: (requestRow as any).siteId,
    checkInAt: new Date().toISOString(),
    checkInLat: lat ?? 0,
    checkInLng: lng ?? 0,
    hoursWorked: 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
