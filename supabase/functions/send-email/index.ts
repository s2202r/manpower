import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload: EmailPayload = await req.json()
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return new Response('RESEND_API_KEY not set', { status: 500 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: payload.from ?? 'Taim <noreply@taim.in>',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  })

  const body = await res.json()
  return new Response(JSON.stringify(body), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
})
