import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../_companyFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json([]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: requests } = await sb.from('Request')
    .select('id, title, headcount, bookedHeadcount')
    .eq('companyId', company.id)
    .eq('status', 'OPEN')
    .lte('date', tomorrow.toISOString());

  const now = new Date().toISOString();
  return NextResponse.json(
    (requests ?? [])
      .filter((r: any) => r.headcount > 0 && (r.bookedHeadcount / r.headcount) < 0.95)
      .map((r: any) => ({
        id: `backfill-${r.id}`,
        type: 'backfill',
        severity: 'warning',
        message: `${r.title}: ${r.bookedHeadcount}/${r.headcount} confirmed — backfill needed`,
        request_id: r.id,
        created_at: now,
        resolved: false,
      }))
  );
}
