import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data: company } = await sb.from('Company').select('id').eq('userId', user.id).single();
  if (!company) return NextResponse.json([]);

  const { data: requests } = await sb.from('Request')
    .select('id, headcount, bookedHeadcount, status, title, date')
    .eq('companyId', company.id)
    .in('status', ['OPEN', 'IN_PROGRESS', 'CONFIRMED']);

  const alerts: any[] = [];
  const now = new Date().toISOString();

  (requests ?? []).forEach(r => {
    const rate = r.headcount > 0 ? r.bookedHeadcount / r.headcount : 0;
    if (rate < 0.70) {
      alerts.push({
        id: `breach-${r.id}`,
        type: 'breached',
        severity: 'critical',
        message: `${r.title}: fill rate ${Math.round(rate * 100)}% — critically below target`,
        request_id: r.id,
        created_at: now,
        resolved: false,
      });
    } else if (rate < 0.95) {
      alerts.push({
        id: `atrisk-${r.id}`,
        type: 'at_risk',
        severity: 'warning',
        message: `${r.title}: fill rate ${Math.round(rate * 100)}% — below 95% target`,
        request_id: r.id,
        created_at: now,
        resolved: false,
      });
    }
  });

  return NextResponse.json(alerts);
}
