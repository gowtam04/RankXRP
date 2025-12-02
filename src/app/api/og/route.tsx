import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tier = searchParams.get('tier') || 'Worm';
  const percentile = searchParams.get('percentile') || '50';
  const emoji = searchParams.get('emoji') || '🪱';
  const color = `#${searchParams.get('color') || 'A16207'}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1A1F24',
          backgroundImage: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.12) 0%, transparent 60%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: 140, marginBottom: 8 }}>
          {emoji}
        </div>

        {/* Tier Name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: color,
            marginTop: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {tier}
        </div>

        {/* Percentile Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: color,
            backgroundColor: `${color}15`,
            padding: '16px 40px',
            borderRadius: 999,
            border: `3px solid ${color}40`,
            marginTop: 32,
          }}
        >
          Top {percentile}% of XRP Holders
        </div>

        {/* Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28, color: '#9CA3AF', fontWeight: 500 }}>
            rankxrp.com
          </span>
        </div>

        {/* Decorative corner accents */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 32,
            width: 60,
            height: 60,
            borderTop: `4px solid ${color}40`,
            borderLeft: `4px solid ${color}40`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 32,
            right: 32,
            width: 60,
            height: 60,
            borderTop: `4px solid ${color}40`,
            borderRight: `4px solid ${color}40`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: 32,
            width: 60,
            height: 60,
            borderBottom: `4px solid ${color}40`,
            borderLeft: `4px solid ${color}40`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 32,
            width: 60,
            height: 60,
            borderBottom: `4px solid ${color}40`,
            borderRight: `4px solid ${color}40`,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
