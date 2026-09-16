/** Рисованные обложки игр для лобби — та же палитра и стиль, что и в самих играх на канвасе. */

export function DinoCover() {
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full">
      <rect width="160" height="100" fill="#150930" />
      <line x1="0" y1="80" x2="160" y2="80" stroke="#5A36A2" strokeWidth="2" strokeDasharray="10 8" />
      <g transform="translate(48,40)">
        <rect x="0" y="0" width="30" height="34" rx="8" fill="#7444D4" stroke="#F8F7F9" strokeWidth="2" />
        <circle cx="9" cy="14" r="2.8" fill="#F8F7F9" />
        <circle cx="21" cy="14" r="2.8" fill="#F8F7F9" />
        <line x1="15" y1="0" x2="15" y2="-9" stroke="#F8F7F9" strokeWidth="2" />
        <circle cx="15" cy="-11" r="3" fill="#F8F7F9" />
      </g>
      <g transform="translate(112,58)">
        {Array.from({ length: 8 }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={Math.cos(ang) * 11}
              y1={Math.sin(ang) * 11}
              x2={Math.cos(ang) * 17}
              y2={Math.sin(ang) * 17}
              stroke="#F87171"
              strokeWidth="3"
            />
          );
        })}
        <circle r="11" fill="#F87171" />
        <circle cx="-3" cy="-2" r="1.8" fill="#150930" />
        <circle cx="3" cy="1" r="1.5" fill="#150930" />
      </g>
    </svg>
  );
}

export function Game2048Cover() {
  const tiles = [
    { x: 8, y: 8, v: 2, bg: '#301B58' },
    { x: 46, y: 8, v: 8, bg: '#4A2989' },
    { x: 84, y: 8, v: 4, bg: '#3D2270' },
    { x: 122, y: 8, v: 32, bg: '#7444D4' },
    { x: 8, y: 46, v: 16, bg: '#5A36A2' },
    { x: 46, y: 46, v: 128, bg: '#8B5CE0' },
    { x: 84, y: 46, v: 2048, bg: '#F8F7F9' },
    { x: 122, y: 46, v: 4, bg: '#3D2270' },
  ];
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full">
      <rect width="160" height="100" fill="#150930" />
      {tiles.map((t, i) => (
        <g key={i}>
          <rect x={t.x} y={t.y} width="30" height="30" rx="6" fill={t.bg} />
          <text
            x={t.x + 15}
            y={t.y + 20}
            textAnchor="middle"
            fontSize={t.v >= 1000 ? 10 : 13}
            fontWeight="700"
            fill={t.v >= 256 ? '#150930' : '#F8F7F9'}
          >
            {t.v}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function FlappyCover() {
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full">
      <rect width="160" height="100" fill="#150930" />
      <g>
        <rect x="30" y="0" width="18" height="34" fill="#5A36A2" stroke="#B4A4D7" strokeWidth="1.5" />
        <rect x="30" y="60" width="18" height="40" fill="#5A36A2" stroke="#B4A4D7" strokeWidth="1.5" />
        <rect x="118" y="0" width="18" height="52" fill="#5A36A2" stroke="#B4A4D7" strokeWidth="1.5" />
        <rect x="118" y="78" width="18" height="22" fill="#5A36A2" stroke="#B4A4D7" strokeWidth="1.5" />
      </g>
      <g transform="translate(72,42) rotate(-12)">
        <rect x="-14" y="-12" width="28" height="24" rx="7" fill="#7444D4" stroke="#F8F7F9" strokeWidth="2" />
        <circle cx="3" cy="-3" r="2.6" fill="#F8F7F9" />
        <line x1="0" y1="-12" x2="0" y2="-19" stroke="#F8F7F9" strokeWidth="2" />
        <circle cx="0" cy="-21" r="2.6" fill="#F8F7F9" />
      </g>
    </svg>
  );
}
