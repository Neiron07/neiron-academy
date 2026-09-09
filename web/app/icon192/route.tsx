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
            width: 92,
            height: 92,
            borderRadius: 999,
            background: '#7444D4',
            border: '7px solid #F8F7F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 9, height: 50, background: '#F8F7F9', borderRadius: 4 }} />
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
