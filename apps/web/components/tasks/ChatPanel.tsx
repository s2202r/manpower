'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function maskPii(text: string): string {
  return text
    .replace(/\b[6-9]\d{9}\b/g, '[phone]')
    .replace(/[\w.\-+]+@(okaxis|oksbi|okhdfcbank|okicici|ybl|ibl|axl|upi)\b/gi, '[upi]')
}

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
}

interface Props {
  taskId: string
  posterId: string
  taskerId: string
  currentUserId: string
  otherName: string
}

export default function ChatPanel({ taskId, posterId, taskerId, currentUserId, otherName }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Get or create conversation, then load messages
  useEffect(() => {
    let cancelled = false

    async function init() {
      let { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('task_id', taskId)
        .single()

      if (!conv) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ task_id: taskId, poster_id: posterId, tasker_id: taskerId })
          .select('id')
          .single()
        conv = newConv
      }

      if (!conv || cancelled) return
      const cid = conv.id
      setConversationId(cid)

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at')
        .eq('conversation_id', cid)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!cancelled) {
        setMessages((msgs ?? []) as Message[])
        setLoading(false)
      }
    }

    void init()
    return () => { cancelled = true }
  }, [taskId, posterId, taskerId])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          const row = payload.new as Message
          setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row])
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [conversationId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const body = draft.trim()
    if (!body || sending || !conversationId) return
    setSending(true)
    setDraft('')
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
    })
    setSending(false)
  }

  return (
    <div
      className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden"
      style={{ height: 480 }}
    >
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900">Chat with {otherName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <p className="text-center text-sm text-gray-400 mt-8">Loading messages…</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hi! 👋</p>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMine
                    ? 'rounded-br-sm bg-amber-500 text-white'
                    : 'rounded-bl-sm bg-gray-100 text-gray-900'
                }`}
              >
                {maskPii(msg.body)}
                <div
                  className={`text-[10px] mt-1 text-right ${
                    isMine ? 'text-amber-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Type a message…"
          maxLength={500}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
        />
        <button
          onClick={() => void send()}
          disabled={!draft.trim() || sending}
          className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
