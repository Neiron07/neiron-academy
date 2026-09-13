'use client';

import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLang } from '@/lib/i18n/LanguageContext';

export function LandingHeader() {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-30 border-b border-purple-mid/60 bg-bg/90 backdrop-blur-0">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <span className="font-display text-lg font-bold text-white">Neiron Academy</span>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Link href="/login" className="px-2 text-sm font-medium text-lavender hover:text-white">
            {t.header.login}
          </Link>
        </div>
      </div>
    </header>
  );
}
