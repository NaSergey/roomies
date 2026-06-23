'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { useMySquadQuery, usePendingInvitesQuery, useLeaveSquad } from '@/features/squad';
import { VibeScaleBar } from '@/shared/ui/VibeScaleBar';
import { RulesSection } from '@/shared/ui/RulesSection';
import { Loader } from '@/shared/ui/Loader';
import { Button } from '@/shared/ui/Button';
import { TAG_COLORS, SCENARIO_LABELS } from '@/shared/config';
import { RoomieScoreCard } from './RoomieScoreCard';
import { ProfileEditSheet } from './ProfileEditSheet';
import { CreateSquadSheet } from '@/widgets/squad';
import { InviteMemberSheet } from '@/widgets/squad';
import { PendingInviteCard } from '@/widgets/squad';

export function ProfileView() {
  const { data: profile, isLoading, isError, error } = useProfileQuery();
  const { data: mySquad } = useMySquadQuery();
  const { data: pendingInvites = [] } = usePendingInvitesQuery();
  const leaveSquad = useLeaveSquad();
  const [editOpen, setEditOpen] = useState(false);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader />
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

          <Button variant="white" onClick={() => setEditOpen(true)} className="shrink-0 px-3 py-1.5 text-sm">
            Изменить
          </Button>
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

        {/* Squad section */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Мой сквад</span>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="flex flex-col gap-2">
              {pendingInvites.map((invite) => (
                <PendingInviteCard key={invite.id} invite={invite} />
              ))}
            </div>
          )}

          {/* Squad info or create button */}
          {mySquad ? (
            <div className="rounded-xl border-2 border-black bg-white p-3 flex flex-col gap-2 shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-(--text)">
                  {mySquad.name ?? 'Без названия'}
                </span>
                <span className="rounded-full border-2 border-black bg-[#a8d8ff] px-2 py-0.5 text-xs font-bold text-(--text)">
                  {mySquad.memberCount}/{mySquad.maxMembers}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {mySquad.members.map((m) => (
                  <span key={m.id} className="rounded-full border-2 border-black bg-[#f0efe9] px-2 py-0.5 text-xs font-bold text-(--text)">
                    {m.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setInviteOpen(true)} className="flex-1 py-2 text-xs">
                  Пригласить
                </Button>
                <Button
                  variant="white"
                  onClick={() => leaveSquad.mutate(mySquad.id)}
                  disabled={leaveSquad.isPending}
                  className="flex-1 py-2 text-xs"
                >
                  Выйти
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setCreateSquadOpen(true)} className="w-full py-2.5 text-sm">
              + Создать сквад
            </Button>
          )}
        </div>

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
      <CreateSquadSheet open={createSquadOpen} onClose={() => setCreateSquadOpen(false)} />
      <InviteMemberSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        squadId={mySquad?.id}
      />
    </>
  );
}
