'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Glass } from '@samasante/liquid-glass';
import { useMatchesQuery } from '@/features/chat';
import { mediaUrl } from '@/shared/lib/api';
import { useInviteToSquad } from '@/features/squad';

interface InviteMemberSheetProps {
  open: boolean;
  onClose: () => void;
  squadId: number | undefined;
}

export function InviteMemberSheet({ open, onClose, squadId }: InviteMemberSheetProps) {
  const { data: matches = [] } = useMatchesQuery();
  const inviteMutation = useInviteToSquad(squadId ?? 0);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  function handleInvite(partnerId: number) {
    if (!squadId) return;
    inviteMutation.mutate(partnerId, {
      onSuccess: () => setSentIds((prev) => new Set([...prev, partnerId])),
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-glass backdrop-glass border-glass shadow-glass max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/15">
          <h3 className="text-lg font-black text-(--text)">Пригласить участника</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-muted underline"
          >
            Закрыть
          </button>
        </div>

        {/* Match list */}
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {matches.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Нет матчей для приглашения</p>
          ) : (
            matches.map((match) => {
              const partner = match.partner;
              const sent = sentIds.has(partner.id);
              return (
                <Glass
                  key={match.matchId}
                  className="flex items-center gap-3 rounded-xl p-2"
                  // display через style — <Glass> перебивает класс flex своим
                  // инлайновым inline-block (см. Card.tsx).
                  style={{
                    display: 'flex',
                    background:
                      'linear-gradient(120deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 12%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.28) 100%), rgba(255,255,255,0.14)',
                  }}
                  optics={{ frost: 2, sheen: 0.6, dispersion: 0.15, bend: 0.4 }}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 shrink-0 rounded-full border-glass bg-white/10 flex items-center justify-center text-sm font-bold overflow-hidden">
                    {partner.photo ? (
                      <Image
                        src={mediaUrl(partner.photo)}
                        alt={partner.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span>{partner.name[0]?.toUpperCase() ?? '?'}</span>
                    )}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-bold text-(--text)">{partner.name}</span>

                  {/* Invite button */}
                  {sent ? (
                    <span className="text-xs font-bold text-muted">Отправлено</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleInvite(partner.id)}
                      disabled={inviteMutation.isPending}
                      className="rounded-full border-glass bg-accent-glass backdrop-glass px-3 py-1 text-xs font-black text-(--text) shadow-glass active:scale-95 transition-transform duration-150 disabled:opacity-60"
                    >
                      Пригласить
                    </button>
                  )}
                </Glass>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
