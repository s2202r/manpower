'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface Notification {
  id: string; kind: string; title: string; body: string
  link: string | null; read: boolean; created_at: string
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void load()
    // close on outside click
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function load() {
    const res = await fetch('/api/notifications')
    const json = await res.json() as { notifications: Notification[] }
    setItems(json.notifications ?? [])
  }

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = items.filter(n => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) void load() }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up!</li>
            )}
            {items.map(n => (
              <li key={n.id} className={`${!n.read ? 'bg-amber-50/60' : ''}`}>
                {n.link ? (
                  <Link href={n.link} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                    <NotificationRow n={n} />
                  </Link>
                ) : (
                  <div className="px-4 py-3">
                    <NotificationRow n={n} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function NotificationRow({ n }: { n: Notification }) {
  const KIND_ICON: Record<string, string> = {
    new_offer: '📨', offer_accepted: '✅', task_assigned: '🎯',
    payment_held: '🔐', task_done: '🏁', payment_released: '💸',
    new_message: '💬', review_received: '⭐',
  }
  return (
    <>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-base">{KIND_ICON[n.kind] ?? '🔔'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
        </div>
        {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />}
      </div>
      <p className="mt-1 text-xs text-gray-400 pl-7">
        {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>
    </>
  )
}
