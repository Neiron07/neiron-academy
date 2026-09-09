export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative flex size-14 items-center justify-center" role="status" aria-label="Загрузка">
        <div className="absolute inset-0 rounded-full border-2 border-purple-mid" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white motion-reduce:animate-none" />
        <div className="size-3 rounded-full bg-purple" />
      </div>
      <p className="text-sm text-lavender">Загрузка…</p>
    </div>
  );
}
