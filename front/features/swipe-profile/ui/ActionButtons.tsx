'use client';

export interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSave?: () => void;
  onSuperLike?: () => void;
}

export function ActionButtons({ onPass, onLike, onSave, onSuperLike }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-3 pb-2 pt-1">

      {/* Pass — белый круг с лицом */}
      <button
        type="button"
        onClick={onPass}
        aria-label="Пропустить"
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-black bg-white transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95"
        style={{ boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <FacePassIcon />
      </button>

      {/* Save — закладка, персиковый */}
      <button
        type="button"
        onClick={onSave}
        aria-label="Сохранить"
        disabled={!onSave}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95 disabled:opacity-40"
        style={{ background: '#ffd7a8', boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <BookmarkIcon />
      </button>

      {/* SuperLike — звезда, небесно-голубой */}
      <button
        type="button"
        onClick={onSuperLike}
        aria-label="Супер лайк"
        disabled={!onSuperLike}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95 disabled:opacity-40"
        style={{ background: '#a8d8ff', boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <StarIcon />
      </button>

      {/* Like — лаймовый круг, жест рукой */}
      <button
        type="button"
        onClick={onLike}
        aria-label="Лайк"
        className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-black transition-transform active:translate-x-[2px] active:translate-y-[2px] active:scale-95"
        style={{ background: '#c8f36a', boxShadow: '4px 4px 0 rgba(20,20,15,0.9)' }}
      >
        <RockOnIcon />
      </button>
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
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
