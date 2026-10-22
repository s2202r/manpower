import Link from 'next/link'

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-5xl font-black text-gray-200 mb-4">403</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-sm text-gray-500 mb-6">Your account does not have admin privileges.</p>
        <Link href="/" className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
          Back to app
        </Link>
      </div>
    </div>
  )
}
