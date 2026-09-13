'use client';

import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/constants';
import { useLang } from '@/lib/i18n/LanguageContext';

export function WhatsAppFab() {
  const { t } = useLang();
  return (
    <a
      href={waLink(t.whatsapp.fabMessage)}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-purple text-white shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)] transition-transform hover:scale-105 animate-[fade-in-up_0.6s_ease-out_0.4s_backwards]"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
