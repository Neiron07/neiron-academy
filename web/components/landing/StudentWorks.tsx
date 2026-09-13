'use client';

import Image from 'next/image';
import { STUDENT_WORKS_PHOTOS } from '@/lib/site-content';
import { useLang } from '@/lib/i18n/LanguageContext';

/** Фото — стоковые, замените на реальные скриншоты проектов учеников. Самая конверсионная секция. */
export function StudentWorksSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">{t.studentWorks.title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.studentWorks.items.map((w, i) => (
          <div
            key={w.title}
            className="group overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep p-3 transition-transform duration-300 hover:-translate-y-1 animate-[fade-in-up_0.6s_ease-out_backwards]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-purple-mid/25">
              <Image
                src={STUDENT_WORKS_PHOTOS[i % STUDENT_WORKS_PHOTOS.length]!}
                alt={w.title}
                width={400}
                height={225}
                className="size-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
              />
            </div>
            <p className="text-sm font-medium text-white">{w.title}</p>
            <p className="text-sm text-muted">{w.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
