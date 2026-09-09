/** Монета: обводка white, заливка purple — самое яркое, что есть на экране. */
export function CoinIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="var(--color-purple)" stroke="var(--color-white)" strokeWidth="1.5" />
      <path
        d="M12 7v10M9.5 9.3c0-1 1-1.8 2.5-1.8s2.5.7 2.5 1.6c0 2.4-5 1.2-5 3.6 0 .9 1 1.6 2.5 1.6s2.5-.8 2.5-1.8"
        stroke="var(--color-white)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
