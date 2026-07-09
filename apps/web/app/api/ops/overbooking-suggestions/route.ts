import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../_companyFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json([]);

  const { data: requests } = await sb.from('Request')
    .select('id, title, headcount, bookedHeadcount')
    .eq('companyId', company.id)
    .in('status', ['OPEN', 'CONFIRMED'])
    .order('createdAt', { ascending: false })
    .limit(10);

  const ACCEPT_RATE = 0.75;
  const SHOW_UP_RATE = 0.85;

  return NextResponse.json((requests ?? []).map((r: any) => ({
    request_id: r.id,
    request: { id: r.id, title: r.title, headcount: r.headcount },
    suggested_extra: Math.max(0, Math.ceil(r.headcount / (ACCEPT_RATE * SHOW_UP_RATE)) - r.headcount),
    reason: `Accept rate ${Math.round(ACCEPT_RATE * 100)}%, show-up rate ${Math.round(SHOW_UP_RATE * 100)}% (historical avg)`,
    estimated_no_show_rate: 1 - SHOW_UP_RATE,
  })));
}
