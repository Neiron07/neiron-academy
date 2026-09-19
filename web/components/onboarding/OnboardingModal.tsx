'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export interface OnboardingSlide {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Полноэкранная карусель-инструкция при первом визите. Один раз на аккаунт. */
export function OnboardingModal({ slides }: { slides: OnboardingSlide[] }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const markSeen = useMutation({
    mutationFn: () => api.post('/auth/onboarding/seen'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const isLast = step === slides.length - 1;
  const slide = slides[step]!;
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/90 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-3xl border border-purple bg-purple-deep p-6 shadow-[0_20px_60px_-10px_rgba(21,9,48,0.6)]">
        <div className="mb-5 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-purple/15 text-purple">
            <Icon className="size-8" aria-hidden />
          </div>
        </div>
        <h2 className="text-center font-display text-lg font-semibold text-white">{slide.title}</h2>
        <p className="mt-2 text-center text-sm text-lavender">{slide.text}</p>

        <div className="mt-6 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-purple' : 'w-1.5 bg-purple-mid'}`} />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Назад
            </Button>
          )}
          <Button
            fullWidth
            size="lg"
            loading={isLast && markSeen.isPending}
            onClick={() => (isLast ? markSeen.mutate() : setStep((s) => s + 1))}
          >
            {isLast ? 'Понятно, начать' : 'Далее'}
            {!isLast && <ChevronRight className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  );
}
