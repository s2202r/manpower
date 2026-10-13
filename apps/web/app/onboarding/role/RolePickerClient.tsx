'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ROLES = [
  {
    id: 'poster',
    emoji: '📋',
    title: 'Post tasks',
    body: "I need things done — cleaning, repairs, deliveries, and more.",
  },
  {
    id: 'tasker',
    emoji: '🔧',
    title: 'Complete tasks',
    body: "I want to earn money by completing tasks in my area.",
  },
  {
    id: 'both',
    emoji: '⚡',
    title: 'Both',
    body: "I want to post tasks and earn as a Tasker.",
  },
]

export default function RolePickerClient() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!selected || saving) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/sign-in'); return }

    const roles = selected === 'both' ? ['poster', 'tasker'] : [selected]
    await supabase.from('profiles').update({ roles }).eq('id', user.id)

    setSaving(false)
    router.push('/onboarding/locale')
  }

  return (
    <div className="space-y-3">
      {ROLES.map(role => (
        <button
          key={role.id}
          onClick={() => setSelected(role.id)}
          className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
            selected === role.id
              ? 'border-amber-500 bg-amber-50 shadow-sm'
              : 'border-gray-200 bg-white hover:border-amber-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">{role.emoji}</span>
            <div>
              <p className="font-bold text-gray-900">{role.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{role.body}</p>
            </div>
            {selected === role.id && (
              <div className="ml-auto flex-shrink-0 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>
        </button>
      ))}

      <button
        onClick={save}
        disabled={!selected || saving}
        className="mt-2 w-full rounded-2xl bg-amber-500 py-4 font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Continue →'}
      </button>
    </div>
  )
}
