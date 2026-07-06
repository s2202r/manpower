import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const sb = createServiceClient();

  const { data: categories } = await sb
    .from('SkillCategory')
    .select('id, name, Skill(id, label)')
    .order('name');

  if (categories && categories.length > 0) {
    return NextResponse.json(categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      skills: (c.Skill ?? []).map((s: any) => ({ id: s.id, label: s.label })),
    })));
  }

  // Fallback if migration hasn't run yet
  return NextResponse.json([
    { id: 'cat-general',    name: 'General Labour', skills: [{ id: 'GENERAL_HELPER', label: 'GENERAL_HELPER' }] },
    { id: 'cat-warehouse',  name: 'Warehouse',      skills: [{ id: 'FORKLIFT_MHE', label: 'FORKLIFT_MHE' }, { id: 'SCANNER_TRAINED', label: 'SCANNER_TRAINED' }, { id: 'LOADING_UNLOADING', label: 'LOADING_UNLOADING' }, { id: 'PACKING', label: 'PACKING' }, { id: 'INVENTORY', label: 'INVENTORY' }] },
    { id: 'cat-cold-chain', name: 'Cold Chain',     skills: [{ id: 'COLD_STORAGE', label: 'COLD_STORAGE' }] },
  ]);
}
