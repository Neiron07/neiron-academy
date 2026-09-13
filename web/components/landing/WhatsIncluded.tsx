'use client';

import { CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/i18n/LanguageContext';

export function WhatsIncludedSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.whatsIncluded.title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {t.whatsIncluded.items.map((item, i) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-purple-mid bg-purple-deep p-4 transition-transform duration-300 hover:-translate-y-1 hover:border-purple animate-[fade-in-up_0.5s_ease-out_backwards]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden />
            <p className="text-lavender">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
