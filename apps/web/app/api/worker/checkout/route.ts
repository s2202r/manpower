import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { checkin_id } = await req.json();
  const sb = createServiceClient();

  const { data: checkIn } = await sb.from('CheckIn').select('checkInTime').eq('id', checkin_id).single();
  if (!checkIn) return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });

  const checkOutTime = new Date();
  const checkInTime = new Date((checkIn as any).checkInTime);
  const hoursAccrued = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100;

  const { data, error } = await sb.from('CheckIn')
    .update({ checkOutTime: checkOutTime.toISOString(), hoursAccrued })
    .eq('id', checkin_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
