'use client';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 rounded-4xl border border-black/5 bg-surface p-8 text-center"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="text-5xl">✨</div>
      <h3 className="text-xl font-semibold text-(--text)">
        Анкеты закончились
      </h3>
      <p className="text-sm text-muted">
        Загляни позже — мы подбираем новых соседей под твой вайб.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-(--text-on-accent)"
        style={{ boxShadow: 'var(--shadow-button)' }}
      >
        Начать заново
      </button>
    </div>
  );
}
