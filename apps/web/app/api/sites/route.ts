import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../_companyFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json([]);

  const { data, error } = await sb.from('Site').select('*').eq('companyId', company.id).order('createdAt', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((s: any) => ({
    id: s.id, name: s.name, address: s.address,
    city: s.city ?? s.address.split(',').pop()?.trim() ?? '',
    mapsUrl: s.mapsUrl ?? null,
    geofence: { lat: s.lat, lng: s.lng, radiusMeters: s.radiusMeters },
    active: true, created_at: s.createdAt,
  })));
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const body = await req.json();
  const { data, error } = await sb.from('Site').insert({
    companyId: company.id,
    name: body.name,
    address: body.address,
    city: body.city ?? '',
    mapsUrl: body.mapsUrl ?? null,
    lat: body.geofence?.lat ?? body.lat ?? null,
    lng: body.geofence?.lng ?? body.lng ?? null,
    radiusMeters: body.geofence?.radiusMeters ?? body.radiusMeters ?? 200,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
