'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** L2-модалка: purple-deep + рамка purple + тень из фирменного тёмного, не чёрного. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-bg/70"
      />
      <div className="relative w-full max-w-md rounded-t-3xl border border-purple bg-purple-deep p-5 shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)] sm:rounded-3xl motion-safe:animate-[sheet-in_0.2s_ease-out]">
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-display text-lg font-semibold text-white">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="ml-auto flex size-9 items-center justify-center rounded-full text-lavender hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes sheet-in {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
