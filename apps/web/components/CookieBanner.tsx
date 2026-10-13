'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie_consent')) setShow(true)
    } catch {
      // localStorage unavailable (private mode)
    }
  }, [])

  function accept() {
    try { localStorage.setItem('cookie_consent', 'accepted') } catch { /* ignore */ }
    setShow(false)
  }

  function decline() {
    try { localStorage.setItem('cookie_consent', 'declined') } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-2xl bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
        <p className="text-sm text-gray-300 flex-1">
          We use essential cookies to keep you signed in and analytics cookies to improve Taim.{' '}
          <Link href="/profile/privacy" className="underline hover:text-white transition-colors">Privacy settings</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="rounded-xl border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
