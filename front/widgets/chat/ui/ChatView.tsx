'use client';

// Заглушка вкладки «Чат» — экран появится в фазе Chat & Agreement (CHAT-01–06).
export function ChatView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-5xl" aria-hidden>💬</span>
      <h2 className="text-xl font-black text-(--text)">Чаты</h2>
      <p className="text-sm text-muted">Здесь появятся переписки с мэтчами.</p>
    </div>
  );
}
