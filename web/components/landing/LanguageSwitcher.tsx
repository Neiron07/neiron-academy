'use client';

import { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { LANGS } from '@/lib/i18n/dictionaries';
import { useLang } from '@/lib/i18n/LanguageContext';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Выбрать язык"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-lavender transition-colors hover:bg-white/5 hover:text-white"
      >
        <Languages className="size-4" aria-hidden />
        {t.languageNames[lang]}
      </button>
      <div
        className={`absolute right-0 top-full z-40 mt-2 w-40 origin-top-right rounded-xl border border-purple-mid bg-purple-deep p-1 shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)] transition-all duration-150 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => {
              setLang(l);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-lavender transition-colors hover:bg-white/5 hover:text-white"
          >
            {t.languageNames[l]}
            {l === lang && <Check className="size-3.5 text-purple" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  );
}
