'use client';

import { MapPin } from 'lucide-react';
import { SITE } from '@/lib/site-content';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/lib/i18n/LanguageContext';

export function LocationSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.location.title}</h2>
      <Card className="mx-auto max-w-md p-6 text-center transition-transform duration-300 hover:-translate-y-1">
        <MapPin className="mx-auto mb-2 size-6 text-white" aria-hidden />
        <p className="font-display text-lg font-semibold text-white">{t.location.cardTitle}</p>
        <p className="mt-2 text-lavender">{SITE.addressLine}</p>
        <a
          href={`https://2gis.kz/search/${encodeURIComponent(SITE.mapsQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-lavender underline hover:text-white"
        >
          {t.location.cta}
        </a>
      </Card>
    </section>
  );
}
