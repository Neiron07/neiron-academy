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

function LeadFormInner() {
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
    if (name.trim().length < 2) return setError('Введите имя');
    if (phone.replace(/\D/g, '').length < 10) return setError('Введите номер телефона');

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
      setError('Не удалось отправить. Попробуйте ещё раз или напишите в WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-white" aria-hidden />
        <p className="font-display text-lg font-semibold text-white">Заявка принята</p>
        <p className="mt-2 text-lavender">{done}</p>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4">
      <Input label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
      <PhoneInput value={phone} onChange={setPhone} />
      <Input label="Возраст ребёнка" type="number" min={4} max={18} value={childAge} onChange={(e) => setChildAge(e.target.value)} />
      {error && <p className="text-sm text-white">{error}</p>}
      <Button type="submit" fullWidth size="lg" loading={loading}>
        Записаться на пробный урок
      </Button>
    </form>
  );
}

export function LeadFormSection() {
  return (
    <section id="заявка" className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-3 text-center font-display text-3xl font-semibold text-white">Записаться на пробный урок</h2>
      <p className="mb-8 text-center text-lavender">Свяжемся в течение рабочего дня. Обычно быстрее.</p>
      <Suspense>
        <LeadFormInner />
      </Suspense>
    </section>
  );
}
