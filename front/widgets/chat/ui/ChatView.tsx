'use client';

import { useState } from 'react';
import { useProfileQuery } from '@/features/profile';
import { MatchList } from './MatchList';
import { ChatConversation } from './ChatConversation';

interface SelectedChat {
  chatId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
}

export function ChatView() {
  const [selected, setSelected] = useState<SelectedChat | null>(null);
  const { data: profile } = useProfileQuery();
  const currentUserId = profile?.id ?? 0;

  if (selected) {
    return (
      <ChatConversation
        chatId={selected.chatId}
        partnerId={selected.partnerId}
        partnerName={selected.partnerName}
        partnerPhoto={selected.partnerPhoto}
        currentUserId={currentUserId}
        onBack={() => setSelected(null)}
        onOpenProposeCall={() => {
          /* 04-04 wires ProposeCallSheet */
        }}
        onOpenAgreement={() => {
          /* 04-04 wires AgreementSheet */
        }}
        callInviteSlot={undefined}
        agreementSlot={undefined}
      />
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
