import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../../../../_companyFromUser';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; offerId: string } }
) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Verify the request belongs to this company
  const { data: request } = await sb
    .from('Request')
    .select('id, companyId, bookedHeadcount, headcount')
    .eq('id', params.id)
    .eq('companyId', company.id)
    .single();
  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  const { action } = await req.json(); // 'approve' | 'reject'
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'ACCEPTED' : 'DECLINED';

  const { data, error } = await sb
    .from('ShiftOffer')
    .update({ status: newStatus })
    .eq('id', params.offerId)
    .eq('requestId', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep bookedHeadcount in sync when approving
  if (action === 'approve') {
    const newCount = Math.min(request.headcount, (request.bookedHeadcount ?? 0) + 1);
    await sb.from('Request').update({ bookedHeadcount: newCount }).eq('id', params.id);
  }

  return NextResponse.json(data);
}
