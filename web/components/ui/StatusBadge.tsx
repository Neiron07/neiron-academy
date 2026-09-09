import { Check, Clock, X, AlertTriangle, type LucideIcon } from 'lucide-react';

export type Tone = 'positive' | 'neutral' | 'negative' | 'critical';

const toneClass: Record<Tone, string> = {
  positive: 'bg-purple text-white',
  neutral: 'border border-purple-mid text-lavender',
  negative: 'border border-muted text-muted',
  critical: 'bg-white text-bg',
};

const defaultIcon: Record<Tone, LucideIcon> = {
  positive: Check,
  neutral: Clock,
  negative: X,
  critical: AlertTriangle,
};

export function StatusBadge({
  tone,
  label,
  icon,
  className = '',
}: {
  tone: Tone;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const Icon = icon ?? defaultIcon[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${toneClass[tone]} ${className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
