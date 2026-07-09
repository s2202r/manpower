import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../../_companyFromUser';
import { recalcReliability } from '../../../_recalcReliability';

export async function POST(req: NextRequest, { params }: { params: { workerId: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const { requestId, rating, notes } = await req.json();
  if (!requestId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'requestId and rating (1-5) required' }, { status: 400 });
  }

  // Upsert rating
  const { error } = await sb.from('WorkerRating').upsert({
    workerId: params.workerId,
    requestId,
    companyId: company.id,
    rating,
    notes: notes ?? null,
  }, { onConflict: 'workerId,requestId' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recompute average rating on Worker
  const { data: ratings } = await sb.from('WorkerRating').select('rating').eq('workerId', params.workerId);
  if (ratings && ratings.length > 0) {
    const avg = ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length;
    await sb.from('Worker').update({ clientRatingAvg: avg, clientRatingCount: ratings.length }).eq('id', params.workerId);
  }

  await recalcReliability(sb, params.workerId);
  return NextResponse.json({ ok: true });
}
