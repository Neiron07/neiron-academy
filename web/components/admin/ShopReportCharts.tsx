'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { EmittedRow, ShopReportRow } from '@/lib/types';
import { formatKzt, formatMonth } from '@/lib/format';

// Значения дублируют токены палитры (--purple / --lavender / --purple-mid) — recharts рендерит
// в отдельный SVG-документ, где var() из основной страницы не всегда доступен.
const PURPLE = '#7444D4';
const LAVENDER = '#B4A4D7';
const GRID = '#5A36A2';

function monthLabel(iso: string) {
  return formatMonth(iso).replace(' г.', '');
}

export function EmissionChart({ data }: { data: EmittedRow[] }) {
  const rows = [...data].reverse().map((r) => ({ ...r, month: monthLabel(r.month) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={rows}>
          <CartesianGrid stroke={GRID} strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="month" stroke={LAVENDER} fontSize={12} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis stroke={LAVENDER} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#270E54', border: '1px solid #5A36A2', borderRadius: 12, color: '#F8F7F9' }}
            labelStyle={{ color: '#B4A4D7' }}
          />
          <Bar dataKey="coins_emitted" name="Начислено" fill={PURPLE} radius={[6, 6, 0, 0]} />
          <Bar dataKey="coins_burned" name="Списано" fill={LAVENDER} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostChart({ data }: { data: ShopReportRow[] }) {
  const rows = [...data].reverse().map((r) => ({ ...r, month: monthLabel(r.month) }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={rows}>
          <CartesianGrid stroke={GRID} strokeOpacity={0.25} vertical={false} />
          <XAxis dataKey="month" stroke={LAVENDER} fontSize={12} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis stroke={LAVENDER} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatKzt(v)} />
          <Tooltip
            formatter={(value) => formatKzt(Number(value))}
            contentStyle={{ background: '#270E54', border: '1px solid #5A36A2', borderRadius: 12, color: '#F8F7F9' }}
            labelStyle={{ color: '#B4A4D7' }}
          />
          <Bar dataKey="cost_kzt" name="Себестоимость призов" fill={PURPLE} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
