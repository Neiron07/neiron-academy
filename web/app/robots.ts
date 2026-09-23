import type { MetadataRoute } from 'next';

const SITE_URL = 'https://neiron-academy.vercel.app';

/**
 * Единственная публичная страница для поисковиков — лендинг «/». Личные
 * кабинеты (/app/*), вход (/login) и API — не контент для индексации.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/login', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
