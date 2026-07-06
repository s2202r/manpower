import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb.from('CheckIn')
    .select('*, request:Request(id, title, date, shiftStart, shiftEnd, site:Site(name))')
    .eq('workerId', params.id)
    .order('checkInAt', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((c: any) => ({
    id: c.id,
    worker_id: c.workerId,
    request_id: c.requestId,
    check_in_time: c.checkInAt,
    check_out_time: c.checkOutAt,
    hours_accrued: c.hoursWorked ?? 0,
    selfie_url: c.checkInSelfieUrl,
    location_verified: true,
    request: c.request,
  })));
}
