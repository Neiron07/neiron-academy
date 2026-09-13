'use client';

import { TEACHERS } from '@/lib/site-content';
import { useLang } from '@/lib/i18n/LanguageContext';

/** Пока нет реальных фото — аватар рисуется первой буквой имени вместо чужого стокового лица. */
export function TeachersSection() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">{t.teachers.title}</h2>
      <p className="mx-auto mb-8 max-w-xl text-center text-lavender">{t.teachers.intro}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {TEACHERS.map((teacher, i) => {
          const copy = t.teachers.items[teacher.id as keyof typeof t.teachers.items];
          return (
            <div
              key={teacher.id}
              className="flex items-center gap-4 animate-[fade-in-up_0.6s_ease-out_backwards]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-purple-mid bg-purple/15 font-display text-2xl font-bold text-purple">
                {teacher.name[0]}
              </div>
              <div>
                <p className="font-medium text-white">
                  {teacher.honorific} {teacher.name}
                </p>
                <p className="text-sm text-lavender">{copy?.role}</p>
                {copy?.years && <p className="text-sm text-muted">{copy.years}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
