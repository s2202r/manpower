import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { request_id, lat, lng } = await req.json();
  const sb = createServiceClient();

  const { data: worker } = await sb.from('Worker').select('id').eq('phone', user.phone ?? '').single();
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const { data, error } = await sb.from('CheckIn').insert({
    workerId: worker.id,
    requestId: request_id,
    checkInTime: new Date().toISOString(),
    locationVerified: !!(lat && lng),
    hoursAccrued: 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
