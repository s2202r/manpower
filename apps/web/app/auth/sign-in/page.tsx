import { APP_NAME } from '@taim/config'
import SignInForm from '@/components/auth/SignInForm'
import Link from 'next/link'

export const metadata = { title: 'Sign in' }

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-black text-brand-600">{APP_NAME}</Link>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <SignInForm />
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="font-semibold text-brand-600 hover:underline">Create one</Link>
        </p>
      </div>
    </main>
  )
}
