import { ImageResponse } from 'next/og';
import { brandIcon } from '@/lib/brand-icon';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
          gap: 28,
          background: 'linear-gradient(135deg, #150930 0%, #270E54 100%)',
        }}
      >
        {brandIcon(160, 36)}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#F8F7F9',
            letterSpacing: -1,
          }}
        >
          Neiron Academy
        </div>
        <div style={{ fontSize: 32, color: '#B4A4D7' }}>IT-школа для детей 7–16 лет в Астане</div>
      </div>
    ),
    size,
  );
}
