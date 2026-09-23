import type { MetadataRoute } from 'next';

const SITE_URL = 'https://neiron-academy.vercel.app';

/** Только лендинг — остальные роуты требуют входа и не публичный контент. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
