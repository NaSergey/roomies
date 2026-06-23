'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMatchesQuery } from '@/features/chat';
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-2 border-black bg-[#f0efe9] shadow-[0_-4px_0_rgba(20,20,15,0.9)] max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
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
                <div
                  key={match.matchId}
                  className="flex items-center gap-3 p-2 rounded-xl border-2 border-black bg-white"
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 shrink-0 rounded-full border-2 border-black bg-[#f0efe9] flex items-center justify-center text-sm font-bold overflow-hidden">
                    {partner.photo ? (
                      <Image
                        src={partner.photo}
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
                      className="rounded-full border-2 border-black bg-[#c8f36a] px-3 py-1 text-xs font-black text-(--text) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-60"
                    >
                      Пригласить
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
