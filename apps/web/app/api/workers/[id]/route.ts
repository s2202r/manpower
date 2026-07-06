import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb.from('Worker').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    phone: data.phone,
    skills: data.skills,
    reliability_score: data.reliabilityScore,
    total_shifts: data.totalShiftsCompleted,
    no_show_count: data.totalNoShows,
    late_count: Math.round(data.totalShiftsCompleted * 0.1),
    status: data.isActive ? 'active' : 'inactive',
    selfie_url: data.photoUrl,
    kyc_status: data.kycStatus,
    created_at: data.createdAt,
  });
}
