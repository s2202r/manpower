import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  // Mark KYC as submitted — admin will approve
  const { data, error } = await sb
    .from('Worker')
    .update({ kycStatus: 'SUBMITTED', kycSubmittedAt: new Date().toISOString() })
    .eq('id', worker.id)
    .select('"kycStatus", "kycSubmittedAt"')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
