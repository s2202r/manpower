import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    { count: totalCompanies },
    { count: pendingCompanies },
    { count: totalWorkers },
    { count: pendingWorkers },
    { count: activeRequests },
    { data: invoices },
    { data: recentWorkers },
    { data: recentCompanies },
    { data: config },
  ] = await Promise.all([
    sb.from('Company').select('*', { count: 'exact', head: true }),
    sb.from('Company').select('*', { count: 'exact', head: true }).eq('verificationStatus', 'PENDING'),
    sb.from('Worker').select('*', { count: 'exact', head: true }),
    sb.from('Worker').select('*', { count: 'exact', head: true }).eq('verificationStatus', 'PENDING'),
    sb.from('Request').select('*', { count: 'exact', head: true }).gte('createdAt', startOfDay),
    sb.from('Invoice').select('totalAmount').gte('createdAt', startOfMonth),
    sb.from('Worker').select('id, name, createdAt').order('createdAt', { ascending: false }).limit(3),
    sb.from('Company').select('id, name, createdAt').order('createdAt', { ascending: false }).limit(2),
    sb.from('PlatformConfig').select('key, value').in('key', ['commission_rate']),
  ]);

  const invoicedTotal = (invoices ?? []).reduce((sum, inv) => sum + (inv.totalAmount ?? 0), 0);
  const commissionRate = parseFloat((config ?? []).find(c => c.key === 'commission_rate')?.value ?? '12');
  const commissionTotal = Math.round(invoicedTotal * commissionRate / 100);

  const recentActivity = [
    ...(recentWorkers ?? []).map(w => ({
      type: 'worker',
      name: w.name,
      time: new Date(w.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    })),
    ...(recentCompanies ?? []).map(c => ({
      type: 'client',
      name: c.name,
      time: new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    })),
  ].sort(() => -1).slice(0, 5);

  return NextResponse.json({
    total_companies: totalCompanies ?? 0,
    pending_companies: pendingCompanies ?? 0,
    total_workers: totalWorkers ?? 0,
    pending_workers: pendingWorkers ?? 0,
    active_requests_today: activeRequests ?? 0,
    invoiced_this_month: invoicedTotal,
    commission_this_month: commissionTotal,
    recent_activity: recentActivity,
  });
}
