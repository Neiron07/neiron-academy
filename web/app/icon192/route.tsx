import { ImageResponse } from 'next/og';
import { brandIcon } from '@/lib/brand-icon';

export async function GET() {
  return new ImageResponse(brandIcon(192, 40), { width: 192, height: 192 });
}
