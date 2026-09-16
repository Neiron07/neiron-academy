import { ImageResponse } from 'next/og';
import { brandIcon } from '@/lib/brand-icon';

export async function GET() {
  return new ImageResponse(brandIcon(512, 108), { width: 512, height: 512 });
}
