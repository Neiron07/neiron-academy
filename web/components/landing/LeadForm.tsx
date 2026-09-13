'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { trackLead } from '@/lib/analytics';
import { useLang } from '@/lib/i18n/LanguageContext';
import type { Dictionary } from '@/lib/i18n/dictionaries';

function LeadFormInner({ t }: { t: Dictionary }) {
  const params = useSearchParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [childAge, setChildAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError(t.leadForm.errorName);
    if (phone.replace(/\D/g, '').length < 10) return setError(t.leadForm.errorPhone);

    setLoading(true);
    try {
      const utm: Record<string, string> = {};
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const v = params.get(key);
        if (v) utm[key] = v;
      }
      const res = await api.post<{ message: string }>('/public/leads', {
        name: name.trim(),
        phone,
        child_age: childAge ? Number(childAge) : undefined,
        course_slug: params.get('course') ?? undefined,
        source: 'landing',
        utm,
      });
      trackLead();
      setDone(res.message);
    } catch {
      setError(t.leadForm.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center animate-[fade-in-up_0.5s_ease-out]">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-white" aria-hidden />
        <p className="font-display text-lg font-semibold text-white">{t.leadForm.successTitle}</p>
        <p className="mt-2 text-lavender">{done}</p>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4">
      <Input label={t.leadForm.nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
      <PhoneInput value={phone} onChange={setPhone} />
      <Input label={t.leadForm.ageLabel} type="number" min={4} max={18} value={childAge} onChange={(e) => setChildAge(e.target.value)} />
      {error && <p className="text-sm text-white">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={loading} className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
        {t.leadForm.submit}
      </Button>
    </form>
  );
}

export function LeadFormSection() {
  const { t } = useLang();
  return (
    <section id="заявка" className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">{t.leadForm.title}</h2>
      <p className="mb-8 text-center text-lavender">{t.leadForm.subtitle}</p>
      <Suspense>
        <LeadFormInner t={t} />
      </Suspense>
    </section>
  );
}
