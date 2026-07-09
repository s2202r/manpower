import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../_companyFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const siteId = searchParams.get('site_id');

  let query = sb.from('Request')
    .select('*, site:Site(id, name, address, lat, lng, radiusMeters), checkIns:CheckIn(id, isVerified)')
    .eq('companyId', company.id)
    .order('date', { ascending: false });

  if (status) query = query.eq('status', status.toUpperCase());
  if (siteId) query = query.eq('siteId', siteId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (data ?? []).map(r => {
    const confirmedCount = (r.checkIns ?? []).filter((c: any) => c.isVerified).length;
    const checkedInCount = (r.checkIns ?? []).length;
    return {
      id: r.id,
      site_id: r.siteId,
      site: r.site ? {
        id: r.site.id, name: r.site.name, address: r.site.address,
        geofence: { lat: r.site.lat, lng: r.site.lng, radiusMeters: r.site.radiusMeters },
        active: true, created_at: r.createdAt,
      } : null,
      date: r.date,
      shift_start: r.shiftStart,
      shift_end: r.shiftEnd,
      headcount: r.headcount,
      skill_tags: r.skillTags,
      recurring: r.isRecurring,
      status: r.status.toLowerCase(),
      requested_count: r.targetHeadcount || r.headcount,
      confirmed_count: confirmedCount,
      checked_in_count: checkedInCount,
      fill_rate: r.headcount > 0 ? Math.round((r.bookedHeadcount / r.headcount) * 100) : 0,
      title: r.title,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const body = await req.json();

  const { data, error } = await sb.from('Request').insert({
    companyId: company.id,
    siteId: body.site_id,
    title: body.title || `Shift ${new Date(body.date).toLocaleDateString('en-IN')}`,
    date: body.date,
    shiftStart: body.shift_start,
    shiftEnd: body.shift_end,
    headcount: body.headcount,
    skillTags: (body.skill_tags || []).map((s: string) => s.toUpperCase()),
    status: 'OPEN',
    isRecurring: body.recurring ?? false,
    recurringDays: body.recurrence_rule ? [1, 2, 3, 4, 5] : [],
    targetHeadcount: body.headcount,
    offerBuffer: Math.ceil(body.headcount * 0.2),
    fillRateThreshold: 0.95,
    guaranteedHeadcount: Math.floor(body.headcount * 0.8),
    bookedHeadcount: 0,
    notes: body.notes,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
