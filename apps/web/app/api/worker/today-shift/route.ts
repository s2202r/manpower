import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const phone = user.phone;
  if (!phone) return NextResponse.json({ error: 'No phone on account' }, { status: 400 });

  const sb = createServiceClient();

  const { data: worker, error: workerErr } = await sb
    .from('Worker')
    .select('id')
    .eq('phone', phone)
    .single();

  if (workerErr || !worker) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Find accepted shift offer for today
  const { data: offerData, error: offerErr } = await sb
    .from('ShiftOffer')
    .select(`
      id,
      requestId,
      Request (
        id,
        date,
        shiftStart,
        shiftEnd,
        Site (
          name,
          location
        )
      )
    `)
    .eq('workerId', worker.id)
    .eq('status', 'ACCEPTED')
    .limit(100);

  if (offerErr) return NextResponse.json({ error: offerErr.message }, { status: 500 });

  // Filter by today's date (Request.date may be stored as string)
  const todayOffer = (offerData ?? []).find((o: Record<string, unknown>) => {
    const request = o.Request as Record<string, unknown> | null;
    return request?.date === today;
  });

  if (!todayOffer) {
    return NextResponse.json({ shift: null, checkedIn: false, checkIn: null });
  }

  // Check for an existing CheckIn record
  const { data: checkIn } = await sb
    .from('CheckIn')
    .select('*')
    .eq('workerId', worker.id)
    .eq('requestId', (todayOffer as Record<string, unknown>).requestId)
    .order('checkInTime', { ascending: false })
    .limit(1)
    .single();

  const request = (todayOffer as Record<string, unknown>).Request as Record<string, unknown> | null;
  const site = request?.Site as Record<string, unknown> | null;

  return NextResponse.json({
    shift: {
      id: todayOffer.id,
      requestId: (todayOffer as Record<string, unknown>).requestId,
      request: request
        ? {
            id: request.id,
            date: request.date,
            shiftStart: request.shiftStart,
            shiftEnd: request.shiftEnd,
            site: site ? { name: site.name, location: site.location } : { name: 'Unknown', location: '' },
          }
        : null,
    },
    checkedIn: !!checkIn && !checkIn.checkOutTime,
    checkIn: checkIn ?? null,
  });
}
