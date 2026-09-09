import Image from 'next/image';
import { TEACHERS } from '@/lib/site-content';

/** Фото — стоковые, замените на реальные фото преподавателей. */
export function TeachersSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Преподаватели</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TEACHERS.map((t) => (
          <div key={t.name} className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep p-0.5">
              <Image
                src={t.photo}
                alt={t.name}
                width={80}
                height={80}
                className="size-full rounded-[14px] object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
              />
            </div>
            <div>
              <p className="font-medium text-white">{t.name}</p>
              <p className="text-sm text-lavender">{t.role}</p>
              <p className="text-sm text-muted">{t.years}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
