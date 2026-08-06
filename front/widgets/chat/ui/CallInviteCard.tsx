'use client';

import { Glass } from '@samasante/liquid-glass';
import { useRespondCall } from '@/features/chat';
import type { CallInviteData } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';

export interface CallInviteCardProps {
  invite: CallInviteData;
  currentUserId: number;
  chatId: number;
  onProposeNew: () => void;
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function CallInviteCard({
  invite,
  currentUserId,
  chatId,
  onProposeNew,
}: CallInviteCardProps) {
  const respondCall = useRespondCall(chatId);

  const isRecipient = currentUserId !== invite.proposerId;
  const isDeclinedOrExpired =
    invite.status === 'declined' || invite.status === 'expired';

  return (
    <Glass
      className={`w-full rounded-2xl p-4 my-1 ${isDeclinedOrExpired ? 'opacity-50' : ''}`}
      style={{
        background:
          'linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.28) 100%), rgba(255,255,255,0.14)',
      }}
      optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span>📞</span>
        <span className="font-black text-(--text) text-sm">
          Предложение созвониться
        </span>
      </div>

      {/* Pending — recipient view */}
      {invite.status === 'pending' && isRecipient && (
        <>
          {invite.proposedTimes.map((time) => (
            <div
              key={time}
              className="flex items-center justify-between gap-2 py-2 border-b border-white/10 last:border-0"
            >
              <span className="text-sm text-(--text)">{formatTime(time)}</span>
              <Button
                flat
                onClick={() =>
                  respondCall.mutate({
                    inviteId: invite.id,
                    action: 'accept',
                    confirmedTime: time,
                  })
                }
                disabled={respondCall.isPending}
                className="shrink-0 px-3 py-1 text-xs"
              >
                Принять
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={onProposeNew}
            className="mt-2 text-xs font-bold text-muted underline underline-offset-2"
          >
            Предложить другое время
          </button>
        </>
      )}

      {/* Pending — proposer view */}
      {invite.status === 'pending' && !isRecipient && (
        <>
          {invite.proposedTimes.map((time) => (
            <div
              key={time}
              className="py-2 border-b border-white/10 last:border-0"
            >
              <span className="text-sm text-(--text)">{formatTime(time)}</span>
            </div>
          ))}
          <p className="text-xs text-muted italic mt-2">
            Ожидаем ответа...
          </p>
        </>
      )}

      {/* Accepted */}
      {invite.status === 'accepted' && invite.confirmedTime && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">✓</span>
          <span className="text-(--text)">
            Подтверждено: {formatTime(invite.confirmedTime)}
          </span>
        </div>
      )}

      {/* Declined or expired */}
      {isDeclinedOrExpired && (
        <div className="text-sm text-muted italic">Отклонено</div>
      )}
    </Glass>
  );
}
