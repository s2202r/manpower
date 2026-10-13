import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Taim — India\'s Task Marketplace'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fff7ed 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)', filter: 'blur(60px)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, background: '#f59e0b', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="50" height="50" viewBox="0 0 32 32" fill="none">
              <path d="M18 4L7 20h8l-1 8 14-16h-8l2-8z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#111', letterSpacing: '-2px' }}>
            taim<span style={{ color: '#f59e0b' }}>.</span>
          </span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 36, color: '#374151', textAlign: 'center', maxWidth: 700, margin: 0, lineHeight: 1.3 }}>
          India&apos;s Task Marketplace
        </p>
        <p style={{ fontSize: 24, color: '#6b7280', textAlign: 'center', maxWidth: 800, margin: '16px 0 0', lineHeight: 1.5 }}>
          Post any task · Get offers from verified Taskers · Pay in escrow
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          {['🔒 Escrow payments', '✅ KYC-verified', '🇮🇳 12 languages'].map(label => (
            <div key={label} style={{
              background: 'white', border: '2px solid #fde68a',
              borderRadius: 100, padding: '10px 24px',
              fontSize: 20, color: '#92400e', fontWeight: 600,
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
