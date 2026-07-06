import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const FALLBACK = ['GENERAL_HELPER', 'FORKLIFT_MHE', 'SCANNER_TRAINED', 'COLD_STORAGE'];

export async function GET() {
  const sb = createServiceClient();
  const { data } = await sb.from('Skill').select('id, label').order('label');
  const labels = data?.map(r => r.label) ?? FALLBACK;
  return NextResponse.json(labels.map(label => ({ id: label, label })));
}
