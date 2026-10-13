import { APP_NAME } from '@taim/config'
import SignUpForm from '@/components/auth/SignUpForm'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = { title: 'Create account' }

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-black text-brand-600">{APP_NAME}</Link>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
        <Suspense>
          <SignUpForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
