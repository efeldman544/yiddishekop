import { ImageResponse } from 'next/og'

export const alt = 'YiddisheKop'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Gold accent bar */}
        <div style={{ width: 60, height: 4, background: '#1D4F91', borderRadius: 2, marginBottom: 48 }} />

        {/* Brand name */}
        <div style={{ display: 'flex', fontSize: 100, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1 }}>
          <span style={{ color: '#0D2545' }}>Yiddishe</span>
          <span style={{ color: '#1D4F91' }}>Kop</span>
        </div>

        {/* Subline */}
        <div style={{ fontSize: 22, color: '#52698A', marginTop: 32, textAlign: 'center' }}>
          Vetted · Video-interviewed · Worth your time
        </div>

        {/* Bottom URL */}
        <div style={{ position: 'absolute', bottom: 48, fontSize: 18, color: '#1D4F91', letterSpacing: '0.05em' }}>
          yiddishekop.app
        </div>
      </div>
    ),
    { ...size }
  )
}
