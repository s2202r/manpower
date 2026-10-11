// Simple in-memory rate limiter for Edge runtime.
// Uses a sliding-window counter keyed by IP + route.
// For production scale, replace the store with an Upstash Redis client.

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()

interface RateLimitResult { allowed: boolean; remaining: number; resetAt: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// Purge expired entries to prevent unbounded growth
export function purgeExpired() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}
