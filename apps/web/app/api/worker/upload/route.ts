import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const type = form.get('type') as string | null; // 'photo' | 'kyc_doc' | 'bank_doc'

  if (!file || !type) return NextResponse.json({ error: 'file and type required' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${worker.id}/${type}_${Date.now()}.${ext}`;

  const { error: uploadError } = await sb.storage
    .from('worker-docs')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = sb.storage.from('worker-docs').getPublicUrl(path);

  // Update worker record
  if (type === 'photo') {
    await sb.from('Worker').update({ photoUrl: publicUrl }).eq('id', worker.id);
  } else {
    const { data: w } = await sb.from('Worker').select('"kycDocUrls"').eq('id', worker.id).single();
    const existing: string[] = (w as any)?.kycDocUrls ?? [];
    await sb.from('Worker').update({ kycDocUrls: [...existing, publicUrl] }).eq('id', worker.id);
  }

  return NextResponse.json({ url: publicUrl });
}
