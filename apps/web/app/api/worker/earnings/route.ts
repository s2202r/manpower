import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

const HOURLY_RATE = 150;

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: checkIns } = await sb
    .from('CheckIn')
    .select('id, "checkInAt", "checkOutAt", "hoursWorked", "requestId", Request(date, shiftStart, shiftEnd, Site(name))')
    .eq('workerId', (worker as any).id)
    .not('checkOutAt', 'is', null)
    .gte('checkInAt', startOfMonth.toISOString())
    .order('"checkInAt"', { ascending: false });

  const shifts = (checkIns ?? []).map((c: any) => ({
    id: c.id,
    date: c.Request?.date,
    site: c.Request?.Site?.name ?? 'Unknown site',
    hours: c.hoursWorked ?? 0,
    rate: HOURLY_RATE,
    amount: Math.round((c.hoursWorked ?? 0) * HOURLY_RATE),
  }));

  const total_month = shifts.reduce((sum, s) => sum + s.amount, 0);
  return NextResponse.json({ total_month, shifts });
}
