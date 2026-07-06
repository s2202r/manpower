import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_guard';

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const { data: skills, error } = await sb
    .from('Skill')
    .select('id, label, "categoryId"')
    .order('label');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: workers } = await sb.from('Worker').select('skills');
  const { data: requests } = await sb.from('Request').select('skillTags');

  const workerCounts: Record<string, number> = {};
  const requestCounts: Record<string, number> = {};
  (workers ?? []).forEach(w => (w.skills ?? []).forEach((s: string) => { workerCounts[s] = (workerCounts[s] ?? 0) + 1; }));
  (requests ?? []).forEach(r => (r.skillTags ?? []).forEach((s: string) => { requestCounts[s] = (requestCounts[s] ?? 0) + 1; }));

  return NextResponse.json((skills ?? []).map(s => ({
    id: s.id,
    label: s.label,
    categoryId: s.categoryId ?? null,
    worker_count: workerCounts[s.label] ?? 0,
    request_count: requestCounts[s.label] ?? 0,
  })));
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const body = await req.json();
  if (!body.label?.trim()) return NextResponse.json({ error: 'label is required' }, { status: 400 });

  const insert: Record<string, string> = { label: body.label.trim().toUpperCase().replace(/\s+/g, '_') };
  if (body.categoryId) insert.categoryId = body.categoryId;

  const { data, error } = await sb.from('Skill').insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin(req);
  if ('error' in result) return result.error;
  const { sb } = result;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await sb.from('Skill').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
