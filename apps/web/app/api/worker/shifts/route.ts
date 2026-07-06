import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  // Fetch shift offers with request and site details
  const { data, error } = await sb
    .from('ShiftOffer')
    .select(`
      id,
      status,
      requestId,
      Request (
        id,
        date,
        shiftStart,
        shiftEnd,
        headcount,
        skillTags,
        Site (
          id,
          name,
          location
        )
      )
    `)
    .eq('workerId', worker.id)
    .order('id', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const offers = (data ?? []).map((offer: Record<string, unknown>) => {
    const request = offer.Request as Record<string, unknown> | null;
    const site = request?.Site as Record<string, unknown> | null;
    return {
      id: offer.id,
      status: offer.status,
      request: request
        ? {
            id: request.id,
            date: request.date,
            shiftStart: request.shiftStart,
            shiftEnd: request.shiftEnd,
            headcount: request.headcount,
            skillTags: request.skillTags ?? [],
            site: site
              ? { name: site.name, location: site.location }
              : { name: 'Unknown', location: '' },
          }
        : null,
    };
  });

  return NextResponse.json(offers);
}
