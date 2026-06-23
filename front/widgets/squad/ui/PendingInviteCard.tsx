'use client';

import { useRespondInvite } from '@/features/squad';
import type { SquadInvite } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';

interface PendingInviteCardProps {
  invite: SquadInvite;
}

export function PendingInviteCard({ invite }: PendingInviteCardProps) {
  const respondInvite = useRespondInvite();

  return (
    <div className="rounded-xl border-2 border-black bg-[#a8d8ff] p-3 flex flex-col gap-2 shadow-[2px_2px_0_rgba(20,20,15,0.9)]">
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
    </div>
  );
}
