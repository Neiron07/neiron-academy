import Image from 'next/image';
import { STUDENT_WORKS } from '@/lib/site-content';

/** Фото — стоковые, замените на реальные скриншоты проектов учеников. Самая конверсионная секция. */
export function StudentWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Работы учеников</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STUDENT_WORKS.map((w) => (
          <div key={w.title} className="overflow-hidden rounded-2xl border border-purple-mid bg-purple-deep p-3">
            <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-purple-mid/25">
              <Image
                src={w.photo}
                alt={w.title}
                width={400}
                height={225}
                className="size-full object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
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
