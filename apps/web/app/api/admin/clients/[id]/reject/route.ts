import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_guard';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { error } = await sb.from('Company').update({ verificationStatus: 'REJECTED' }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
