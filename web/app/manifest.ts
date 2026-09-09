import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Neiron Academy',
    short_name: 'Neiron',
    description: 'Личный кабинет IT-школы Neiron Academy',
    start_url: '/login',
    display: 'standalone',
    background_color: '#150930',
    theme_color: '#150930',
    icons: [
      { src: '/icon192', sizes: '192x192', type: 'image/png' },
      { src: '/icon512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
