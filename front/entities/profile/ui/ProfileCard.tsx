'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import type { RoomieProfile } from '../model/types';

interface ProfileCardProps {
  profile: RoomieProfile;
  priority?: boolean;
  /** Слот для оверлеев фичей (LIKE/NOPE-стикеры свайпа и т.п.) */
  overlay?: ReactNode;
}

// Чистая визуальная карточка профиля — без жестов и состояния. Стиль по
// референсу For You: большой радиус, минимум текста поверх фото (имя + пин),
// score-пилюля в углу. Bio/теги вынесены на детальный экран.
export function ProfileCard({ profile, priority, overlay }: ProfileCardProps) {
  const photoSrc = profile.photos[0] ?? '';
  const budgetLabel =
    profile.budgetMin && profile.budgetMax
      ? `${(profile.budgetMin / 1000).toFixed(0)}–${(profile.budgetMax / 1000).toFixed(0)}к ₽`
      : '';
  const tagLabels = profile.vibeTags.map((t) => t.label);
  const firstDistrict = profile.districts[0]?.name ?? '';

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-4xl bg-surface-2"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {photoSrc ? (
        <Image
          src={photoSrc}
          alt={profile.name}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-cover select-none pointer-events-none"
          priority={priority}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2 text-6xl">
          🏠
        </div>
      )}

      {/* Тонкий градиент только в нижней четверти — фото остаётся читаемым */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* Match-пилюля поверх — лаймовый акцент */}
      <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-(--text-on-accent)">
        {Math.round(profile.matchScore * 100)}% match
      </div>

      {overlay}

      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h2 className="text-3xl font-bold leading-tight drop-shadow-sm">
          {profile.name}
        </h2>
        {firstDistrict && (
          <p className="mt-1 flex items-center gap-1 text-sm text-white/90 drop-shadow-sm">
            <PinIcon />
            {firstDistrict}
          </p>
        )}
        {budgetLabel && (
          <p className="mt-1 text-xs text-white/75 drop-shadow-sm">{budgetLabel}</p>
        )}
        {tagLabels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagLabels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white/90"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
