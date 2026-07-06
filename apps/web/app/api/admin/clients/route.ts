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

  // Get emails via Company.userId → User.email
  const { data: companies } = await sb.from('Company').select('id, userId');
  const userIds = (companies ?? []).map(c => c.userId).filter(Boolean);
  const { data: users } = userIds.length
    ? await sb.from('User').select('id, email').in('id', userIds)
    : { data: [] };
  const userEmailMap: Record<string, string> = {};
  (users ?? []).forEach(u => { userEmailMap[u.id] = u.email; });
  const companyUserMap: Record<string, string> = {};
  (companies ?? []).forEach(c => { if (c.userId) companyUserMap[c.id] = c.userId; });
  const emailMap: Record<string, string> = {};
  Object.entries(companyUserMap).forEach(([cId, uId]) => {
    if (userEmailMap[uId]) emailMap[cId] = userEmailMap[uId];
  });

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
