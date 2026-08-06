'use client';

import Image from 'next/image';
import { mediaUrl } from '@/shared/lib/api';

type ScaleKey = 'noiseLevel' | 'cleanliness' | 'sleepSchedule' | 'socialLevel' | 'workFromHome';

interface VibeScaleBarProps {
  scaleKey: ScaleKey;
  value: number | null;
  /** Фото владельца значения — маркер на шкале едет этой аватаркой. */
  photo?: string | null;
}

const SCALE_META: Record<ScaleKey, { label: string; icon: string }> = {
  noiseLevel:    { icon: '🔇', label: 'Тишина дома' },
  cleanliness:   { icon: '🧹', label: 'Чистота' },
  sleepSchedule: { icon: '🌙', label: 'Режим сна' },
  socialLevel:   { icon: '💬', label: 'Общение' },
  workFromHome:  { icon: '💻', label: 'Дома / работа' },
};

// Трек — непрерывный градиент «низкое → высокое» значение (лавандовый →
// персиковый → акцентный розовый), маркер — аватарка вместо процента: тот же
// язык, что и на референсе (два аватара на шкале «неважно—важно»), но с одним —
// своим значением, без сравнения с собой.
// Низ шкалы — лаванда, а не бледно-розовый: акцент теперь розовый, и на
// розовом низе шкала перестала бы читаться направленно (розовый → розовый).
const TRACK_GRADIENT =
  'linear-gradient(90deg, var(--lavender) 0%, var(--peach) 50%, var(--accent) 100%)';

export function VibeScaleBar({ scaleKey, value, photo }: VibeScaleBarProps) {
  if (value === null) return null;

  const { icon, label } = SCALE_META[scaleKey];
  const pct = Math.round(value * 100);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-black text-[#14140f]">
        {icon} {label}
      </span>
      <div className="relative h-2 rounded-full border-glass" style={{ background: TRACK_GRADIENT }}>
        <div
          className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white shadow-glass transition-[left] duration-500"
          style={{ left: `${pct}%` }}
        >
          {photo ? (
            <Image src={mediaUrl(photo)} alt="" fill sizes="28px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-white/60" />
          )}
        </div>
      </div>
    </div>
  );
}
