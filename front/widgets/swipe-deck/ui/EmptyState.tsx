'use client';

import { Button } from '@/shared/ui/button';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-black bg-white p-8 text-center shadow-[4px_4px_0_rgba(20,20,15,0.9)]">
      <div className="text-5xl">✨</div>
      <h3 className="text-xl font-black text-(--text)">
        Анкеты закончились
      </h3>
      <p className="text-sm text-muted">
        Загляни позже — мы подбираем новых соседей под твой вайб.
      </p>
      <Button onClick={onReset} className="mt-2 px-6 py-2.5 text-sm">
        Начать заново
      </Button>
    </div>
  );
}
