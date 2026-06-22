'use client';

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onMessage?: () => void;
}

export function ActionButtons({ onPass, onLike, onMessage }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 pb-2 pt-1">

      {/* Pass — белый круг с лицом */}
      <button
        type="button"
        onClick={onPass}
        aria-label="Pass"
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-black bg-white transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95"
        style={{ boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <FacePassIcon />
      </button>

      {/* Message — овал, бирюзовый */}
      <button
        type="button"
        onClick={onMessage ?? (() => {})}
        aria-label="Message"
        disabled={!onMessage}
        className="flex h-[56px] w-[104px] items-center justify-center rounded-full border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95 disabled:opacity-50"
        style={{ background: '#7dd8e0', boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <ChatBubblesIcon />
      </button>

      {/* Like — лаймовый круг, жест рукой */}
      <button
        type="button"
        onClick={onLike}
        aria-label="Like"
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95"
        style={{ background: '#c8f36a', boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <RockOnIcon />
      </button>
    </div>
  );
}

function FacePassIcon() {
  return (
    <svg width="34" height="30" viewBox="0 0 34 30" fill="none" aria-hidden>
      {/* X-глаза */}
      <text x="3" y="16" fontSize="13" fontWeight="900" fill="#222">×</text>
      <text x="19" y="16" fontSize="13" fontWeight="900" fill="#222">×</text>
      {/* Радуга */}
      <path d="M5,24 Q17,14 29,24" stroke="#f87171" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M7,26 Q17,17 27,26" stroke="#fb923c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M9,28 Q17,20 25,28" stroke="#facc15" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ChatBubblesIcon() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden>
      {/* Основной пузырь */}
      <rect x="1" y="1" width="22" height="16" rx="8" fill="white" opacity="0.9" />
      {/* Три точки */}
      <circle cx="7" cy="9" r="2" fill="#555" />
      <circle cx="12" cy="9" r="2" fill="#555" />
      <circle cx="17" cy="9" r="2" fill="#555" />
      {/* Маленький пузырь */}
      <rect x="13" y="12" width="16" height="11" rx="6" fill="white" opacity="0.7" />
      <circle cx="19" cy="17" r="1.4" fill="#555" />
      <circle cx="23" cy="17" r="1.4" fill="#555" />
    </svg>
  );
}

function RockOnIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 100 100" fill="#222" aria-hidden>
      {/* Ладонь */}
      <rect x="28" y="44" width="44" height="40" rx="12" />
      {/* Большой палец */}
      <rect x="12" y="52" width="22" height="15" rx="7" />
      {/* Указательный палец */}
      <rect x="31" y="12" width="15" height="40" rx="7" />
      {/* Мизинец */}
      <rect x="54" y="12" width="15" height="40" rx="7" />
    </svg>
  );
}
