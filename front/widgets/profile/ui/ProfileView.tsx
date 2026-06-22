'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { VibeScaleBar } from '@/shared/ui/vibe-scale-bar';
import { RulesSection } from '@/shared/ui/rules-section';
import { RoomieScoreCard } from './RoomieScoreCard';
import { ProfileEditSheet } from './ProfileEditSheet';

const SCENARIO_LABELS: Record<string, string> = {
  looking_housing_roomie: 'Ищет жильё + соседа',
  has_housing_seeking_roomie: 'Сдаёт комнату',
  looking_roomie_only: 'Ищет соседа',
  flexible: 'Любой вариант',
};

const TAG_COLORS = ['bg-[#c8f36a]', 'bg-[#a8d8ff]', 'bg-[#ffb8d4]'];

export function ProfileView() {
  const { data: profile, isLoading, isError, error } = useProfileQuery();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    const msg = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="text-sm text-muted">{msg}</p>
      </div>
    );
  }

  const [mainPhoto, ...thumbPhotos] = profile.photos;
  const budgetStr = [profile.budgetMin, profile.budgetMax].filter((v) => v != null).join('–') + ' ₽';

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* Avatar + header */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-black shadow-[3px_3px_0_rgba(20,20,15,0.9)]">
            {mainPhoto ? (
              <Image src={mainPhoto} alt={profile.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f0efe9] text-3xl">🏠</div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-(--text)">
              {profile.name}
              {profile.age != null && (
                <span className="ml-1.5 text-lg font-bold text-muted">{profile.age}</span>
              )}
            </h1>
            <p className="text-xs text-muted">
              {SCENARIO_LABELS[profile.scenario] ?? profile.scenario}
            </p>
            {profile.districts.length > 0 && (
              <p className="text-xs text-muted">
                📍 {profile.districts.map((d) => d.name).join(', ')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-full border-2 border-black bg-white px-3 py-1.5 text-sm font-black text-(--text) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100"
          >
            Изменить
          </button>
        </div>

        {/* Additional photos */}
        {thumbPhotos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {thumbPhotos.map((src, i) => (
              <div
                key={i}
                className="relative h-[90px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 border-black shadow-[2px_2px_0_rgba(20,20,15,0.9)]"
              >
                <Image src={src} alt="" fill sizes="72px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Vibe tags */}
        {profile.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.vibeTags.map((t, i) => (
              <span
                key={t.id}
                className={`rounded-full border-2 border-black px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* Roomie Score */}
        <RoomieScoreCard profile={profile} />

        {/* Budget */}
        {(profile.budgetMin != null || profile.budgetMax != null) && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Бюджет</span>
            <span className="text-sm font-bold text-(--text)">💸 {budgetStr} / мес.</span>
          </div>
        )}

        {/* Lifestyle scales */}
        {profile.lifestyleScales && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Вайб дома</span>
            {(
              ['noiseLevel', 'cleanliness', 'sleepSchedule', 'socialLevel', 'workFromHome'] as const
            ).map((key) => (
              <VibeScaleBar key={key} scaleKey={key} value={profile.lifestyleScales![key]} />
            ))}
          </div>
        )}

        {/* Rules */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Правила</span>
          <RulesSection
            smokingOk={profile.smokingOk}
            petsOk={profile.petsOk}
            guestsPref={profile.guestsPref}
          />
        </div>
      </div>

      <ProfileEditSheet open={editOpen} profile={profile} onClose={() => setEditOpen(false)} />
    </>
  );
}
