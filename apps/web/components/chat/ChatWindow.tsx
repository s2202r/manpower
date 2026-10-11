'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { maskPII } from '@/lib/mask-pii'

interface Message {
  id: string
  senderId: string
  body: string
  createdAt: string
  senderName: string
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string; sender_id: string; body: string; created_at: string }
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', row.sender_id)
            .single()
          const msg: Message = {
            id: row.id,
            senderId: row.sender_id,
            body: row.body,
            createdAt: row.created_at,
            senderName: profile?.name ?? 'User',
          }
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const body = input.trim()
    if (!body) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
    })
    setSending(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2 ${
                isMe ? 'bg-brand-600 text-white' : 'bg-white text-gray-900 shadow-sm'
              }`}>
                {!isMe && (
                  <p className="text-xs font-semibold mb-1 text-brand-600">{msg.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{maskPII(msg.body)}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-100 bg-white p-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </>
  )
}
