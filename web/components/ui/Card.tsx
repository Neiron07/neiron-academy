import { HTMLAttributes } from 'react';

/** L1-поверхность: заливка purple-deep читается только благодаря рамке — без неё разница с фоном 1.15:1. */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-purple-mid bg-purple-deep p-4 ${className}`}
      {...rest}
    />
  );
}

/** Инверсия — критично, требует действия. Не чаще двух раз на экран. */
export function InvertCard({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-white p-4 text-bg ${className}`} {...rest} />;
}
