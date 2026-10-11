import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PushPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const payload: PushPayload = await req.json()
    if (!payload.userId || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch all device tokens for this user
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', payload.userId)

    if (error) throw error
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // Send via Expo Push API (handles both iOS and Android)
    const expoPushMessages = tokens.map(t => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
    }))

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(expoPushMessages),
    })

    const expoData = await expoRes.json()

    // Log send result (no PII in body)
    console.log('push sent', { userId: payload.userId, count: tokens.length, status: expoRes.status })

    return new Response(JSON.stringify({ sent: tokens.length, result: expoData }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-push-notification error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
