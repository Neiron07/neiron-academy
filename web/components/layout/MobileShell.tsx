/**
 * maxWidthClass переопределяет ширину для отдельных разделов (например, «Задачи»,
 * которому тесно в стандартных 480px на большом экране) — по умолчанию как раньше,
 * ничего не меняется ни на мобильном, ни на остальных страницах.
 */
export function MobileShell({
  children,
  withBottomNav = true,
  maxWidthClass = 'max-w-[480px]',
}: {
  children: React.ReactNode;
  withBottomNav?: boolean;
  maxWidthClass?: string;
}) {
  return (
    <div className={`mx-auto min-h-dvh w-full px-4 pt-4 ${maxWidthClass}`}>
      <div className={withBottomNav ? 'pb-24' : 'pb-8'}>{children}</div>
    </div>
  );
}
