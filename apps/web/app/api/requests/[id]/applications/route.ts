import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../../_companyFromUser';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Verify the request belongs to this company
  const { data: request } = await sb
    .from('Request')
    .select('id, companyId')
    .eq('id', params.id)
    .eq('companyId', company.id)
    .single();
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { data, error } = await sb
    .from('ShiftOffer')
    .select(`
      id, status, "createdAt",
      Worker ( id, name, phone, "reliabilityScore", "totalShiftsCompleted", "totalNoShows", skills, "photoUrl", "kycStatus" )
    `)
    .eq('requestId', params.id)
    .order('"createdAt"', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((o: any) => ({
    id: o.id,
    status: o.status,
    appliedAt: o.createdAt,
    worker: o.Worker ? {
      id: o.Worker.id,
      name: o.Worker.name,
      phone: o.Worker.phone,
      photoUrl: o.Worker.photoUrl,
      reliabilityScore: o.Worker.reliabilityScore ?? 0,
      totalShiftsCompleted: o.Worker.totalShiftsCompleted ?? 0,
      totalNoShows: o.Worker.totalNoShows ?? 0,
      skills: o.Worker.skills ?? [],
      kycStatus: o.Worker.kycStatus,
    } : null,
  })));
}
