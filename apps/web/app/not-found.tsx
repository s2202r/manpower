import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-black text-amber-400 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 font-bold text-sm transition-colors">
          Go home
        </Link>
      </div>
    </main>
  )
}
