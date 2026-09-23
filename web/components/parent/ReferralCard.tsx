import { Gift, Share2 } from 'lucide-react';

const GOAL = 3;
const FIRST_FRIEND_DISCOUNT = '15 000 ₸';

/**
 * Единственное яркое пятно на фиолетовом фоне кабинета — сознательно вне
 * фирменной палитры, по прямому запросу («выделяющийся раздел яркого цвета»),
 * тот же приём, что и у TRIAL_CLASSES/EVENT_CLASSES в календаре.
 */
function progressCopy(paid: number): { title: string; body: string } {
  if (paid >= GOAL) return { title: 'Готово!', body: 'Следующий модуль для вашего ребёнка — бесплатно' };
  if (paid === 2) return { title: '2 из 3', body: 'Остался один друг — и следующий модуль бесплатно 🎉' };
  if (paid === 1) return { title: '1 из 3', body: 'До бесплатного модуля осталось 2 друга' };
  return { title: '0 из 3', body: `Пригласите первого друга — и получите ${FIRST_FRIEND_DISCOUNT} скидки` };
}

export function ReferralCard({ paidFriends }: { paidFriends: number }) {
  const paid = Math.min(paidFriends, GOAL);
  const { title, body } = progressCopy(paid);
  const shareText = `Привет! Мой ребёнок учится в Neiron Academy — крутая школа программирования для детей. Если тоже интересно, напишите школе и скажите, что вас пригласили — вам дадут скидку 10 000 ₸ на первый модуль!`;

  return (
    <div className="rounded-2xl border border-[#F472B6]/40 bg-gradient-to-br from-[#F472B6] to-[#A855F7] p-5 text-white shadow-[0_8px_30px_-8px_rgba(244,114,182,0.5)]">
      <div className="mb-1 flex items-center gap-2">
        <Gift className="size-5 shrink-0" aria-hidden />
        <h2 className="font-display text-lg font-bold">Приглашайте друзей — учитесь бесплатно</h2>
      </div>
      <p className="mb-4 text-sm text-white/90">
        Ваш друг получит скидку 10 000 ₸ на первый модуль, а вы — скидку на следующий. Пригласите троих — следующий модуль бесплатно.
      </p>

      <div className="mb-3 rounded-xl bg-white/15 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-display text-2xl font-bold">{title}</p>
          <div className="flex gap-1.5">
            {Array.from({ length: GOAL }, (_, i) => (
              <span
                key={i}
                className={`size-3.5 rounded-full ${i < paid ? 'bg-white' : 'bg-white/25'}`}
                aria-hidden
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-white/90">{body}</p>
      </div>

      {paid > 0 && paid < GOAL && (
        <p className="mb-4 font-display text-lg font-semibold">
          Ваша скидка на следующий модуль: {FIRST_FRIEND_DISCOUNT}
        </p>
      )}

      <a
        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-medium text-[#A855F7] transition-colors hover:bg-white/90"
      >
        <Share2 className="size-4" aria-hidden /> Пригласить друга
      </a>
    </div>
  );
}
