import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb.from('Site').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: data.id, name: data.name, address: data.address,
    city: data.address.split(',').pop()?.trim() ?? '',
    geofence: { lat: data.lat, lng: data.lng, radiusMeters: data.radiusMeters },
    active: true, created_at: data.createdAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const body = await req.json();

  const update: Record<string, any> = {};
  if (body.name) update.name = body.name;
  if (body.address) update.address = body.address;
  if (body.geofence?.lat !== undefined) update.lat = body.geofence.lat;
  if (body.geofence?.lng !== undefined) update.lng = body.geofence.lng;
  if (body.geofence?.radiusMeters !== undefined) update.radiusMeters = body.geofence.radiusMeters;

  const { data, error } = await sb.from('Site').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
