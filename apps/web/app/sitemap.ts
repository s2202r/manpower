import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://taim.in'
  const supabase = await createClient()

  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/tasks`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/auth/sign-in`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/auth/sign-up`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Open tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, updated_at')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(500)

  const taskUrls: MetadataRoute.Sitemap = (tasks ?? []).map(t => ({
    url: `${base}/tasks/${t.id}`,
    lastModified: new Date(t.updated_at ?? new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Public tasker profiles
  const { data: taskers } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('verification_tier', 'kyc')
    .limit(200)

  const taskerUrls: MetadataRoute.Sitemap = (taskers ?? []).map(t => ({
    url: `${base}/taskers/${t.id}`,
    lastModified: new Date((t as Record<string, unknown>).updated_at as string ?? new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...statics, ...taskUrls, ...taskerUrls]
}
