import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();

  // Get company for this user
  const { data: company } = await sb.from('Company').select('id').eq('userId', user.id).single();
  if (!company) {
    // Return empty summary if no company yet
    return NextResponse.json({
      active_requests: 0, fill_rate_avg: 0, on_track_count: 0,
      at_risk_count: 0, breached_count: 0, workers_checked_in_today: 0,
      pending_invoices: 0, pending_invoice_amount: 0,
    });
  }

  const today = new Date().toISOString().split('T')[0];

  const [requestsRes, checkinsRes, invoicesRes] = await Promise.all([
    sb.from('Request').select('id, headcount, bookedHeadcount, status').eq('companyId', company.id).in('status', ['OPEN', 'IN_PROGRESS', 'CONFIRMED']),
    sb.from('CheckIn').select('id').eq('isVerified', false).gte('checkInAt', `${today}T00:00:00`).is('checkOutAt', null),
    sb.from('Invoice').select('id, total').eq('companyId', company.id).in('status', ['ISSUED', 'OVERDUE']),
  ]);

  const requests = requestsRes.data ?? [];
  const fillRates = requests.map(r => r.headcount > 0 ? (r.bookedHeadcount / r.headcount) : 0);
  const avgFill = fillRates.length > 0 ? fillRates.reduce((a, b) => a + b, 0) / fillRates.length : 0;

  return NextResponse.json({
    active_requests: requests.length,
    fill_rate_avg: Math.round(avgFill * 100),
    on_track_count: fillRates.filter(r => r >= 0.95).length,
    at_risk_count: fillRates.filter(r => r >= 0.70 && r < 0.95).length,
    breached_count: fillRates.filter(r => r < 0.70).length,
    workers_checked_in_today: checkinsRes.data?.length ?? 0,
    pending_invoices: invoicesRes.data?.length ?? 0,
    pending_invoice_amount: (invoicesRes.data ?? []).reduce((sum, inv) => sum + inv.total, 0),
  });
}
