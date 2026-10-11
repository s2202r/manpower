import { APP_NAME } from '@taim/config'

export default function AdminHome() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">{APP_NAME} Admin</h1>
    </main>
  )
}
