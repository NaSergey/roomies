'use client';

import { Glass } from '@samasante/liquid-glass';
import { useRespondAgreement } from '@/features/chat';
import type { AgreementData } from '@/shared/lib/api';
import { Button } from '@/shared/ui/Button';
import { GLASS_OPTICS, GLASS_SURFACE_BG } from '@/shared/config';

export interface AgreementCardProps {
  agreement: AgreementData;
  currentUserId: number;
  chatId: number;
}

export function AgreementCard({
  agreement,
  currentUserId,
  chatId,
}: AgreementCardProps) {
  const respondAgreement = useRespondAgreement(chatId);

  const isRecipient = currentUserId !== agreement.createdById;

  return (
    <Glass
      className="w-full rounded-2xl p-4 my-1"
      style={{
        background:
          GLASS_SURFACE_BG,
      }}
      optics={GLASS_OPTICS}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span>🤝</span>
        <span className="font-black text-(--text) text-sm">
          Соглашение соседа
        </span>
      </div>

      {/* Items list */}
      <ul className="flex flex-col gap-1.5 my-3">
        {agreement.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2 text-sm text-(--text)"
          >
            <span className="shrink-0 leading-snug">•</span>
            <span>{item.ruleText}</span>
          </li>
        ))}
      </ul>

      {/* Draft — recipient view */}
      {agreement.status === 'draft' && isRecipient && (
        <div className="flex gap-2 mt-3">
          <Button
            flat
            onClick={() =>
              respondAgreement.mutate({
                agreementId: agreement.id,
                action: 'accept',
              })
            }
            disabled={respondAgreement.isPending}
            className="flex-1 py-2 text-sm"
          >
            Принять
          </Button>
          <button
            type="button"
            onClick={() =>
              respondAgreement.mutate({
                agreementId: agreement.id,
                action: 'decline',
              })
            }
            disabled={respondAgreement.isPending}
            className="flex-1 rounded-full border-glass bg-glass backdrop-glass py-2 text-sm font-black text-muted active:scale-95 transition-transform duration-100 disabled:opacity-50"
          >
            Отклонить
          </button>
        </div>
      )}

      {/* Draft — initiator view */}
      {agreement.status === 'draft' && !isRecipient && (
        <p className="text-xs text-muted italic mt-2">
          Ожидаем ответа партнёра...
        </p>
      )}

      {/* Accepted */}
      {agreement.status === 'accepted' && (
        <div className="flex items-center gap-1 mt-2 text-sm text-green-600 font-black">
          ✓ Принято
          {agreement.acceptedAt && (
            <span className="font-normal text-(--text) ml-1">
              {new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'long',
              }).format(new Date(agreement.acceptedAt))}
            </span>
          )}
        </div>
      )}

      {/* Declined */}
      {agreement.status === 'declined' && (
        <p className="text-xs text-muted italic mt-2">Отклонено</p>
      )}
    </Glass>
  );
}
