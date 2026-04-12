import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kira Güvence - Dijital Kira Odeme Platformu';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #1d4ed8 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative dots */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexWrap: 'wrap',
            opacity: 0.06,
          }}
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'white',
                margin: '20px 30px',
              }}
            />
          ))}
        </div>

        {/* Shield icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            marginBottom: 28,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            letterSpacing: -1,
            marginBottom: 12,
          }}
        >
          Kira Güvence
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 40,
          }}
        >
          Dijital Kira Odeme Platformu
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['Dijital Sozlesme', 'Otomatik Odeme', 'KPS Dogrulama', 'KMH Destegi'].map(
            (text) => (
              <div
                key={text}
                style={{
                  padding: '10px 24px',
                  borderRadius: 50,
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {text}
              </div>
            ),
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 20,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: 1,
          }}
        >
          kiraguvence.com
        </div>
      </div>
    ),
    { ...size },
  );
}
