'use client'

import { APP_NAME } from '@taim/config'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'poster' | 'tasker' | 'both'

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'poster', label: 'I need help', desc: 'Post tasks and hire Taskers', icon: '📋' },
  { value: 'tasker', label: 'I want to earn', desc: 'Take tasks and earn money', icon: '💰' },
  { value: 'both', label: 'Both', desc: 'Post tasks and earn as a Tasker', icon: '⚡' },
]

export default function RolePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Role>('poster')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const roles = selected === 'both' ? ['poster', 'tasker'] : [selected]
      await supabase.from('profiles').update({ roles }).eq('id', user.id)
    }
    if (selected === 'tasker' || selected === 'both') {
      router.push('/onboarding/tasker/categories')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-black text-brand-600">{APP_NAME}</h1>
        <p className="mb-8 text-center text-gray-600">How will you use Taim?</p>
        <div className="space-y-3">
          {ROLE_OPTIONS.map(({ value, label, desc, icon }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
                selected === value
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-gray-200 hover:border-brand-300'
              }`}
            >
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-bold text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="mt-8 w-full rounded-xl bg-brand-600 py-4 font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </main>
  )
}
