import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { data, error } = await sb
    .from('SkillCategory')
    .select('id, name, Skill(id, label)')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const { data, error } = await sb
    .from('SkillCategory')
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await sb.from('SkillCategory').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
