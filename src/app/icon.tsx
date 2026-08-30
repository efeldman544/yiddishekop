import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#2A62AE',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
          }}
        >
          Y
        </div>
      </div>
    ),
    { ...size }
  )
}
