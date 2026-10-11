import { APP_NAME, APP_TAGLINE } from '@taim/config'
import { LOCALES, LOCALE_LABELS, type Locale } from '@taim/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-2xl font-black tracking-tight text-brand-600">{APP_NAME}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/auth/sign-in" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center">
        <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight text-gray-900">
          Get any task done, <span className="text-brand-600">fast.</span>
        </h1>
        <p className="mb-8 max-w-xl text-xl text-gray-600">{APP_TAGLINE}</p>
        <div className="flex gap-4">
          <Link href="/auth/sign-up" className="rounded-xl bg-brand-600 px-8 py-4 text-lg font-bold text-white hover:bg-brand-700">
            Post a task
          </Link>
          <Link href="/auth/sign-up?role=tasker" className="rounded-xl border-2 border-brand-600 px-8 py-4 text-lg font-bold text-brand-600 hover:bg-brand-50">
            Earn as Tasker
          </Link>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">How it works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Post your task', body: 'Describe what you need, set a budget, and pick a time.' },
              { step: '2', title: 'Get offers', body: 'Verified Taskers nearby send you offers.' },
              { step: '3', title: 'Get it done', body: 'Accept an offer, pay securely, and confirm when done.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-lg">{step}</div>
                <h3 className="mb-2 text-xl font-bold">{title}</h3>
                <p className="text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
