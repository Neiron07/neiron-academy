'use client';

import { use, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, AlertCircle, Mail, Star, Camera } from 'lucide-react';
import { api } from '@/lib/api';
import type { ParentOverview, ParentReferrals } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ReferralCard } from '@/components/parent/ReferralCard';
import { waLink } from '@/lib/constants';
import { SITE } from '@/lib/site-content';
import { formatNumber } from '@/lib/format';
import { getParentDailyMessage } from '@/lib/motivational-messages';

export default function ParentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ['parent-overview', id],
    queryFn: () => api.get<ParentOverview>(`/parent/children/${id}/overview`),
  });
  const { data: referrals } = useQuery({
    queryKey: ['parent-referrals'],
    queryFn: () => api.get<ParentReferrals>('/parent/referrals'),
  });

  const letter = useMemo(
    () => (data ? getParentDailyMessage(data.child.full_name, data.child.id) : ''),
    [data],
  );

  if (isLoading || !data) return <SkeletonCard />;

  return (
    <div className="space-y-3">
      <Card className="border-purple bg-purple/10">
        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 size-5 shrink-0 text-purple" aria-hidden />
          <div>
            <p className="text-sm font-medium text-lavender">Письмо дня</p>
            <p className="mt-1 text-white">{letter}</p>
          </div>
        </div>
      </Card>

      {data.subscription.low && (
        <Card className="border-white/60">
          <div className="mb-2 flex items-center gap-1.5 text-white">
            <AlertCircle className="size-4" aria-hidden />
            <span className="font-medium">Осталось {data.subscription.lessons_left} занятия по абонементу</span>
          </div>
          <a href={waLink(`Здравствуйте! Хочу продлить абонемент для ${data.child.full_name}`)} target="_blank" rel="noreferrer">
            <Button size="sm">Продлить</Button>
          </a>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-sm text-lavender">Посещаемость</p>
          <p className="font-display text-2xl font-bold text-white">{data.attendance.percent}%</p>
          <p className="text-sm text-muted">
            {data.attendance.attended} из {data.attendance.total} уроков
          </p>
        </Card>
        <Card>
          <p className="text-sm text-lavender">Абонемент</p>
          <p className="font-display text-2xl font-bold text-white">{data.subscription.lessons_left}</p>
          <p className="text-sm text-muted">занятий осталось</p>
        </Card>
      </div>

      <Card className="flex items-center justify-between">
        <p className="text-sm text-lavender">Коины ребёнка</p>
        <span className="flex items-center gap-1.5 font-display text-xl font-bold text-white">
          <CoinIcon className="size-5" />
          {formatNumber(data.coins)}
        </span>
      </Card>

      {data.topicsCovered.length > 0 && (
        <Card>
          <p className="mb-2 text-sm text-lavender">Освоил недавно</p>
          <div className="flex flex-wrap gap-1.5">
            {data.topicsCovered.slice(0, 8).map((t) => (
              <span key={t.title} className="rounded-full border border-purple-mid px-3 py-1 text-sm text-white">
                {t.title}
              </span>
            ))}
          </div>
        </Card>
      )}

      {data.achievements.length > 0 && (
        <Card>
          <p className="mb-2 text-sm text-lavender">Последние достижения</p>
          <div className="space-y-1.5">
            {data.achievements.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white">{a.title}</span>
                <span className="text-muted">{a.tier}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <a href={waLink(`Здравствуйте! Вопрос по ${data.child.full_name}`)} target="_blank" rel="noreferrer" className="block">
        <Button variant="secondary" fullWidth>
          <MessageCircle className="size-4" aria-hidden /> Написать в школу
        </Button>
      </a>

      {referrals && <ReferralCard paidFriends={referrals.paidFriends} />}

      <a href={SITE.twoGisReviewsUrl} target="_blank" rel="noreferrer" className="block">
        <Button variant="secondary" fullWidth>
          <Star className="size-4" aria-hidden /> Оставить отзыв о школе
        </Button>
      </a>
      <a href={SITE.instagram} target="_blank" rel="noreferrer" className="block">
        <Button variant="secondary" fullWidth>
          <Camera className="size-4" aria-hidden /> Подписаться в Instagram
        </Button>
      </a>
    </div>
  );
}
