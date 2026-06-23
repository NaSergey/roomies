'use client';

import { useEffect, useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { useCallInvitesQuery, useAgreementsQuery } from '@/features/chat';
import type { CallInviteData, AgreementData } from '@/shared/lib/api';
import { MatchList } from './MatchList';
import { ChatConversation } from './ChatConversation';
import { CallInviteCard } from './CallInviteCard';
import { AgreementCard } from './AgreementCard';
import { ProposeCallSheet } from './ProposeCallSheet';
import { AgreementSheet } from './AgreementSheet';

interface SelectedChat {
  chatId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
}

export function ChatView() {
  const [selected, setSelected] = useState<SelectedChat | null>(null);
  const [showProposeCall, setShowProposeCall] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const { data: profile } = useProfileQuery();
  const currentUserId = profile?.id ?? 0;

  // Hooks must be called unconditionally — use chatId=0 when no chat selected
  // queries are effectively disabled (will fail with 403 on chatId=0, caught by React Query harmlessly)
  const callInvitesQuery = useCallInvitesQuery(selected?.chatId ?? 0);
  const agreementsQuery = useAgreementsQuery(selected?.chatId ?? 0);

  // Reset sheet state when going back to MatchList
  useEffect(() => {
    if (!selected) {
      setShowProposeCall(false);
      setShowAgreement(false);
    }
  }, [selected]);

  // Build lookup maps for slot resolvers
  const callInvitesById: Record<number, CallInviteData> = {};
  (callInvitesQuery.data ?? []).forEach((inv) => {
    callInvitesById[inv.id] = inv;
  });
  const agreementsById: Record<number, AgreementData> = {};
  (agreementsQuery.data ?? []).forEach((ag) => {
    agreementsById[ag.id] = ag;
  });

  if (selected) {
    return (
      <>
        <ChatConversation
          chatId={selected.chatId}
          partnerId={selected.partnerId}
          partnerName={selected.partnerName}
          partnerPhoto={selected.partnerPhoto}
          currentUserId={currentUserId}
          onBack={() => setSelected(null)}
          onOpenProposeCall={() => setShowProposeCall(true)}
          onOpenAgreement={() => setShowAgreement(true)}
          callInviteSlot={(inviteId) => {
            const inv = callInvitesById[inviteId];
            if (!inv) return null;
            return (
              <CallInviteCard
                invite={inv}
                currentUserId={currentUserId}
                chatId={selected.chatId}
                onProposeNew={() => setShowProposeCall(true)}
              />
            );
          }}
          agreementSlot={(agreementId) => {
            const ag = agreementsById[agreementId];
            if (!ag) return null;
            return (
              <AgreementCard
                agreement={ag}
                currentUserId={currentUserId}
                chatId={selected.chatId}
              />
            );
          }}
        />
        <ProposeCallSheet
          open={showProposeCall}
          onClose={() => setShowProposeCall(false)}
          chatId={selected.chatId}
        />
        <AgreementSheet
          open={showAgreement}
          onClose={() => setShowAgreement(false)}
          chatId={selected.chatId}
        />
      </>
    );
  }

  return (
    <MatchList
      onSelect={(chatId, partnerId, partnerName, partnerPhoto) =>
        setSelected({ chatId, partnerId, partnerName, partnerPhoto })
      }
    />
  );
}
