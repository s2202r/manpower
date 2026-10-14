'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'

const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
]

export default function KycForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suppress unused variable lint
  void userId

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!docType || !file || !consent) { setError('Please complete all fields and consent'); return }
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('documentType', docType)
    formData.append('file', file)

    const res = await fetch('/api/kyc/submit', { method: 'POST', body: formData })
    const data = await res.json() as { error?: string }
    if (!res.ok) { setError(data.error ?? 'Submission failed'); setLoading(false); return }
    router.push('/profile?kyc=submitted')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Document type</label>
        <select value={docType} onChange={e => setDocType(e.target.value)} required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none">
          <option value="">Select document…</option>
          {DOCUMENT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload document image</label>
        <input type="file" accept="image/*,.pdf" required
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:text-white" />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
        <span className="text-sm text-gray-600">
          I consent to Taim processing my identity document for KYC verification, as described in
          the <a href="/privacy" className="text-brand-600 underline">Privacy Policy</a>. My document
          will be retained for legal compliance and deleted upon account closure.
        </span>
      </label>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading || !docType || !file || !consent}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700 disabled:opacity-50">
        {loading && <Spinner />}
        {loading ? 'Uploading…' : 'Submit for verification'}
      </button>
    </form>
  )
}
