import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = new Set(['aadhaar', 'pan', 'voter_id', 'passport', 'driving_licence'])
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const documentType = formData.get('documentType') as string
  const file = formData.get('file') as File | null

  if (!documentType || !ALLOWED_TYPES.has(documentType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })

  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedMime.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Upload to private kyc-docs bucket (not publicly accessible)
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${documentType}_${Date.now()}.${ext}`
  const { error: uploadErr } = await supabase.storage
    .from('kyc-docs')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

  // Insert KYC request
  const { error: dbErr } = await supabase.from('kyc_requests').insert({
    user_id: user.id,
    document_type: documentType,
    document_path: path,
    status: 'pending',
    consent_given_at: new Date().toISOString(),
    consent_purpose: 'kyc_identity_verification',
    submitted_at: new Date().toISOString(),
  })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
