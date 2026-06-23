'use client';

// Три «прыгающие» точки — единый индикатор загрузки. Дублировался в HomeView,
// ProfileView и SwipeDeck. Обёртку-центрирование оставляем на месте вызова.
export function Loader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
