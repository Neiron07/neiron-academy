'use client';

import Image from 'next/image';
import { TEACHERS } from '@/lib/site-content';
import { useLang } from '@/lib/i18n/LanguageContext';

/** Фото — стоковые, замените на реальные фото преподавателей. */
export function TeachersSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">{t.teachers.title}</h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-lavender">{t.teachers.intro}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TEACHERS.map((teacher, i) => (
          <div
            key={teacher.name}
            className="flex items-center gap-4 animate-[fade-in-up_0.6s_ease-out_backwards]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep p-0.5">
              <Image
                src={teacher.photo}
                alt={teacher.name}
                width={80}
                height={80}
                className="size-full rounded-[14px] object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
              />
            </div>
            <div>
              <p className="font-medium text-white">{teacher.name}</p>
              <p className="text-sm text-lavender">{teacher.role}</p>
              <p className="text-sm text-muted">{teacher.years}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
