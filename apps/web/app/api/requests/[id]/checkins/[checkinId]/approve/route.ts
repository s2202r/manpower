import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../../../../_companyFromUser';
import { recalcReliability } from '../../../../../_recalcReliability';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; checkinId: string } }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Verify request belongs to this company
  const { data: request } = await sb.from('Request').select('id').eq('id', params.id).eq('companyId', company.id).single();
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // Approval time = official check-in time
  const approvedAt = new Date().toISOString();

  const { data, error } = await sb
    .from('CheckIn')
    .update({ clientApprovedAt: approvedAt, clientApprovedBy: user.id, isVerified: true })
    .eq('id', params.checkinId)
    .eq('requestId', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate worker reliability score
  if (data?.workerId) await recalcReliability(sb, data.workerId);

  return NextResponse.json(data);
}
