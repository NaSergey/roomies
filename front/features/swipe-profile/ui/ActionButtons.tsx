'use client';

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onMessage?: () => void;
}

// Три круглые кнопки внизу экрана: pass (тёмный X) · message (персиковый чат) ·
// like (розовое сердце). Геометрия и цвета — по референсу For You.
export function ActionButtons({ onPass, onLike, onMessage }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-5 pb-2">
      <CircleButton
        onClick={onPass}
        ariaLabel="Pass"
        bg="var(--ctrl-dark)"
        fg="var(--ctrl-dark-on)"
      >
        <XIcon />
      </CircleButton>

      <CircleButton
        onClick={onMessage ?? (() => {})}
        ariaLabel="Message"
        bg="var(--peach)"
        fg="var(--text)"
        disabled={!onMessage}
      >
        <ChatIcon />
      </CircleButton>

      <CircleButton
        onClick={onLike}
        ariaLabel="Like"
        bg="var(--rose)"
        fg="#ffffff"
      >
        <HeartIcon />
      </CircleButton>
    </div>
  );
}

function CircleButton({
  onClick,
  ariaLabel,
  bg,
  fg,
  disabled,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  bg: string;
  fg: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-60"
      style={{
        backgroundColor: bg,
        color: fg,
        boxShadow: 'var(--shadow-button)',
      }}
    >
      {children}
    </button>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
