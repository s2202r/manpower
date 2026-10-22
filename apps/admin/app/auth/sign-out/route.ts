import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all: Array<{ name: string; value: string; options?: Partial<ResponseCookie> }>) =>
          all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  )
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001'))
}
