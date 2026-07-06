import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

const DEFAULTS: Record<string, string> = {
  commission_rate: '12',
  razorpay_mode: 'test',
  razorpay_key_id: '',
};

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  try {
    const { data, error } = await sb.from('PlatformConfig').select('key, value');
    if (error) throw error;
    const cfg: Record<string, string> = { ...DEFAULTS };
    (data ?? []).forEach(row => { cfg[row.key] = row.value; });
    // Never return secrets to client
    delete cfg.razorpay_key_secret;
    delete cfg.razorpay_webhook_secret;
    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}

export async function PATCH(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const body = await req.json();
  const allowedKeys = ['commission_rate', 'razorpay_key_id', 'razorpay_key_secret', 'razorpay_webhook_secret', 'razorpay_mode'];

  try {
    const upserts = Object.entries(body)
      .filter(([k]) => allowedKeys.includes(k))
      .map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));

    if (upserts.length > 0) {
      const { error } = await sb.from('PlatformConfig').upsert(upserts, { onConflict: 'key' });
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
