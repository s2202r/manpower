import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb.from('Request')
    .select('*, site:Site(id, name, address, lat, lng, radiusMeters), checkIns:CheckIn(id, isVerified)')
    .eq('id', params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const confirmedCount = (data.checkIns ?? []).filter((c: any) => c.isVerified).length;

  return NextResponse.json({
    id: data.id,
    site_id: data.siteId,
    site: data.site ? {
      id: data.site.id, name: data.site.name, address: data.site.address,
      geofence: { lat: data.site.lat, lng: data.site.lng, radiusMeters: data.site.radiusMeters },
      active: true, created_at: data.createdAt,
    } : null,
    date: data.date,
    shift_start: data.shiftStart,
    shift_end: data.shiftEnd,
    headcount: data.headcount,
    skill_tags: data.skillTags,
    recurring: data.isRecurring,
    status: data.status.toLowerCase(),
    requested_count: data.targetHeadcount || data.headcount,
    confirmed_count: confirmedCount,
    checked_in_count: (data.checkIns ?? []).length,
    fill_rate: data.headcount > 0 ? Math.round((data.bookedHeadcount / data.headcount) * 100) : 0,
    title: data.title,
    notes: data.notes,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const body = await req.json();

  const update: Record<string, any> = {};
  if (body.status) update.status = body.status.toUpperCase();
  if (body.headcount) update.headcount = body.headcount;
  if (body.notes !== undefined) update.notes = body.notes;

  const { data, error } = await sb.from('Request').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
