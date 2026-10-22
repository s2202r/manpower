import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const formData = await req.formData()
  const name = (formData.get('name') as string | null)?.trim()
  const slug = (formData.get('slug') as string | null)?.trim()
  const icon = (formData.get('icon') as string | null)?.trim() || null
  const allowedTypes = formData.getAll('allowed_types') as string[]

  if (!name || !slug) {
    return NextResponse.redirect(new URL('/categories?msg=error', req.url))
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.redirect(new URL('/categories?msg=error', req.url))
  }
  if (allowedTypes.length === 0) {
    return NextResponse.redirect(new URL('/categories?msg=error', req.url))
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('categories').insert({
    slug,
    icon,
    names: { en: name },
    allowed_types: allowedTypes,
    is_live: true,
  })

  if (error) {
    return NextResponse.redirect(new URL('/categories?msg=error', req.url))
  }

  return NextResponse.redirect(new URL('/categories?msg=created', req.url))
}
