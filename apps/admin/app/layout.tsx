import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'Taim Admin', description: 'Taim platform admin panel' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
