/** Единственное разрешённое радиальное свечение на странице. Используется дважды на весь продукт. */
export function Glow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: 'radial-gradient(circle, rgba(116,68,212,0.55) 0%, rgba(116,68,212,0) 70%)' }}
    />
  );
}
