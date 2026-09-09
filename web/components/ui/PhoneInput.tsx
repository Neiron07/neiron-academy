'use client';

/** Маска +7 (___) ___-__-__ в интерфейсе, на бэкенд уходит как есть — там нормализуется. */
function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
  const p1 = d.slice(1, 4);
  const p2 = d.slice(4, 7);
  const p3 = d.slice(7, 9);
  const p4 = d.slice(9, 11);
  let out = '+7';
  if (p1) out += ` (${p1}`;
  if (p1.length === 3) out += ')';
  if (p2) out += ` ${p2}`;
  if (p3) out += `-${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

export function PhoneInput({
  value,
  onChange,
  label = 'Телефон',
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-lavender">{label}</span>
      <input
        type="tel"
        inputMode="numeric"
        autoFocus={autoFocus}
        placeholder="+7 (___) ___-__-__"
        value={value ? formatPhone(value) : ''}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="h-12 w-full rounded-xl border border-purple-mid bg-transparent px-4 text-base text-white placeholder:text-muted outline-none focus:border-purple"
      />
    </label>
  );
}
