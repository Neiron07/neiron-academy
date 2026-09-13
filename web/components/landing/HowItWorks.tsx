'use client';

import { useLang } from '@/lib/i18n/LanguageContext';

/** Единственное место на лендинге, где уместна нумерация — это настоящая последовательность. */
export function HowItWorksSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.howItWorks.title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {t.howItWorks.steps.map((s, i) => (
          <div key={s.title} className="animate-[fade-in-up_0.6s_ease-out_backwards]" style={{ animationDelay: `${i * 100}ms` }}>
            <span className="flex size-10 items-center justify-center rounded-full bg-purple font-display text-sm font-bold text-white transition-transform duration-300 hover:scale-110">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-3 font-medium text-white">{s.title}</h3>
            <p className="mt-1 text-sm text-lavender">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
