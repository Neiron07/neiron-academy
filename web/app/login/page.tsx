'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { ParentLoginForm } from '@/components/auth/ParentLoginForm';
import { StaffLoginForm } from '@/components/auth/StaffLoginForm';

type Tab = 'student' | 'parent' | 'staff';

const TABS: { id: Tab; label: string }[] = [
  { id: 'student', label: 'Ученик' },
  { id: 'parent', label: 'Родитель' },
  { id: 'staff', label: 'Сотрудник' },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('student');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <span className="font-display text-2xl font-bold text-white">Neiron Academy</span>
        <p className="mt-1 text-sm text-lavender">Вход в личный кабинет</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-purple-mid p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple text-white' : 'text-lavender hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'student' && <StudentLoginForm />}
      {tab === 'parent' && <ParentLoginForm />}
      {tab === 'staff' && <StaffLoginForm />}

      <p className="mt-8 text-center text-sm text-muted">
        Ваш ребёнок ещё не учится у нас?{' '}
        <Link href="/#заявка" className="text-lavender hover:text-white">
          Оставить заявку
        </Link>
      </p>
    </div>
  );
}
