'use client';

import Image from 'next/image';
import { Glass } from '@samasante/liquid-glass';
import { mediaUrl } from '@/shared/lib/api';
import type { SquadFeedCard } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';

const CHIP_OPTICS = { frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 };

interface SquadCardProps {
  squad: SquadFeedCard;
  onDismiss: () => void;
}

export function SquadCard({ squad, onDismiss }: SquadCardProps) {
  const visibleDistricts = squad.districts.slice(0, 3);
  const extraDistricts = squad.districts.length - 3;

  const budgetParts = [squad.budgetMin, squad.budgetMax].filter((v) => v != null);
  const budgetStr = budgetParts.length > 0 ? budgetParts.join('–') + ' ₽' : null;

  const visibleMembers = squad.members.slice(0, 4);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-glass backdrop-glass border-glass shadow-glass flex flex-col gap-3 p-4 w-64 shrink-0">
      {/* Header: squad name */}
      <span className="text-base font-black text-(--text) truncate">
        {'👥 ' + (squad.name ?? 'Ищем соседей')}
      </span>

      {/* Member count badge */}
      <Glass
        className="w-fit rounded-full px-2 py-0.5 text-xs font-bold text-(--text)"
        style={{ background: '#a8d8ff' }}
        optics={CHIP_OPTICS}
      >
        {squad.memberCount}/{squad.maxMembers} участника
      </Glass>

      {/* Budget row */}
      <span className="text-xs text-muted">
        {budgetStr ? '💸 ' + budgetStr : 'Бюджет не указан'}
      </span>

      {/* Districts */}
      {squad.districts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleDistricts.map((d) => (
            <Glass
              key={d.id}
              className="rounded-full px-2 py-0.5 text-xs font-bold text-(--text)"
              style={{ background: 'var(--tint-pink)' }}
              optics={CHIP_OPTICS}
            >
              {d.name}
            </Glass>
          ))}
          {extraDistricts > 0 && (
            <Glass
              className="rounded-full px-2 py-0.5 text-xs font-bold text-(--text)"
              style={{ background: 'var(--tint-pink)' }}
              optics={CHIP_OPTICS}
            >
              +{extraDistricts} ещё
            </Glass>
          )}
        </div>
      )}

      {/* Member avatars */}
      {visibleMembers.length > 0 && (
        <div className="flex items-center">
          {visibleMembers.map((member, i) => (
            <div
              key={member.id}
              className={`h-7 w-7 shrink-0 rounded-full border-glass bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden${i > 0 ? ' -ml-2' : ''}`}
            >
              {member.photo ? (
                <Image src={mediaUrl(member.photo)} alt={member.name} width={28} height={28} className="object-cover w-full h-full" />
              ) : (
                <span>{member.name[0]?.toUpperCase() ?? '?'}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dismiss button */}
      <Button variant="white" onClick={onDismiss} className="w-full py-2 text-sm">
        Пропустить
      </Button>
    </div>
  );
}
