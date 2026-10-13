'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'

interface Props {
  open: boolean
  onClose: () => void
  defaultTab?: 'sign-in' | 'sign-up'
}

export default function AuthModal({ open, onClose, defaultTab = 'sign-in' }: Props) {
  const [tab, setTab] = useState<'sign-in' | 'sign-up'>(defaultTab)
  const pathname = usePathname()
  const prevPath = useRef(pathname)

  // Sync tab when caller changes defaultTab (e.g. "Join free" vs "Sign in")
  useEffect(() => { setTab(defaultTab) }, [defaultTab, open])

  // Close on route change (sign-in/sign-up redirects the user away)
  useEffect(() => {
    if (prevPath.current !== pathname) {
      onClose()
      prevPath.current = pathname
    }
  }, [pathname, onClose])

  // Lock scroll + Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        {/* Logo */}
        <div className="mb-6 text-center">
          <span className="text-2xl font-black text-gray-900">taim<span className="text-amber-500">.</span></span>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
          {(['sign-in', 'sign-up'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {tab === 'sign-in' ? (
          <SignInForm />
        ) : (
          <Suspense>
            <SignUpForm />
          </Suspense>
        )}

        <p className="mt-5 text-center text-sm text-gray-500">
          {tab === 'sign-in' ? (
            <>No account?{' '}
              <button onClick={() => setTab('sign-up')} className="font-semibold text-amber-600 hover:underline">
                Create one free
              </button>
            </>
          ) : (
            <>Already have one?{' '}
              <button onClick={() => setTab('sign-in')} className="font-semibold text-amber-600 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
