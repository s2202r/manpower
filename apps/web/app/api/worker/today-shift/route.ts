import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch all accepted offers (past + future window)
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
        Site ( name, address )
      )
    `)
    .eq('workerId', worker.id)
    .eq('status', 'ACCEPTED')
    .limit(200);

  if (offerErr) return NextResponse.json({ error: offerErr.message }, { status: 500 });

  const offers = offerData ?? [];

  // Priority 1: today's shift (most likely to have an active check-in)
  // Priority 2: most recent past shift that has a CheckIn (worker forgot to check out)
  // Priority 3: next upcoming shift (so worker can see their schedule)
  const today_offer = offers.find((o: any) => o.Request?.date === today);

  // If today's shift found, use it. Otherwise find most recent accepted offer.
  const sorted = [...offers].sort((a: any, b: any) =>
    (a.Request?.date ?? '').localeCompare(b.Request?.date ?? '')
  );
  // upcoming (today + future), then past
  const upcoming = sorted.filter((o: any) => (o.Request?.date ?? '') >= today);
  const past = sorted.filter((o: any) => (o.Request?.date ?? '') < today).reverse();

  const chosenOffer = today_offer ?? upcoming[0] ?? past[0] ?? null;

  if (!chosenOffer) {
    return NextResponse.json({ shift: null, checkedIn: false, checkIn: null, isToday: false });
  }

  const requestId = (chosenOffer as any).requestId;
  const request = (chosenOffer as any).Request;
  const site = request?.Site;
  const shiftDate: string = request?.date ?? '';
  const isToday = shiftDate === today;

  // Check for an existing CheckIn record
  const { data: checkIn } = await sb
    .from('CheckIn')
    .select('*')
    .eq('workerId', worker.id)
    .eq('requestId', requestId)
    .order('checkInAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    shift: {
      id: chosenOffer.id,
      requestId,
      request: request ? {
        id: request.id,
        date: request.date,
        shiftStart: request.shiftStart,
        shiftEnd: request.shiftEnd,
        site: site ? { name: site.name, address: site.address } : { name: 'Unknown', address: '' },
      } : null,
    },
    isToday,
    checkedIn: !!checkIn && !checkIn.checkOutAt,
    checkIn: checkIn ?? null,
  });
}
