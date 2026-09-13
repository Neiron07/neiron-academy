'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { waLink } from '@/lib/constants';
import { useLang } from '@/lib/i18n/LanguageContext';

/** Иллюстративные примеры работ — без фото, с описанием и переходом в WhatsApp за подробностями. */
export function StudentWorksSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.studentWorks.title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.studentWorks.items.map((w, i) => (
          <div
            key={w.title}
            className="flex flex-col rounded-2xl border border-purple-mid bg-purple-deep p-4 transition-transform duration-300 hover:-translate-y-1 hover:border-purple animate-[fade-in-up_0.6s_ease-out_backwards]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="font-medium text-white">{w.title}</p>
            <p className="text-sm text-muted">{w.author}</p>
            <p className="mt-2 flex-1 text-sm text-lavender">{w.description}</p>
            <a href={waLink(t.whatsapp.studentWorksMessage)} target="_blank" rel="noreferrer" className="mt-4">
              <Button variant="secondary" size="sm" fullWidth>
                {t.studentWorks.cta} <ExternalLink className="size-3.5" aria-hidden />
              </Button>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
