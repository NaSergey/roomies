'use client';

import { useMatchesQuery } from '@/features/chat';
import type { MatchListItem } from '@/shared/lib/api';

export interface MatchListProps {
  onSelect: (
    chatId: number,
    partnerId: number,
    partnerName: string,
    partnerPhoto: string | null,
  ) => void;
}

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'вчера';
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getLastMessagePreview(item: MatchListItem): string {
  const msg = item.lastMessage;
  if (!msg) return '';
  if (msg.messageType === 'call_invite') return '📞 Предложение созвониться';
  if (msg.messageType === 'system') return '🤝 Соглашение';
  return msg.content ?? '';
}

function MatchRow({
  item,
  onSelect,
}: {
  item: MatchListItem;
  onSelect: MatchListProps['onSelect'];
}) {
  const { partner, lastMessage, unreadCount } = item;
  const preview = getLastMessagePreview(item);
  const timeStr = lastMessage ? formatTime(lastMessage.createdAt) : '';

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 border-b border-[#f0efe9] p-3 active:bg-[#f8f8f5]"
      onClick={() => onSelect(item.chatId, partner.id, partner.name, partner.photo)}
    >
      {/* Avatar */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-black bg-accent flex items-center justify-center shadow-[2px_2px_0_rgba(20,20,15,0.7)]">
        {partner.photo ? (
          <img
            src={partner.photo}
            alt={partner.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="text-xl font-black text-[#14140f]">
            {partner.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        {/* Top row: name + time */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-black text-(--text) truncate mr-2">{partner.name}</span>
          <span className="text-xs text-muted shrink-0">{timeStr}</span>
        </div>
        {/* Bottom row: preview + badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted truncate flex-1 mr-2">{preview}</span>
          {unreadCount > 0 && (
            <span className="ml-auto shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b6b] text-[10px] font-black text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function MatchList({ onSelect }: MatchListProps) {
  const { data: matches, isPending } = useMatchesQuery();

  if (isPending) {
    return (
      <div className="flex flex-col gap-0 flex-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-[#f0efe9] mx-3 mb-2"
          />
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-5xl" aria-hidden>💬</span>
        <p className="text-sm text-muted">Здесь появятся переписки с мэтчами.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
      {matches.map((item) => (
        <MatchRow key={item.chatId} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}
