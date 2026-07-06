import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const { data, error } = await sb.from('CheckIn')
    .select('*, worker:Worker(id, name, phone, skills, reliabilityScore, profilePhotoUrl)')
    .eq('requestId', params.id)
    .order('checkInAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (data ?? []).map(c => ({
    id: c.id,
    worker_id: c.workerId,
    worker: c.worker ? {
      id: c.worker.id,
      name: c.worker.name,
      phone: c.worker.phone,
      skills: c.worker.skills,
      reliability_score: c.worker.reliabilityScore,
      selfie_url: c.worker.profilePhotoUrl,
      total_shifts: 0,
      no_show_count: 0,
      late_count: 0,
      status: 'active',
    } : null,
    request_id: c.requestId,
    check_in_time: c.checkInAt,
    check_out_time: c.checkOutAt,
    hours_accrued: c.hoursWorked ?? (c.checkOutAt ? 0 : calculateHours(c.checkInAt)),
    selfie_url: c.checkInSelfieUrl,
    location_verified: true,
  }));

  return NextResponse.json(mapped);
}

function calculateHours(checkInAt: string): number {
  const diff = (Date.now() - new Date(checkInAt).getTime()) / 3600000;
  return Math.round(diff * 10) / 10;
}
