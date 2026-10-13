'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import AuthModal from '@/components/AuthModal'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Hide on admin or pure auth callback routes
  if (pathname.startsWith('/auth/callback')) return null

  function openSignIn() { setModalTab('sign-in'); setModalOpen(true) }
  function openSignUp() { setModalTab('sign-up'); setModalOpen(true) }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-200 ${
          scrolled
            ? 'border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl'
            : 'border-transparent bg-white/80 backdrop-blur-xl'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="24" height="28" viewBox="0 0 28 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 18h9l-1 12 15-18h-9l2-10z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="text-xl font-black tracking-tight text-gray-900">
              taim<span className="text-amber-500">.</span>
            </span>
          </Link>

          {/* Centre links (desktop) */}
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/tasks" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Browse tasks
            </Link>
            {user && (
              <Link href="/tasks/new" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Post a task
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={openSignUp}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
                >
                  Join free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={modalTab}
      />
    </>
  )
}
