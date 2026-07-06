import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get('skill');
  const minReliability = searchParams.get('min_reliability');

  let query = sb.from('Worker').select('*').eq('isActive', true).order('reliabilityScore', { ascending: false });

  if (skill) query = query.contains('skills', [skill.toUpperCase()]);
  if (minReliability) query = query.gte('reliabilityScore', parseFloat(minReliability));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(w => ({
    id: w.id,
    name: w.name,
    phone: w.phone,
    skills: w.skills,
    reliability_score: w.reliabilityScore,
    total_shifts: w.totalShiftsCompleted,
    no_show_count: w.totalNoShows,
    late_count: Math.round(w.totalShiftsCompleted * 0.1),
    status: w.isActive ? 'active' : 'inactive',
    selfie_url: w.photoUrl,
    kyc_status: w.kycStatus,
  })));
}
