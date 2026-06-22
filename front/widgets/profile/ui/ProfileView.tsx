'use client';

// Заглушка вкладки «Профиль» — экран своего профиля появится в фазе
// Discovery & Profiles (PROF-01–04).
export function ProfileView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-5xl" aria-hidden>🙂</span>
      <h2 className="text-xl font-black text-(--text)">Профиль</h2>
      <p className="text-sm text-muted">Здесь будет твоя анкета и настройки.</p>
    </div>
  );
}
