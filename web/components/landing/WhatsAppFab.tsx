'use client';

import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/constants';

export function WhatsAppFab() {
  return (
    <a
      href={waLink('Здравствуйте! Хочу узнать про курсы для ребёнка')}
      target="_blank"
      rel="noreferrer"
      aria-label="Написать в WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-purple text-white shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)] transition-transform hover:scale-105"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
