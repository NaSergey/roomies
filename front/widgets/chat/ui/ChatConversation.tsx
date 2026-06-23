'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useChatMessagesQuery,
  useSendMessage,
  useMarkChatRead,
} from '@/features/chat';
import { getWebApp } from '@/shared/lib/telegram';
import { MessageBubble } from './MessageBubble';
import { SmartChips } from './SmartChips';

export interface ChatConversationProps {
  chatId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  currentUserId: number;
  onBack: () => void;
  onOpenProposeCall: () => void;
  onOpenAgreement: () => void;
  callInviteSlot?: (inviteId: number) => React.ReactNode;
  agreementSlot?: (agreementId: number) => React.ReactNode;
}

export function ChatConversation({
  chatId,
  partnerId: _partnerId,
  partnerName,
  partnerPhoto,
  currentUserId,
  onBack,
  onOpenProposeCall,
  onOpenAgreement,
  callInviteSlot,
  agreementSlot,
}: ChatConversationProps) {
  const { data } = useChatMessagesQuery(chatId);
  const messages = data?.messages ?? [];
  const sendMutation = useSendMessage(chatId);
  const markReadMutation = useMarkChatRead(chatId);
  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Telegram BackButton wiring
  useEffect(() => {
    const wa = getWebApp();
    const handler = () => onBack();
    wa?.BackButton.show();
    wa?.BackButton.onClick(handler);
    return () => {
      wa?.BackButton.offClick(handler);
      wa?.BackButton.hide();
    };
  }, [onBack]);

  // Mark chat as read on mount
  useEffect(() => {
    markReadMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  // Nudge bar: messages[0] from API is newest (backend returns newest-first)
  const showNudge =
    messages.length > 0 &&
    Date.now() - new Date(messages[0].createdAt).getTime() > 12 * 60 * 60 * 1000;

  // Display messages in chronological order (oldest at top, newest at bottom)
  const displayMessages = [...messages].reverse();

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    sendMutation.mutate(text);
    setInputText('');
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-black px-3 py-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-lg font-black text-(--text) leading-none"
          aria-label="Назад"
        >
          ‹
        </button>
        {/* Avatar */}
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-black bg-accent flex items-center justify-center">
          {partnerPhoto ? (
            <img
              src={partnerPhoto}
              alt={partnerName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="text-base font-black text-[#14140f]">
              {partnerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="font-black text-(--text)">{partnerName}</span>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 flex flex-col"
      >
        {messages.length === 0 ? (
          <SmartChips onChipTap={(text) => sendMutation.mutate(text)} />
        ) : (
          displayMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              callInviteSlot={
                msg.messageType === 'call_invite' && msg.metadata?.callInviteId != null
                  ? callInviteSlot?.(msg.metadata.callInviteId as number)
                  : undefined
              }
              agreementSlot={
                msg.messageType === 'system' && msg.metadata?.agreementId != null
                  ? agreementSlot?.(msg.metadata.agreementId as number)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Nudge bar */}
      {showNudge && (
        <div className="mx-3 mb-2 flex items-center justify-between gap-2 rounded-xl border-2 border-black bg-[#fff9e6] px-4 py-2 shrink-0">
          <span className="text-xs text-(--text)">
            Хочешь аккуратно напомнить {partnerName}?
          </span>
          <button
            type="button"
            onClick={() => sendMutation.mutate('Привет! Интересно, как дела 🙂')}
            className="rounded-full border-2 border-black bg-accent px-3 py-1 text-xs font-black text-[#14140f] active:scale-95 transition-transform duration-100"
          >
            Напомнить
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2 border-t-2 border-black px-3 py-2 shrink-0">
        <button
          type="button"
          onClick={onOpenProposeCall}
          className="shrink-0 p-1 text-xl leading-none"
          aria-label="Предложить созвон"
        >
          📞
        </button>
        <button
          type="button"
          onClick={onOpenAgreement}
          className="shrink-0 p-1 text-xl leading-none"
          aria-label="Соглашение"
        >
          🤝
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputText.trim()) {
              handleSend();
            }
          }}
          placeholder="Сообщение..."
          className="flex-1 rounded-full border-2 border-black bg-white px-4 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || sendMutation.isPending}
          className="rounded-full border-2 border-black bg-accent px-4 py-2 text-sm font-black text-[#14140f] disabled:opacity-50 active:scale-95 transition-transform duration-100"
          aria-label="Отправить"
        >
          →
        </button>
      </div>
    </div>
  );
}
