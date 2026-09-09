import { ExternalLink } from 'lucide-react';
import { TESTIMONIALS, SITE } from '@/lib/site-content';
import { Card } from '@/components/ui/Card';

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">Отзывы родителей</h2>
      <p className="mb-8 text-center">
        <a
          href={SITE.twoGisReviewsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-lavender hover:text-white"
        >
          Смотреть все отзывы в 2ГИС <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TESTIMONIALS.map((t, i) => (
          <Card key={i} className="p-5">
            <p className="text-lavender">«{t.text}»</p>
            <p className="mt-3 text-sm text-muted">{t.author}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
