'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/i18n/LanguageContext';

export function FAQSection() {
  const { t } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.faq.title}</h2>
      <div className="space-y-2">
        {t.faq.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep transition-colors duration-300 hover:border-purple animate-[fade-in-up_0.5s_ease-out_backwards]"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="font-medium text-white">{item.q}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-lavender transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-lavender">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
