'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TopLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const prevPath = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show immediately on any internal link click — don't wait for pathname to update
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href) return
      // Only internal same-origin links, skip hash-only and external
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return
      // Skip if modified click (open in new tab etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      // Skip if target="_blank"
      if (target.target === '_blank') return
      setVisible(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 3000)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Hide once the new route is actually rendered
  useEffect(() => {
    const key = pathname + searchParams.toString()
    if (prevPath.current === null) {
      prevPath.current = key
      return
    }
    if (prevPath.current === key) return
    prevPath.current = key

    // Route changed — hide overlay shortly after render
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 150)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm"
      aria-label="Loading…"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Taim bolt logo spinning */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg animate-pulse">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M18 4L7 20h8l-1 8 14-16h-8l2-8z" fill="white" />
          </svg>
        </div>
        {/* Three bouncing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-amber-500"
              style={{ animation: `bounce 0.9s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
