import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#150930',
        }}
      >
        <div
          style={{
            width: 246,
            height: 246,
            borderRadius: 999,
            background: '#7444D4',
            border: '18px solid #F8F7F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 24, height: 134, background: '#F8F7F9', borderRadius: 12 }} />
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
