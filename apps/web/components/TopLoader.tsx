'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function TopLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const barRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    // Show bar on navigation start
    bar.style.transition = 'none'
    bar.style.width = '0%'
    bar.style.opacity = '1'

    // Quick start to 30%, then slow crawl
    requestAnimationFrame(() => {
      bar.style.transition = 'width 0.3s ease'
      bar.style.width = '30%'
      timerRef.current = setTimeout(() => {
        bar.style.transition = 'width 3s ease'
        bar.style.width = '80%'
      }, 300)
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      // Complete on unmount (route resolved)
      bar.style.transition = 'width 0.15s ease, opacity 0.2s ease 0.15s'
      bar.style.width = '100%'
      setTimeout(() => { bar.style.opacity = '0' }, 300)
    }
  }, [pathname, searchParams])

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full">
      <div
        ref={barRef}
        style={{ width: '0%', opacity: 0 }}
        className="h-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"
      />
    </div>
  )
}
