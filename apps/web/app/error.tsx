'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-8">An unexpected error occurred. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 font-bold text-sm transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="rounded-xl border border-gray-200 text-gray-600 px-6 py-3 font-semibold text-sm hover:bg-gray-50 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}
