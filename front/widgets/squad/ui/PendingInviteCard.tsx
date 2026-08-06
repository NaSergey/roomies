'use client';

import { Glass } from '@samasante/liquid-glass';
import { useRespondInvite } from '@/features/squad';
import type { SquadInvite } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';

interface PendingInviteCardProps {
  invite: SquadInvite;
}

export function PendingInviteCard({ invite }: PendingInviteCardProps) {
  const respondInvite = useRespondInvite();

  return (
    <Glass
      className="flex flex-col gap-2 rounded-xl p-3"
      // display через style — <Glass> перебивает класс flex своим инлайновым
      // inline-block (см. Card.tsx).
      style={{ display: 'flex', background: 'var(--tint-sky)' }}
      optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
    >
      <p className="text-sm font-bold text-(--text)">
        Вас приглашают в сквад {invite.squadName ?? 'без названия'} ({invite.memberCount} участника)
      </p>
      <p className="text-xs text-muted">
        От: {invite.senderName}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={respondInvite.isPending}
          onClick={() => respondInvite.mutate({ inviteId: invite.id, action: 'accept' })}
          className="flex-1 py-1.5 text-xs"
        >
          Принять
        </Button>
        <Button
          variant="white"
          disabled={respondInvite.isPending}
          onClick={() => respondInvite.mutate({ inviteId: invite.id, action: 'decline' })}
          className="flex-1 py-1.5 text-xs"
        >
          Отклонить
        </Button>
      </div>
    </Glass>
  );
}
