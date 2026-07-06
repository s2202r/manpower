import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service client - bypasses RLS, use only in server route handlers
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// User-scoped client - respects RLS, use when you want per-user data isolation
export function createUserClient(accessToken: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  return client;
}

// Extract Bearer token from request
export function getAccessToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// Get authenticated Supabase user from request
export async function getAuthUser(req: NextRequest) {
  const token = getAccessToken(req);
  if (!token) return null;
  const client = createUserClient(token);
  const { data: { user } } = await client.auth.getUser();
  return user;
}
