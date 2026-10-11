import Link from 'next/link'
import { APP_NAME, APP_TAGLINE } from '@taim/config'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <TaimLogo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/auth/sign-in"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-white px-5 pt-20 pb-24 text-center">
        {/* background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute top-0 right-0 h-[400px] w-[400px] translate-x-1/3 rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] -translate-x-1/3 rounded-full bg-yellow-100/50 blur-3xl" />
        </div>

        {/* badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          India&apos;s task marketplace is live
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.08] tracking-tight text-gray-900 sm:text-7xl">
          Koi bhi kaam,{' '}
          <span className="relative whitespace-nowrap">
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute left-0 top-full mt-1 w-full fill-amber-300/60"
              preserveAspectRatio="none"
            >
              <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
            </svg>
            <span className="relative text-amber-600">Taim pe.</span>
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-xl text-gray-500 leading-relaxed">
          {APP_TAGLINE} — Post any task, get verified Taskers to bid, pay securely in escrow.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/sign-up"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all hover:shadow-amber-300 hover:shadow-xl hover:-translate-y-0.5"
          >
            Post a task — it&apos;s free
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/auth/sign-up?role=tasker"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 px-8 py-4 text-lg font-bold text-gray-700 hover:border-amber-400 hover:text-amber-600 transition-colors"
          >
            Earn as Tasker
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">0% fee for 60 days</span>
          </Link>
        </div>

        {/* trust bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {[
            { icon: '🔒', text: 'Escrow payments' },
            { icon: '✅', text: 'Verified Taskers' },
            { icon: '⚡', text: 'Offers in minutes' },
            { icon: '📱', text: 'Android & iOS app' },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 font-medium">
              <span>{icon}</span> {text}
            </span>
          ))}
        </div>
      </section>

      {/* ── Category chips ── */}
      <section className="bg-gray-50 py-12 px-5">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-gray-400">Popular categories</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(({ icon, label }) => (
              <Link
                key={label}
                href="/auth/sign-up"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                <span className="text-base">{icon}</span> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-5">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 mb-2">How it works</p>
            <h2 className="text-4xl font-black tracking-tight">Three steps to done.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ num, emoji, title, body, color }) => (
              <div key={num} className={`relative rounded-3xl p-8 ${color} overflow-hidden`}>
                <div className="absolute -right-4 -top-4 text-8xl opacity-10 select-none">{emoji}</div>
                <div className="relative">
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-lg font-black text-gray-800 shadow-sm">
                    {num}
                  </span>
                  <h3 className="mt-3 mb-2 text-xl font-bold text-gray-900">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="bg-gray-950 py-20 px-5 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400 mb-2">Built for India</p>
            <h2 className="text-4xl font-black tracking-tight text-white">Everything you need, nothing you don&apos;t.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-400/30 hover:bg-white/8 transition-colors">
                <div className="mb-4 text-3xl">{icon}</div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tasker CTA ── */}
      <section className="relative isolate overflow-hidden bg-amber-500 py-20 px-5 text-center text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-amber-400/40 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-orange-400/40 blur-3xl" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4">For Taskers</p>
        <h2 className="mb-4 text-4xl font-black tracking-tight">Turn your skills into ₹₹₹.</h2>
        <p className="mb-8 mx-auto max-w-xl text-lg opacity-90">
          Set your own rates, work when you want, earn within hours. Zero platform fee for your first 60 days.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/sign-up?role=tasker"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-amber-600 shadow-lg hover:bg-amber-50 transition-colors"
          >
            Start earning today
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <TaimLogo />
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} Taim Technologies Pvt. Ltd.</p>
          <div className="flex gap-5 text-sm text-gray-500">
            <Link href="#" className="hover:text-amber-600 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-amber-600 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-amber-600 transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ── Taim SVG logo ── */
function TaimLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* lightning bolt mark */}
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true">
        <path
          d="M16 2L4 18h9l-1 12 15-18h-9l2-10z"
          fill="#f59e0b"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-2xl font-black tracking-tight text-gray-900">
        taim<span className="text-amber-500">.</span>
      </span>
    </div>
  )
}

/* ── Data ── */
const CATEGORIES = [
  { icon: '🔧', label: 'Home repairs' },
  { icon: '🧹', label: 'Cleaning' },
  { icon: '🛵', label: 'Delivery' },
  { icon: '💻', label: 'Tech help' },
  { icon: '🎨', label: 'Design' },
  { icon: '📦', label: 'Moving' },
  { icon: '🌿', label: 'Gardening' },
  { icon: '📸', label: 'Photography' },
  { icon: '👶', label: 'Childcare' },
  { icon: '🐾', label: 'Pet care' },
]

const STEPS = [
  {
    num: '1', emoji: '📋',
    title: 'Post your task',
    body: 'Describe what you need, set your budget, and choose when. Takes under 2 minutes.',
    color: 'bg-amber-50',
  },
  {
    num: '2', emoji: '📨',
    title: 'Receive offers',
    body: 'Verified Taskers near you send competitive offers. Read reviews and pick the best fit.',
    color: 'bg-orange-50',
  },
  {
    num: '3', emoji: '✅',
    title: 'Get it done',
    body: 'Pay into escrow. Money releases to the Tasker only when you confirm the work is done.',
    color: 'bg-yellow-50',
  },
]

const FEATURES = [
  { icon: '🔐', title: 'Escrow payments', body: 'Your money is held safely until you confirm the task is complete. No disputes, no stress.' },
  { icon: '✅', title: 'KYC-verified Taskers', body: 'Every Tasker is identity-verified. See ratings, reviews, and completed task count before you hire.' },
  { icon: '⚡', title: 'Fast offers', body: 'Get your first offer within minutes. Taskers are already nearby and looking for work.' },
  { icon: '🇮🇳', title: '12 Indian languages', body: 'Full support for Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati and more. Even Urdu (RTL).' },
  { icon: '📱', title: 'Android & iOS app', body: 'Post tasks, chat with Taskers, confirm completion — all from your phone.' },
  { icon: '💸', title: 'Fast payouts', body: 'Taskers receive their payout directly to their bank account within hours of task completion.' },
]
