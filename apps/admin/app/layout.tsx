import type { Metadata } from 'next'
import { APP_NAME } from '@taim/config'

export const metadata: Metadata = {
  title: { default: `Admin — ${APP_NAME}`, template: `%s | Admin — ${APP_NAME}` },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
