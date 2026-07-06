import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const [invRes, lineRes] = await Promise.all([
    sb.from('Invoice').select('*, request:Request(title, date, shiftStart, shiftEnd)').eq('id', params.id).single(),
    sb.from('InvoiceLineItem').select('*').eq('invoiceId', params.id),
  ]);

  if (invRes.error || !invRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const inv = invRes.data as any;

  return NextResponse.json({
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    client_id: inv.companyId,
    period_start: inv.request?.date ?? inv.createdAt,
    period_end: inv.request?.date ?? inv.createdAt,
    line_items: (lineRes.data ?? []).map((li: any) => ({
      id: li.id,
      description: `${li.workerName} — ${li.skillTag.replace('_', ' ')}`,
      workers: 1,
      hours: li.hours,
      rate: li.hourlyRate,
      amount: li.amount,
    })),
    subtotal: inv.subtotal,
    gst_rate: inv.gstRate,
    gst_amount: inv.gstAmount,
    total: inv.total,
    booked_amount: (inv.bookedHours ?? 0) * (inv.hourlyRate ?? 120),
    billed_amount: (inv.billedHours ?? 0) * (inv.hourlyRate ?? 120),
    booked_headcount: inv.bookedHeadcount,
    billed_headcount: inv.billedHeadcount,
    status: inv.status.toLowerCase(),
    due_date: inv.dueAt,
    razorpay_payment_link: inv.razorpayPaymentLinkUrl,
    pdf_url: inv.pdfUrl,
    created_at: inv.createdAt,
  });
}
