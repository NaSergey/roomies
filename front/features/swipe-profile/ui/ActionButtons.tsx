'use client';

export interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSave?: () => void;
  onSuperLike?: () => void;
  /** Открыть карточку кандидата целиком (тот же переход, что и тап по карте). */
  onDetails?: () => void;
}

// Тинты pass/like — из общей палитры (--tint-* в globals.css), вид прежний:
// раньше те же значения стояли здесь хардкодом.
const GLASS_CIRCLE = 'border-glass shadow-glass backdrop-glass transition-transform active:scale-90 disabled:opacity-40';

// Та же стеклянная семья, что и GLASS_CIRCLE, но без bg-glass (убирает
// диагональный блик) и с одним мягким inset-хайлайтом вместо двух из
// shadow-glass — на нейтральном (нецветном) фоне пилюли три блика разом
// читались как "залипание" света, кругам Pass/Like это не мешает, потому
// что там поверх цветной заливки.
const DETAILS_PILL =
  'rounded-full border-glass backdrop-glass bg-white/14 px-4 py-2.5 text-sm font-bold text-white ' +
  'shadow-[0_10px_26px_-10px_rgba(20,20,60,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] ' +
  'transition-transform active:scale-90';

export function ActionButtons({ onPass, onLike, onSave, onSuperLike, onDetails }: ActionButtonsProps) {
  return (
    <div className="flex items-end justify-center gap-5 pb-2 pt-1">
      {/* Pass — стеклянный круг с розовым оттенком, спутник Save сверху-слева */}
      <div className="relative">
        <button
          type="button"
          onClick={onPass}
          aria-label="Пропустить"
          className={`flex h-15 w-15 items-center justify-center rounded-full bg-(--tint-rose) text-[#14140f] ${GLASS_CIRCLE}`}
        >
          <XIcon />
        </button>
        <button
          type="button"
          onClick={onSave}
          aria-label="Сохранить"
          disabled={!onSave}
          className={`absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-glass text-[#14140f] ${GLASS_CIRCLE}`}
        >
          <BookmarkIcon />
        </button>
      </div>

      {/* Подробнее — стеклянная пилюля, тот же переход, что и тап по карте */}
      {onDetails && (
        <button type="button" onClick={onDetails} className={DETAILS_PILL}>
          подробнее
        </button>
      )}

      {/* Like — стеклянный круг с мятным оттенком, спутник SuperLike сверху-справа */}
      <div className="relative">
        <button
          type="button"
          onClick={onLike}
          aria-label="Лайк"
          className={`flex h-15 w-15 items-center justify-center rounded-full bg-(--tint-mint) text-[#14140f] ${GLASS_CIRCLE}`}
        >
          <CheckIcon />
        </button>
        <button
          type="button"
          onClick={onSuperLike}
          aria-label="Супер лайк"
          disabled={!onSuperLike}
          className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-glass text-[#14140f] ${GLASS_CIRCLE}`}
        >
          <StarIcon />
        </button>
      </div>
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

function XIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
