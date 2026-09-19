'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, User } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeacherProfile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export function TeacherProfileView({ teacherId }: { teacherId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: () => api.get<TeacherProfile>(`/teacher/profile/${teacherId}`),
  });

  if (isLoading) return <SkeletonCard />;
  if (!data) return <EmptyState icon={User} title="Преподаватель не найден" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        {data.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photo_url}
            alt={data.full_name}
            className="size-28 rounded-full border-2 border-purple object-cover"
          />
        ) : (
          <div className="flex size-28 items-center justify-center rounded-full border-2 border-purple-mid bg-purple/15 text-purple">
            <User className="size-12" aria-hidden />
          </div>
        )}
        <h1 className="mt-3 font-display text-xl font-semibold text-white">{data.full_name}</h1>
        {data.experience && <p className="mt-1 text-sm text-lavender">{data.experience}</p>}
      </div>

      {data.bio && (
        <Card>
          <p className="mb-1.5 text-sm font-medium text-lavender">О преподавателе</p>
          <p className="whitespace-pre-line text-white">{data.bio}</p>
        </Card>
      )}

      {data.achievements.length > 0 && (
        <Card>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-lavender">
            <Award className="size-4" aria-hidden /> Достижения
          </p>
          <ul className="space-y-1.5">
            {data.achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-white">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-purple" />
                {a}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!data.bio && data.achievements.length === 0 && !data.experience && (
        <p className="text-center text-sm text-muted">Преподаватель пока не заполнил профиль</p>
      )}
    </div>
  );
}
