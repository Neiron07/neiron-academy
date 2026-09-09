export function MobileShell({ children, withBottomNav = true }: { children: React.ReactNode; withBottomNav?: boolean }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pt-4">
      <div className={withBottomNav ? 'pb-24' : 'pb-8'}>{children}</div>
    </div>
  );
}
