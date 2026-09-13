'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, LANGS, type Dictionary, type Lang } from './dictionaries';

const STORAGE_KEY = 'neiron-landing-lang';

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dictionary } | null>(null);

function isLang(v: string | null): v is Lang {
  return !!v && (LANGS as string[]).includes(v);
}

/** Язык лендинга живёт только в localStorage браузера — кабинеты этот контекст не используют. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isLang(stored)) setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }

  const value = useMemo(() => ({ lang, setLang, t: dictionaries[lang] }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
