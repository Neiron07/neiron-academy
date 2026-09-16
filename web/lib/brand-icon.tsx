/**
 * Общий вид фавикона/иконок PWA — мозг с нейронными связями на тёмном
 * скруглённом квадрате, по мотивам бренд-лого. Используется в icon.tsx,
 * apple-icon.tsx, icon192/route.tsx, icon512/route.tsx через ImageResponse —
 * там нельзя подключить растровый файл лого, поэтому мозг перерисован как SVG.
 */
export function brandIcon(px: number, radius: number) {
  const nodes: [number, number][] = [
    [35, 34], [60, 27], [85, 34],
    [46, 52], [74, 52],
    [60, 70],
  ];
  const links: [number, number][] = [
    [0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [4, 5], [3, 4],
  ];

  return (
    <div
      style={{
        width: px,
        height: px,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#150930',
        borderRadius: radius,
      }}
    >
      <svg width={px * 0.72} height={px * 0.72} viewBox="0 0 120 100">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="120" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#B4A4D7" />
            <stop offset="1" stopColor="#7444D4" />
          </linearGradient>
        </defs>
        <path
          d="M20,55 C10,40 15,20 35,15 C40,5 55,8 60,18 C65,8 80,5 85,15 C105,20 110,40 100,55 C108,65 100,80 85,82 C82,90 70,92 60,85 C50,92 38,90 35,82 C20,80 12,65 20,55 Z"
          fill="none"
          stroke="url(#g)"
          strokeWidth={4}
        />
        <path d="M60,18 C54,32 54,68 60,85" fill="none" stroke="url(#g)" strokeWidth={2.5} />
        {links.map(([a, b], i) => {
          const [x1, y1] = nodes[a]!;
          const [x2, y2] = nodes[b]!;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B4A4D7" strokeWidth={1.5} strokeOpacity={0.85} />;
        })}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4.5} fill="#F8F7F9" />
        ))}
      </svg>
    </div>
  );
}
