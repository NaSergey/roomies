'use client';

import Image from 'next/image';
import { Glass } from '@samasante/liquid-glass';
import { memo, type ReactNode } from 'react';
import { GLASS_TAG_TINTS, SCENARIO_LABELS, GLASS_OPTICS } from '@/shared/config';
import { mediaUrl } from '@/shared/lib/api';
import type { RoomieProfile } from '../model/types';

interface ProfileCardProps {
  profile: RoomieProfile;
  priority?: boolean;
  overlay?: ReactNode;
}



const GLASS_CHIP = 'border-glass shadow-glass backdrop-glass';



const SCALE_LABELS: Record<string, string> = {
  cleanliness: 'Чистота',
  sleepSchedule: 'Режим',
  socialLevel: 'Общение',
  noiseLevel: 'Шум',
  workFromHome: 'Дома',
};

function formatBudget(min: number | null, max: number | null): string | null {
  const k = (v: number) => Math.round(v / 1000);
  if (min != null && max != null) return `${k(min)}–${k(max)} тыс`;
  if (max != null) return `до ${k(max)} тыс`;
  if (min != null) return `от ${k(min)} тыс`;
  return null;
}

function ProfileCardBase({ profile, priority, overlay }: ProfileCardProps) {
  const [mainPhoto, ...thumbPhotos] = profile.photos;
  const tagLabels = profile.vibeTags.map((t) => t.label);

  const district = profile.districts[0]?.name ?? null;
  const ageDistrict = [profile.age != null ? `${profile.age} лет` : null, district]
    .filter(Boolean)
    .join(', ');
  const budgetLabel = formatBudget(profile.budgetMin, profile.budgetMax);
  const scenarioLabel = SCENARIO_LABELS[profile.scenario] ?? null;
  const reason = profile.matchReasons?.[0] ?? null;

  const scores = profile.lifestyleScales
    ? (Object.entries(profile.lifestyleScales) as [string, number | null][])
        .filter(([, v]) => v != null)
        .slice(0, 3)
        .map(([key, v]) => ({ label: SCALE_LABELS[key] ?? key, pct: Math.round((v as number) * 100) }))
    : [];

  return (
    <div className="relative flex h-full w-full flex-col items-center gap-4 overflow-y-auto px-4 pb-4 pt-2 no-scrollbar">
      {/* ── Круглое фото + повёрнутые подписи вокруг ── */}
      <div className="relative mx-auto mt-8 mb-6 w-[92%] max-w-84 shrink-0">
        <div className="relative aspect-square w-full overflow-hidden rounded-full border-glass-xl shadow-glass">
          {mainPhoto ? (
            <Image
              src={mediaUrl(mainPhoto)}
              alt={profile.name}
              fill
              sizes="(max-width: 480px) 80vw, 320px"
              className="pointer-events-none select-none object-cover"
              priority={priority}
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-6xl">🏠</div>
          )}
        </div>


        {/* Верификация — стеклянный кружок, тот же приём */}
        {/* <div
          className={`absolute -right-2 top-[8%] flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-[#14140f] ${GLASS_CHIP}`}
        >
          <CheckIcon />
        </div> */}

        {/* Мини-фото — стеклянные пузырьки на краю круга */}
        {thumbPhotos.length > 0 && (
          <div className="absolute -right-2 top-[28%] flex flex-col gap-2">
            {thumbPhotos.slice(0, 2).map((src, i) => (
              <div
                key={i}
                className={`relative h-11 w-11 overflow-hidden rounded-full bg-glass ${GLASS_CHIP}`}
              >
                <Image src={mediaUrl(src)} alt="" fill sizes="44px" className="object-cover" />
              </div>
            ))}
          </div>
        )}



        {/* Подписи вокруг фото — реально идут ПО дуге круга (SVG textPath), а не
            просто повёрнутый текст. Каждая подпись — на своей четверти дуги
            (запад→север, север→восток, восток→юг, юг→запад — один и тот же
            обход по часовой стрелке), отцентрована на ней: так текст не
            вылезает за пределы своей дуги и не переворачивается. */}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <path id={`arc-tl-${profile.id}`} d="M -4 50 A 54 54 0 0 1 50 -4" fill="none" />
            <path id={`arc-tr-${profile.id}`} d="M 50 -4 A 54 54 0 0 1 104 50" fill="none" />
            <path id={`arc-br-${profile.id}`} d="M 104 50 A 54 54 0 0 1 50 104" fill="none" />
            {/* Тот же радиус 54 и то же направление обхода (по часовой), что и
                у остальных трёх дуг — South→West. Chromium рендерит textPath
                на этой дуге перевёрнутым на 180° (эмпирически подтверждённый
                баг, не зависящий от шрифта/среды) — правим ниже честным
                поворотом текста на 180° вокруг её же середины, а не хаком
                через dy/радиус, который плыл в разных браузерах. */}
            <path id={`arc-bl-${profile.id}`} d="M 50 104 A 54 54 0 0 1 -4 50" fill="none" />
          </defs>

          <text fontSize="4.6" fontWeight={400} fill="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(20,20,60,0.55))' }}>
            <textPath href={`#arc-tl-${profile.id}`} xlinkHref={`#arc-tl-${profile.id}`} startOffset="50%" textAnchor="middle">
              {profile.name}
            </textPath>
          </text>

          {ageDistrict && (
            <text fontSize="4.6" fontWeight={400} fill="rgba(255,255,255,0.9)" style={{ filter: 'drop-shadow(0 1px 2px rgba(20,20,60,0.55))' }}>
              <textPath href={`#arc-tr-${profile.id}`} xlinkHref={`#arc-tr-${profile.id}`} startOffset="50%" textAnchor="middle">
                {ageDistrict}
              </textPath>
            </text>
          )}

          {scenarioLabel && (
            <text fontSize="4.6" fontWeight={400} fill="rgba(255,255,255,0.9)" style={{ filter: 'drop-shadow(0 1px 2px rgba(20,20,60,0.55))' }}>
              <textPath href={`#arc-br-${profile.id}`} xlinkHref={`#arc-br-${profile.id}`} startOffset="50%" textAnchor="middle">
                {scenarioLabel} 👉
              </textPath>
            </text>
          )}
          
          {budgetLabel && (
            // Поворот на 180° вокруг середины дуги (центр круга 50,50, r=54,
            // угол 135° между South и West): cos135=-0.7071, sin135=0.7071.
              <text fontSize="4.6" fontWeight={400} fill="rgba(255,255,255,0.9)" style={{ filter: 'drop-shadow(0 1px 2px rgba(20,20,60,0.55))' }}>
                <textPath href={`#arc-bl-${profile.id}`} xlinkHref={`#arc-bl-${profile.id}`} startOffset="50%" textAnchor="middle">
                  {budgetLabel}
                </textPath>
              </text>
          )}
        </svg>
      </div>

      {/* Причина мэтча — короткая «био»-строка под фото */}
      {reason && (
        <p className="shrink-0 text-center text-sm leading-snug text-white/90 drop-shadow-[0_1px_3px_rgba(20,20,60,0.45)]">
          {reason}
        </p>
      )}

      {/* Теги — стеклянные пилюли */}
      {tagLabels.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {tagLabels.map((label, i) => (
            <Glass
              key={label}
              className="text-xs font-bold text-[#14140f]"
              style={{
                background: GLASS_TAG_TINTS[i % GLASS_TAG_TINTS.length],
                borderRadius: 9999,
                padding: '4px 12px',
              }}
              optics={GLASS_OPTICS}
            >
              {label}
            </Glass>
          ))}
        </div>
      )}

      {overlay}
    </div>
  );
}

// memo: при ререндере родителя (смена фазы свайпа) карта не пересобирает DOM.
// Сравниваем профиль по id, а не по ссылке: рефетч ленты отдаёт те же карточки
// новыми объектами — без сравнения по id memo бы их перерисовал зря.
export const ProfileCard = memo(
  ProfileCardBase,
  (prev, next) =>
    prev.profile.id === next.profile.id &&
    prev.priority === next.priority &&
    prev.overlay === next.overlay,
);

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
