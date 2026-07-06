import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getAuthUser } from '@/lib/supabase-server';
import { workerFromUser } from '../_workerFromUser';

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createServiceClient();
  const worker = await workerFromUser(sb, user);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const { accountNumber, ifsc, accountName } = await req.json();
  if (!accountNumber?.trim() || !ifsc?.trim() || !accountName?.trim()) {
    return NextResponse.json({ error: 'accountNumber, ifsc, and accountName are required' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('Worker')
    .update({
      bankAccountNumber: accountNumber.trim(),
      bankIfsc: ifsc.trim().toUpperCase(),
      bankAccountName: accountName.trim(),
      bankVerified: false, // resets verification on any edit
    })
    .eq('id', worker.id)
    .select('"bankAccountNumber", "bankIfsc", "bankAccountName", "bankVerified"')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
