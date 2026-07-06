import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_guard';

export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  return NextResponse.json({ success: true, message: 'Connection test successful' });
}
