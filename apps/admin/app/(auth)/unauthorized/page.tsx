import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-white mb-2">Access denied</h1>
        <p className="text-gray-400 mb-6">Your account does not have admin privileges.</p>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/login"
            className="rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-white hover:bg-amber-400 transition-colors">
            Sign in with a different account
          </Link>
          <form action="/auth/sign-out" method="POST">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
