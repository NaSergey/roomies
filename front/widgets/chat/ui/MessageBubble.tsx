'use client';

import { Glass } from '@samasante/liquid-glass';
import type { ChatMessage } from '@/shared/lib/api';
import { GLASS_OPTICS, GLASS_SURFACE_BG } from '@/shared/config';

export interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  callInviteSlot?: React.ReactNode;
  agreementSlot?: React.ReactNode;
}

export function MessageBubble({ message, isOwn, callInviteSlot, agreementSlot }: MessageBubbleProps) {
  const timeStr = new Date(message.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.messageType === 'call_invite') {
    return (
      <div className="my-1 flex justify-center">
        {callInviteSlot ?? (
          <Glass
            className="rounded-xl px-4 py-2 text-sm text-(--text)"
            style={{
              background:
                GLASS_SURFACE_BG,
            }}
            optics={GLASS_OPTICS}
          >
            📞 Созвон
          </Glass>
        )}
      </div>
    );
  }

  if (message.messageType === 'system') {
    // If this system message has an agreementId and an agreementSlot, render it
    if (message.metadata?.agreementId != null && agreementSlot) {
      return <div className="my-1">{agreementSlot}</div>;
    }
    return (
      <div className="my-1 flex justify-center">
        <span className="text-xs italic text-muted text-center px-4">
          {message.content}
        </span>
      </div>
    );
  }

  // text (default)
  return (
    <div className={`mb-1 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwn
            ? 'bg-accent-glass backdrop-glass border-glass text-[#14140f] rounded-br-sm'
            : 'bg-white/14 backdrop-blur-md border-glass text-(--text) rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-snug break-words">{message.content}</p>
        <div className="text-[10px] text-right mt-0.5 opacity-60">{timeStr}</div>
      </div>
    </div>
  );
}
