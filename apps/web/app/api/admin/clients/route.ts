import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { data, error } = await sb
    .from('Company')
    .select('id, name, gstin, address, city, state, createdAt, verificationStatus')
    .order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Try to get emails from User table via userId
  const { data: users } = await sb.from('User').select('id, email, companyId');
  const emailMap: Record<string, string> = {};
  (users ?? []).forEach(u => { if (u.companyId) emailMap[u.companyId] = u.email; });

  return NextResponse.json(
    (data ?? []).map(c => ({
      id: c.id,
      name: c.name,
      email: emailMap[c.id] ?? '',
      gstin: c.gstin ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      createdAt: c.createdAt,
      verificationStatus: c.verificationStatus ?? 'VERIFIED',
    }))
  );
}
