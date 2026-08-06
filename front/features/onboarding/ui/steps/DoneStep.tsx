'use client';

import { useEffect, useState } from 'react';
import { haptic, hapticNotify } from '@/shared/lib/telegram';
import { Button } from '@/shared/ui/Button';

interface DoneStepProps {
  onComplete: () => void;
}

export function DoneStep({ onComplete }: DoneStepProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    hapticNotify('success');
    // Trigger scale animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleComplete() {
    haptic('light');
    onComplete();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      {/* Checkmark circle with spring entry animation */}
      <div
        className={[
          'w-20 h-20 rounded-full border-glass bg-accent-glass backdrop-glass flex items-center justify-center mx-auto shadow-glass',
          'transition-transform duration-[400ms]',
          visible ? 'scale-100' : 'scale-0',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-(--text-on-accent)"
          aria-hidden="true"
        >
          <polyline points="4 12 9 17 20 7" />
        </svg>
      </div>

      <h1 className="text-4xl font-black text-(--text) mt-6">Профиль создан!</h1>

      <p className="text-base text-muted mt-3">
        Скоро здесь появятся твои совпадения
      </p>

      <p className="text-sm text-muted mt-2">
        Пока покажем анкеты — смотри, кто рядом
      </p>

      <Button onClick={handleComplete} className="mt-8 h-14 w-full text-base">
        Смотреть анкеты
      </Button>
    </div>
  );
}
