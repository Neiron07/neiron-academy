'use client';

import Image from 'next/image';
import type { PublicCourse } from '@/lib/types';
import { COURSE_PHOTOS } from '@/lib/site-content';
import { useLang } from '@/lib/i18n/LanguageContext';

export function CoursesGrid({ courses }: { courses: PublicCourse[] }) {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-2 text-center font-display text-3xl font-semibold text-white">{t.courses.title}</h2>
      <p className="mb-8 text-center text-lavender">{t.courses.subtitle}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map((c, i) => {
          const copy = t.courses.items[c.slug as keyof typeof t.courses.items];
          const photo = COURSE_PHOTOS[c.slug];
          return (
            <div
              key={c.slug}
              className="overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep transition-transform duration-300 hover:-translate-y-1 hover:border-purple animate-[fade-in-up_0.6s_ease-out_backwards]"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {photo && (
                <div className="aspect-[16/9] overflow-hidden">
                  <Image
                    src={photo}
                    alt={copy?.name ?? c.name}
                    width={600}
                    height={338}
                    className="size-full object-cover opacity-90 transition-transform duration-500 hover:scale-105 hover:opacity-100"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-white">{copy?.name ?? c.name}</h3>
                {(c.age_min || c.age_max) && (
                  <p className="mt-1 text-sm text-lavender">
                    {c.age_min}–{c.age_max} {t.courses.agesSuffix}
                  </p>
                )}
                <p className="mt-3 text-lavender">{copy?.explanation ?? c.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
