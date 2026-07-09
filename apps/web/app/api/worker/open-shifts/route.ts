import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const today = new Date().toISOString().split('T')[0];

  // Get requests worker already has an offer for
  const { data: existing } = await sb
    .from('ShiftOffer')
    .select('requestId')
    .eq('workerId', worker.id);
  const excludeIds = (existing ?? []).map((o: any) => o.requestId);

  // Open future requests
  let query = sb
    .from('Request')
    .select(`
      id, date, shiftStart, shiftEnd, headcount, bookedHeadcount, skillTags, notes,
      Site ( id, name, address, city )
    `)
    .eq('status', 'OPEN')
    .gte('date', today)
    .order('date', { ascending: true });

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    shiftStart: r.shiftStart,
    shiftEnd: r.shiftEnd,
    headcount: r.headcount,
    bookedHeadcount: r.bookedHeadcount ?? 0,
    spotsLeft: Math.max(0, r.headcount - (r.bookedHeadcount ?? 0)),
    skillTags: r.skillTags ?? [],
    notes: r.notes ?? null,
    site: r.Site ? { id: r.Site.id, name: r.Site.name, address: r.Site.address, city: r.Site.city } : null,
  })));
}
