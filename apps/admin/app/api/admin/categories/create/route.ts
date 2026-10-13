import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const formData = await req.formData()
  const name = (formData.get('name') as string | null)?.trim()
  const slug = (formData.get('slug') as string | null)?.trim()
  const icon = (formData.get('icon') as string | null)?.trim() || null

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('task_categories').insert({ name, slug, icon })

  return NextResponse.redirect(new URL('/categories?msg=created', req.url))
}
