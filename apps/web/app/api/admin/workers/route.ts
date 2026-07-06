import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { data, error } = await sb
    .from('Worker')
    .select('id, name, phone, skills, reliabilityScore, totalShiftsCompleted, isActive, verificationStatus, kycStatus')
    .order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map(w => ({
      id: w.id,
      name: w.name,
      phone: w.phone,
      skills: w.skills ?? [],
      reliabilityScore: w.reliabilityScore ?? 0,
      totalShifts: w.totalShiftsCompleted ?? 0,
      isActive: w.isActive,
      verificationStatus: w.verificationStatus ?? 'PENDING',
      kycStatus: w.kycStatus ?? 'PENDING',
    }))
  );
}
