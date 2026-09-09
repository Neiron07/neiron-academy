import { HOW_IT_WORKS } from '@/lib/site-content';

/** Единственное место на лендинге, где уместна нумерация — это настоящая последовательность. */
export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Как проходит обучение</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s) => (
          <div key={s.step}>
            <span className="flex size-10 items-center justify-center rounded-full bg-purple font-display text-sm font-bold text-white">
              {String(s.step).padStart(2, '0')}
            </span>
            <h3 className="mt-3 font-medium text-white">{s.title}</h3>
            <p className="mt-1 text-sm text-lavender">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
