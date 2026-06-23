'use client';

import { useRespondInvite } from '@/features/squad';
import type { SquadInvite } from '@/shared/lib/api';

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
        <button
          type="button"
          disabled={respondInvite.isPending}
          onClick={() => respondInvite.mutate({ inviteId: invite.id, action: 'accept' })}
          className="flex-1 rounded-full border-2 border-black bg-[#c8f36a] py-1.5 text-xs font-black text-(--text) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-60"
        >
          Принять
        </button>
        <button
          type="button"
          disabled={respondInvite.isPending}
          onClick={() => respondInvite.mutate({ inviteId: invite.id, action: 'decline' })}
          className="flex-1 rounded-full border-2 border-black bg-white py-1.5 text-xs font-black text-(--text) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-60"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}
