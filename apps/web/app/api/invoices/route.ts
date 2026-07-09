import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { companyFromUser } from '../_companyFromUser';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const company = await companyFromUser(sb, user);
  if (!company) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = sb.from('Invoice')
    .select('*, request:Request(title, date)')
    .eq('companyId', company.id)
    .order('createdAt', { ascending: false });
  if (status) query = query.eq('status', status.toUpperCase());

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    client_id: inv.companyId,
    period_start: inv.request?.date ?? inv.createdAt,
    period_end: inv.request?.date ?? inv.createdAt,
    subtotal: inv.subtotal,
    gst_rate: inv.gstRate,
    gst_amount: inv.gstAmount,
    total: inv.total,
    booked_amount: (inv.bookedHours ?? 0) * (inv.hourlyRate ?? 120),
    billed_amount: (inv.billedHours ?? 0) * (inv.hourlyRate ?? 120),
    status: inv.status.toLowerCase(),
    due_date: inv.dueAt,
    razorpay_payment_link: inv.razorpayPaymentLinkUrl,
    created_at: inv.createdAt,
    line_items: [],
  })));
}
