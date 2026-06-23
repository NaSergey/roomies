'use client';

import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
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
    </Card>
  );
}
