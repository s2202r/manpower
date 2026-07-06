import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const [reqRes, wrkRes] = await Promise.all([
    sb.from('Request').select('skillTags').in('status', ['OPEN', 'IN_PROGRESS', 'CONFIRMED']),
    sb.from('Worker').select('skills').eq('isActive', true),
  ]);

  const demand = new Map<string, number>();
  (reqRes.data ?? []).forEach((r: any) => (r.skillTags ?? []).forEach((s: string) => demand.set(s, (demand.get(s) ?? 0) + 1)));

  const supply = new Map<string, number>();
  (wrkRes.data ?? []).forEach((w: any) => (w.skills ?? []).forEach((s: string) => supply.set(s, (supply.get(s) ?? 0) + 1)));

  const all = Array.from(new Set([...Array.from(demand.keys()), ...Array.from(supply.keys())]));
  return NextResponse.json(all.map(s => ({
    skill: s.replace(/_/g, ' '),
    demand: demand.get(s) ?? 0,
    supply: supply.get(s) ?? 0,
  })));
}
