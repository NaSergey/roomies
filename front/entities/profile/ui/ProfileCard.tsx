'use client';

import Image from 'next/image';
import { memo, type ReactNode } from 'react';
import type { RoomieProfile } from '../model/types';

interface ProfileCardProps {
  profile: RoomieProfile;
  priority?: boolean;
  overlay?: ReactNode;
}

const TAG_COLORS = ['bg-[#c8f36a]', 'bg-[#a8d8ff]', 'bg-[#ffb8d4]'];
const HARD_SHADOW = 'shadow-[4px_4px_0_rgba(20,20,15,0.9)]';

const SCORE_META = [
  { bg: 'bg-[#ffd6e8]', icon: '💎', rot: '-rotate-6' },
  { bg: 'bg-[#fff3a0]', icon: '⭐', rot: 'rotate-3' },
  { bg: 'bg-[#ffd6e8]', icon: '🕐', rot: '-rotate-2' },
];

const SCALE_LABELS: Record<string, string> = {
  cleanliness:   'Чистота',
  sleepSchedule: 'Режим',
  socialLevel:   'Общение',
  noiseLevel:    'Шум',
  workFromHome:  'Дома',
};

function ProfileCardBase({ profile, priority, overlay }: ProfileCardProps) {
  const [mainPhoto, ...thumbPhotos] = profile.photos;
  const tagLabels = profile.vibeTags.map((t) => t.label);
  const matchPct  = Math.round(profile.matchScore * 100);

  const scores = profile.lifestyleScales
    ? (Object.entries(profile.lifestyleScales) as [string, number | null][])
        .filter(([, v]) => v != null)
        .slice(0, 3)
        .map(([key, v]) => ({ label: SCALE_LABELS[key] ?? key, pct: Math.round((v as number) * 100) }))
    : [];

  return (
    <div className="relative h-full w-full">
      {/* SVG-фильтр рваного края */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <filter id="torn" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="4" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── Фото на всю карточку (рваная рамка + фото) ── */}
      <div className="absolute inset-0 [filter:url(#torn)]">
        <div className="h-full w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#ffb8d4_0%,#a8d8ff_33%,#fdf4a0_66%,#ffb8d4_100%)] p-[10px]">
          <div className="relative h-full w-full overflow-hidden rounded-[10px]">
            {mainPhoto ? (
              <Image
                src={mainPhoto}
                alt={profile.name}
                fill
                sizes="(max-width: 480px) 100vw, 480px"
                className="pointer-events-none select-none object-cover"
                priority={priority}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl">🏠</div>
            )}
          </div>
        </div>
      </div>

      {/* Match-бейдж (стикер) */}
      <span className={`absolute left-0 top-0 z-[2] -rotate-[5deg] rounded-xl border-2 border-black bg-accent px-2 py-1 text-sm font-black text-[#14140f] ${HARD_SHADOW}`}>
        ★ {matchPct}%
      </span>

      {/* Верификация — стикер */}
      <div
        className={`absolute right-0 top-0 z-[2] flex h-10 w-10 rotate-[6deg] items-center justify-center rounded-full border-2 border-black bg-[#a8d8ff] text-[#14140f] ${HARD_SHADOW}`}
      >
        <CheckIcon />
      </div>

      {/* Полоска миниатюр справа */}
      {thumbPhotos.length > 0 && (
        <div className="absolute right-3 top-14 z-[3] flex flex-col gap-1.5">
          {thumbPhotos.slice(0, 3).map((src, i) => (
            <div
              key={i}
              className="relative h-[66px] w-[54px] overflow-hidden rounded-lg border-2 border-black shadow-[3px_3px_0_rgba(20,20,15,0.9)]"
            >
              <Image src={src} alt="" fill sizes="54px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-3 bottom-24 z-[4] flex flex-col gap-2">
        {/* Скоры — наклейки вертикальной колонкой справа */}
        {scores.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            {scores.map((s, i) => {
              const meta = SCORE_META[i] ?? SCORE_META[0];
              return (
                <span
                  key={s.label}
                  className={`flex items-center gap-0.5 rounded-md border-2 border-black px-1.5 py-0.5 text-[11px] font-black leading-none text-[#14140f] shadow-[2px_2px_0_rgba(20,20,15,0.9)] ${meta.rot} ${meta.bg}`}
                >
                  <span>{meta.icon}</span>
                  <span>{s.pct}%</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Инфо — стеклянная панель, сливается с фото */}
        <div className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(to_top,rgba(12,12,10,0.80)_0%,rgba(12,12,10,0.46)_100%)] px-4 py-3 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.55)] backdrop-blur-md">
          {/* Имя + возраст — на всю ширину панели */}
          <h2 className="break-words text-3xl font-black leading-none text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.55)]">
            {profile.name}
            {profile.age != null ? (
              <span className="ml-1.5 font-age text-xl font-extrabold text-white/75">
                {profile.age}
              </span>
            ) : null}
          </h2>

          {/* Теги — цветные наклейки из палитры рамки */}
          {tagLabels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {tagLabels.slice(0, 3).map((label, i) => (
                <span
                  key={label}
                  className={`rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {overlay}
    </div>
  );
}

// memo: при ререндере родителя (смена фазы свайпа) карта не пересобирает тяжёлый
// SVG-фильтр, если profile/priority/overlay не изменились (overlay стабилен — useMemo).
export const ProfileCard = memo(ProfileCardBase);

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
