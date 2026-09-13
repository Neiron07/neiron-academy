'use client';

import { MessageCircle } from 'lucide-react';
import { SITE } from '@/lib/site-content';
import { waLink } from '@/lib/constants';
import { useLang } from '@/lib/i18n/LanguageContext';

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-purple-mid/60 px-5 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <span className="font-display text-lg font-bold text-white">Neiron Academy</span>
        <p className="text-sm text-lavender">{SITE.addressLine}</p>
        <div className="flex items-center gap-4 text-sm">
          <a href={SITE.instagram} target="_blank" rel="noreferrer" className="text-lavender transition-colors hover:text-white">
            {t.footer.instagram}
          </a>
          <a
            href={waLink(t.whatsapp.footerMessage)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-lavender transition-colors hover:text-white"
          >
            <MessageCircle className="size-4" aria-hidden /> {t.footer.whatsapp}
          </a>
        </div>
        <p className="text-xs text-muted">© {new Date().getFullYear()} Neiron Academy</p>
      </div>
    </footer>
  );
}
