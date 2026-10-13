import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#f59e0b',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="110" height="110" viewBox="0 0 32 32" fill="none">
          <path d="M18 4L7 20h8l-1 8 14-16h-8l2-8z" fill="white" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
