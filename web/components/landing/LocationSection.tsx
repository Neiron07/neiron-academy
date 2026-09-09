import { MapPin } from 'lucide-react';
import { SITE } from '@/lib/site-content';
import { Card } from '@/components/ui/Card';

export function LocationSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Адрес</h2>
      <Card className="mx-auto max-w-md p-6 text-center">
        <MapPin className="mx-auto mb-2 size-6 text-white" aria-hidden />
        <p className="font-display text-lg font-semibold text-white">3 минуты пешком по Highvill</p>
        <p className="mt-2 text-lavender">{SITE.addressLine}</p>
        <a
          href={`https://2gis.kz/search/${encodeURIComponent(SITE.mapsQuery)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-lavender underline hover:text-white"
        >
          Открыть на карте
        </a>
      </Card>
    </section>
  );
}
