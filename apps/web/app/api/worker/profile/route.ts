import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

const SELECT = 'id, name, phone, email, skills, "reliabilityScore", "totalShiftsCompleted", "totalNoShows", "kycStatus", "isActive", "verificationStatus"';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const ref = await workerFromUser(sb, user);
  if (!ref) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const { data: worker, error } = await sb.from('Worker').select(SELECT).eq('id', ref.id).single();
  if (error || !worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  return NextResponse.json(worker);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const ref = await workerFromUser(sb, user);
  if (!ref) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (Array.isArray(body.skills)) update.skills = body.skills;

  // Resubmit for approval whenever profile is saved
  update.verificationStatus = 'PENDING';

  const { data, error } = await sb.from('Worker').update(update).eq('id', ref.id).select(SELECT).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
