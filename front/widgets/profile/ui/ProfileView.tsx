'use client';

import Image from 'next/image';
import { Glass } from '@samasante/liquid-glass';
import { useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { useMySquadQuery, usePendingInvitesQuery, useLeaveSquad } from '@/features/squad';
import { clearAccessToken, mediaUrl } from '@/shared/lib/api';
import { buildReferralLink, haptic, shareReferralLink } from '@/shared/lib/telegram';
import { VibeScaleBar } from '@/shared/ui/VibeScaleBar';
import { RulesSection } from '@/shared/ui/RulesSection';
import { Loader } from '@/shared/ui/Loader';
import { Button } from '@/shared/ui/Button';
import { TAG_TINTS, SCENARIO_LABELS, GLASS_OPTICS, GLASS_SURFACE_BG } from '@/shared/config';
import { RoomieScoreCard } from './RoomieScoreCard';
import { ProfileEditSheet } from './ProfileEditSheet';
import { VibeQuizScreen } from './VibeQuizScreen';
import { FeedbackSheet } from './FeedbackSheet';
import { CreateSquadSheet } from '@/widgets/squad';
import { InviteMemberSheet } from '@/widgets/squad';
import { PendingInviteCard } from '@/widgets/squad';

const SHOW_SQUAD = false;

export function ProfileView() {
  const { data: profile, isLoading, isError, error } = useProfileQuery();
  const { data: mySquad } = useMySquadQuery(SHOW_SQUAD);
  const { data: pendingInvites = [] } = usePendingInvitesQuery(SHOW_SQUAD);
  const leaveSquad = useLeaveSquad();
  const [editOpen, setEditOpen] = useState(false);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // Отклик на нажатие: в Telegram открывается нативный шеринг и подпись не
  // нужна, а в обычном браузере ссылка уходит в буфер — там без подтверждения
  // непонятно, произошло ли хоть что-то.
  const [inviteState, setInviteState] = useState<'idle' | 'copied'>('idle');

  const referralLink = profile ? buildReferralLink(profile.referralCode) : null;

  async function handleInvite() {
    if (!referralLink) return;
    haptic('light');
    const result = await shareReferralLink(referralLink);
    if (result === 'copied') {
      setInviteState('copied');
      setTimeout(() => setInviteState('idle'), 2000);
    }
  }

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
      {/* px-3/pt-3 внутри скролл-контейнера, а не на родителе: тени элементов
          падают в этот отступ и не срезаются краем прокрутки. */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-(--nav-space) pt-3 no-scrollbar">

        {/* Avatar + header */}
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-glass-lg shadow-glass">
            {mainPhoto ? (
              <Image
                src={mediaUrl(mainPhoto)}
                alt={profile.name}
                fill
                sizes="80px"
                className="pointer-events-none select-none object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-3xl">🏠</div>
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

          <div className="shrink-0">
            <Button variant="white" onClick={() => setEditOpen(true)} className="px-3 py-1.5 text-sm">
              Изменить
            </Button>
          </div>
        </div>

        {/* Additional photos */}
        {thumbPhotos.length > 0 && (
          // py-3/-my-3 — тот же приём, что и с горизонтальными отступами:
          // вертикальный запас внутри прокрутки, чтобы тени мини-фото падали
          // в него, а не срезались краем. Отрицательный margin гасит запас,
          // поэтому расстояние до соседних блоков остаётся прежним.
          <div className="-my-3 flex gap-2 overflow-x-auto py-3 no-scrollbar">
            {thumbPhotos.map((src, i) => (
              <div
                key={i}
                className="relative h-[90px] w-[72px] shrink-0 overflow-hidden rounded-xl border-glass shadow-glass"
              >
                <Image
                  src={mediaUrl(src)}
                  alt=""
                  fill
                  sizes="72px"
                  className="pointer-events-none select-none object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Vibe tags */}
        {profile.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.vibeTags.map((t, i) => (
              <Glass
                key={t.id}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold text-[#14140f] ${TAG_TINTS[i % TAG_TINTS.length]}`}
                optics={GLASS_OPTICS}
              >
                {t.label}
              </Glass>
            ))}
          </div>
        )}

        {/* Roomie Score */}
        <RoomieScoreCard profile={profile} />

        {/* Приглашение друга. Стоит под Roomie Score, а не в шапке: реферальная
            ссылка — это следующий шаг после того, как видишь свой счёт, а не
            действие над самой анкетой (там осталось только «Изменить»).
            Счётчик приглашённых переехал сюда же — он подпись к этой кнопке, у
            аватара он читался как оторванная строка. */}
        {referralLink && (
          <div className="flex flex-col gap-1.5">
            <Button onClick={handleInvite} className="w-full py-3 text-sm">
              {inviteState === 'copied' ? 'Ссылка скопирована' : 'Пригласить друга'}
            </Button>
            {/* Показываем, только когда есть чем похвастаться: пустой
                «0 приглашено» на свежем аккаунте выглядит упрёком. */}
            {profile.invitedCount > 0 && (
              <p className="text-center text-xs text-muted">
                По твоей ссылке зарегистрировались: {profile.invitedCount}
              </p>
            )}
          </div>
        )}

        {/* Squad section — disabled, see feedback */}
        {SHOW_SQUAD && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Мой сквад</span>

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
            <Glass
              className="flex flex-col gap-2 rounded-xl p-3"
              // display через style — <Glass> перебивает класс flex своим
              // инлайновым inline-block (см. Card.tsx).
              style={{
                display: 'flex',
                background:
                  GLASS_SURFACE_BG,
              }}
              optics={GLASS_OPTICS}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-(--text)">
                  {mySquad.name ?? 'Без названия'}
                </span>
                <Glass
                  className="rounded-full px-2 py-0.5 text-xs font-bold text-(--text)"
                  style={{ background: '#a8d8ff' }}
                  optics={GLASS_OPTICS}
                >
                  {mySquad.memberCount}/{mySquad.maxMembers}
                </Glass>
              </div>
              <div className="flex flex-wrap gap-1">
                {mySquad.members.map((m) => (
                  <Glass
                    key={m.id}
                    className="rounded-full px-2 py-0.5 text-xs font-bold text-(--text)"
                    style={{
                      background:
                        GLASS_SURFACE_BG,
                    }}
                    optics={GLASS_OPTICS}
                  >
                    {m.name}
                  </Glass>
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
            </Glass>
          ) : (
            <Button onClick={() => setCreateSquadOpen(true)} className="w-full py-2.5 text-sm">
              + Создать сквад
            </Button>
          )}
        </div>
        )}

        {/* Budget */}
        {(profile.budgetMin != null || profile.budgetMax != null) && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Бюджет</span>
            <span className="text-sm font-bold text-(--text)">💸 {budgetStr} / мес.</span>
          </div>
        )}

        {/* Lifestyle scales / vibe quiz prompt */}
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Вайб дома</span>
          {profile.quizCompleted ? (
            <>
              <div className="flex items-center justify-between px-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                <span>неважно</span>
                <span>важно</span>
              </div>
              {(
                ['noiseLevel', 'cleanliness', 'sleepSchedule', 'socialLevel', 'workFromHome'] as const
              ).map((key) => (
                <VibeScaleBar
                  key={key}
                  scaleKey={key}
                  value={profile.lifestyleScales![key]}
                  photo={mainPhoto}
                />
              ))}
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="self-start text-xs font-bold text-(--text) underline"
              >
                Пройти квиз заново
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border-glass bg-glass backdrop-glass px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-(--text)">Пройди вайб-квиз</p>
                <p className="text-xs text-muted">
                  10 вопросов — поможет точнее подобрать соседа
                </p>
              </div>
              <Button onClick={() => setQuizOpen(true)} className="shrink-0 px-4 py-2 text-sm">
                Пройти
              </Button>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Правила</span>
          <RulesSection
            smokingOk={profile.smokingOk}
            petsOk={profile.petsOk}
            smokes={profile.smokes}
            hasPets={profile.hasPets}
            guestsPref={profile.guestsPref}
          />
        </div>

        {/* Обратная связь — над «Выйти»: это последнее, что человек ищет на
            экране, и рядом с выходом его проще найти, чем в шапке. */}
        <div className="mt-2 flex flex-col gap-2">
          <Button
            variant="white"
            onClick={() => {
              haptic('light');
              setFeedbackOpen(true);
            }}
            className="w-full py-3 text-sm"
          >
            Написать нам
          </Button>
          <p className="text-center text-xs text-muted">
            Что-то сломалось или есть идея — расскажи, мы читаем всё
          </p>
        </div>

        {/* Выход: чистим токен и перезагружаемся — на старте useAppAuth заново
            решит, куда вести (Telegram-логин или форма входа). */}
        <Button
          variant="white"
          onClick={() => {
            clearAccessToken();
            window.location.reload();
          }}
          className="w-full py-3 text-sm"
        >
          Выйти
        </Button>
      </div>

      <ProfileEditSheet open={editOpen} profile={profile} onClose={() => setEditOpen(false)} />
      <CreateSquadSheet open={createSquadOpen} onClose={() => setCreateSquadOpen(false)} />
      <InviteMemberSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        squadId={mySquad?.id}
      />
      <VibeQuizScreen open={quizOpen} onClose={() => setQuizOpen(false)} />
      <FeedbackSheet
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        screen="profile"
      />
    </>
  );
}
