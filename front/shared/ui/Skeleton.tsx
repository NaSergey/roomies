'use client';

// Заглушка на время загрузки: то же стекло, что у чипов и полей, с бегущим
// бликом вместо серой пульсации (см. skeleton-glass в globals.css).
// Форму задаёт вызывающий — размеры и скругление у списка районов и у ряда
// тегов разные.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton-glass ${className}`} />;
}

/** Несколько одинаковых заглушек подряд — самый частый случай. */
export function SkeletonGroup({
  count,
  className = '',
  wrapperClassName = '',
}: {
  count: number;
  className?: string;
  wrapperClassName?: string;
}) {
  return (
    <div className={wrapperClassName} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
