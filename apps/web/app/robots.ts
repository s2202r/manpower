import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tasks', '/taskers'],
        disallow: ['/dashboard', '/api/', '/admin', '/onboarding', '/profile', '/bookings', '/search'],
      },
    ],
    sitemap: 'https://taim.in/sitemap.xml',
  }
}
