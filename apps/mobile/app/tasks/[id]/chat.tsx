import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { maskPII } from '@/lib/mask-pii'

interface Message {
  id: string; sender_id: string; body: string; created_at: string; senderName: string
}

export default function ChatScreen() {
  const { id: taskId } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!taskId || !user) return
    void initConversation()
  }, [taskId, user])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const row = payload.new as { id: string; sender_id: string; body: string; created_at: string }
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', row.sender_id).single()
          const msg: Message = { id: row.id, sender_id: row.sender_id, body: row.body, created_at: row.created_at, senderName: profile?.name ?? 'User' }
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
        })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [conversationId])

  async function initConversation() {
    // Get or create conversation for this task
    let { data: conv } = await supabase.from('conversations').select('id').eq('task_id', taskId).single()
    if (!conv) {
      const { data: task } = await supabase.from('tasks').select('poster_id, assigned_tasker_id').eq('id', taskId).single()
      if (!task) return
      const { data: newConv } = await supabase.from('conversations').insert({ task_id: taskId, poster_id: task.poster_id, tasker_id: task.assigned_tasker_id }).select('id').single()
      conv = newConv
    }
    if (!conv) return
    setConversationId(conv.id)

    // Load last 100 messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, body, created_at, profiles(name)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages((msgs ?? []).map(m => ({
      id: m.id, sender_id: m.sender_id, body: m.body, created_at: m.created_at,
      senderName: (m.profiles as unknown as { name: string } | null)?.name ?? 'User',
    })))
    setLoading(false)
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100)
  }

  async function send() {
    const body = input.trim()
    if (!body || !conversationId) return
    setSending(true)
    setInput('')
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user?.id, body })
    setSending(false)
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#d97706" size="large" /></View>

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={88}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id
          return (
            <View style={[s.msgRow, isMe && s.msgRowMe]}>
              <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                {!isMe && <Text style={s.senderName}>{item.senderName}</Text>}
                <Text style={[s.msgText, isMe && s.msgTextMe]}>{maskPII(item.body)}</Text>
                <Text style={[s.msgTime, isMe && s.msgTimeMe]}>
                  {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )
        }}
      />
      <View style={s.inputRow}>
        <TextInput
          style={s.input} value={input} onChangeText={setInput}
          placeholder="Type a message…" returnKeyType="send"
          onSubmitEditing={send} editable={!sending}
        />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending || !input.trim()}>
          <Text style={s.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10, paddingHorizontal: 14 },
  bubbleThem: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  bubbleMe: { backgroundColor: '#d97706' },
  senderName: { fontSize: 11, fontWeight: '700', color: '#d97706', marginBottom: 3 },
  msgText: { fontSize: 15, color: '#111', lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#9ca3af', marginTop: 3, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 80 },
  sendBtn: { backgroundColor: '#d97706', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
