'use client';

import { Card } from '@/components/ui/Card';
import { useLang } from '@/lib/i18n/LanguageContext';

export function WhyUsSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.whyUs.title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {t.whyUs.items.map((item, i) => (
          <Card
            key={item.title}
            className="p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-purple animate-[fade-in-up_0.6s_ease-out_backwards]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <h3 className="font-medium text-white">{item.title}</h3>
            <p className="mt-2 text-lavender">{item.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
