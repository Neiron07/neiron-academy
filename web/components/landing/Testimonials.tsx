'use client';

import { ExternalLink } from 'lucide-react';
import { TESTIMONIALS, SITE } from '@/lib/site-content';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/lib/i18n/LanguageContext';

export function TestimonialsSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">{t.testimonials.title}</h2>
      <p className="mb-8 text-center">
        <a
          href={SITE.twoGisReviewsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-lavender transition-colors hover:text-white"
        >
          {t.testimonials.cta} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((item, i) => (
          <Card
            key={item.author}
            className="flex flex-col p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-purple animate-[fade-in-up_0.6s_ease-out_backwards]"
            style={{ animationDelay: `${(i % 6) * 70}ms` }}
          >
            <p className="text-lavender">«{item.text}»</p>
            <p className="mt-3 text-sm text-muted">{item.author}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
