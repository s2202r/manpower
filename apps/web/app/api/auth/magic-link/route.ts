import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// 5 magic link requests per email per 10 minutes
const LIMIT = 5
const WINDOW = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { email } = await req.json() as { email: string }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const key = `magic:${ip}:${email.toLowerCase()}`
  const { allowed, remaining, resetAt } = rateLimit(key, LIMIT, WINDOW)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(
    { ok: true },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } },
  )
}
