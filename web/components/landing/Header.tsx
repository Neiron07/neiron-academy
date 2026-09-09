import Link from 'next/link';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-purple-mid/60 bg-bg/90 backdrop-blur-0">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <span className="font-display text-lg font-bold text-white">Neiron Academy</span>
        <Link href="/login" className="text-sm font-medium text-lavender hover:text-white">
          Войти
        </Link>
      </div>
    </header>
  );
}
