import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data: company } = await sb.from('Company').select('id').eq('userId', user.id).single();
  if (!company) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') ?? '30');
  const from = new Date();
  from.setDate(from.getDate() - days);

  const { data: requests } = await sb.from('Request')
    .select('id, date, headcount, bookedHeadcount, checkIns:CheckIn(id, isVerified)')
    .eq('companyId', company.id)
    .gte('date', from.toISOString().split('T')[0])
    .order('date', { ascending: true });

  const byDate = new Map<string, { requested: number; confirmed: number; checked_in: number }>();
  (requests ?? []).forEach((r: any) => {
    const date = (r.date as string).split('T')[0];
    const prev = byDate.get(date) ?? { requested: 0, confirmed: 0, checked_in: 0 };
    prev.requested += r.headcount;
    prev.confirmed += r.bookedHeadcount ?? 0;
    prev.checked_in += (r.checkIns ?? []).filter((c: any) => c.isVerified).length;
    byDate.set(date, prev);
  });

  return NextResponse.json(
    Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      requested: v.requested,
      confirmed: v.confirmed,
      checked_in: v.checked_in,
      fill_rate: v.requested > 0 ? Math.round((v.confirmed / v.requested) * 100) : 0,
    }))
  );
}
