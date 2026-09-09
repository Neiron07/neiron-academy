import Link from 'next/link';
import { Glow } from '@/components/ui/Glow';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      <Glow className="left-1/2 top-1/3 size-[420px] -translate-x-1/2 -translate-y-1/2" />
      <div className="relative z-10 max-w-lg">
        <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
          IT-школа, где ребёнок делает свой первый проект
        </h1>
        <p className="mt-4 text-lg text-lavender">
          Scratch, Roblox Studio, Python и нейросети. Группы до 6 человек, 3 занятия в неделю. Highvill, Астана.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          <Link href="#заявка">
            <Button size="lg">Записаться на пробный урок</Button>
          </Link>
          <p className="text-sm text-muted">Первое занятие — бесплатно</p>
        </div>
      </div>
    </section>
  );
}
