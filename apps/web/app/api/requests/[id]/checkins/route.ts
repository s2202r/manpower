import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../../_companyFromUser';

// GET — list check-ins for a request (client dashboard)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const { data: request } = await sb.from('Request').select('id').eq('id', params.id).eq('companyId', company.id).single();
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { data, error } = await sb
    .from('CheckIn')
    .select('id, "workerId", "checkInAt", "checkOutAt", "clientApprovedAt", "isVerified", "hoursWorked", Worker(id, name, photoUrl)')
    .eq('requestId', params.id)
    .order('"checkInAt"', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((c: any) => ({
    id: c.id,
    workerId: c.workerId,
    workerName: c.Worker?.name ?? null,
    workerPhoto: c.Worker?.photoUrl ?? null,
    checkInAt: c.checkInAt,
    checkOutAt: c.checkOutAt,
    isVerified: c.isVerified,
    clientApprovedAt: c.clientApprovedAt,
    hoursWorked: c.hoursWorked,
  })));
}
