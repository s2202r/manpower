import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();

  const phone = user.phone;
  if (!phone) return NextResponse.json({ error: 'No phone on account' }, { status: 400 });

  const { data: worker, error: workerErr } = await sb
    .from('Worker')
    .select('id')
    .eq('phone', phone)
    .single();

  if (workerErr || !worker) {
    return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  }

  const { data, error } = await sb
    .from('ShiftOffer')
    .update({ status: 'DECLINED' })
    .eq('id', params.id)
    .eq('workerId', worker.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
