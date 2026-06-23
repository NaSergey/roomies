'use client';

type ScaleKey = 'noiseLevel' | 'cleanliness' | 'sleepSchedule' | 'socialLevel' | 'workFromHome';

interface VibeScaleBarProps {
  scaleKey: ScaleKey;
  value: number | null;
}

const SCALE_META: Record<ScaleKey, { label: string; icon: string }> = {
  noiseLevel:    { icon: '🔇', label: 'Тишина дома' },
  cleanliness:   { icon: '🧹', label: 'Чистота' },
  sleepSchedule: { icon: '🌙', label: 'Режим сна' },
  socialLevel:   { icon: '💬', label: 'Общение' },
  workFromHome:  { icon: '💻', label: 'Дома / работа' },
};

export function VibeScaleBar({ scaleKey, value }: VibeScaleBarProps) {
  if (value === null) return null;

  const { icon, label } = SCALE_META[scaleKey];
  const fillColor =
    value >= 0.71 ? 'bg-[#c8f36a]' : value >= 0.4 ? 'bg-[#ffd7a8]' : 'bg-[#ffd9e0]';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-black text-[#14140f] w-[100px] shrink-0">
        {icon} {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[#f0efe9] border-2 border-black overflow-hidden">
        <div
          className={`${fillColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-xs font-black text-[#14140f] w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
