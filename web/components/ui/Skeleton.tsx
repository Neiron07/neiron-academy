export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-purple-mid/30 ${className}`} />;
}

/** Скелетон карточки урока/строки списка — повторяет раскладку контента. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-purple-mid bg-purple-deep p-4">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-2xl border border-purple-mid bg-purple-deep p-5">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
