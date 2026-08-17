'use client';

import type { ComponentType } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { ChatIcon } from '@/shared/ui/icon/ChatIcon';
import { ProfileIcon } from '@/shared/ui/icon/ProfileIcon';
import { SearchIcon } from '@/shared/ui/icon/SearchIcon';

export type NavTab = 'chat' | 'deck' | 'profile';

// iconClass — оптическая подгонка размера. Все три иконки рисованные, viewBox
// у каждой неквадратный (ChatIcon 76×52, SearchIcon 68×51, ProfileIcon 64×49),
// и в квадратной ячейке по умолчанию (20×20) они дают всего ~14–15px по высоте.
const ITEMS: {
  id: NavTab;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  iconClass?: string;
}[] = [
  { id: 'chat',    label: 'Чат',      Icon: ChatIcon,    iconClass: 'h-8 w-8' },
  { id: 'deck',    label: 'Карточки', Icon: SearchIcon,  iconClass: 'h-8 w-8' },
  { id: 'profile', label: 'Профиль',  Icon: ProfileIcon, iconClass: 'h-8 w-8' },
];

const TAB_INDEX: Record<NavTab, number> = { chat: 0, deck: 1, profile: 2 };

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

// Скользящий лаймовый индикатор: абсолютный div w-1/3 едет translateX(n*100%)
// со spring-easing; иконки поверх него — relative, z-10.
export function BottomNav({ active, onChange }: BottomNavProps) {
  const idx = TAB_INDEX[active];

  return (
    // pb-8 без env(safe-area-inset-bottom): нижнюю safe-area уже держит
    // контейнер в TelegramProvider, и вторым слоем она давала под панелью
    // лишнюю пустую полосу.
    <nav className="absolute inset-x-0 bottom-0 z-30 px-3 pb-4">
      {/* Ровно один блок с фоном — сама пилюля, больше вокруг неё ничего не
          рисуется. Намеренно БЕЗ backdrop-glass: backdrop-filter в вебвью
          Telegram переставал обрезаться скруглением (внутри пилюли едет
          индикатор на transform) и ложился прямоугольником размытого фона —
          вокруг панели читалась вторая, чужая подложка. Потеря невелика: на
          гладком градиенте фона размывать нечего, стекло здесь держится на
          заливке bg-glass и кромках shadow-glass (см. globals.css).
          overflow-hidden тоже не нужен — индикатор ограничен inset-0 + p-1. */}
      <div className="relative mx-auto flex w-full max-w-md items-center rounded-full bg-glass backdrop-glass shadow-glass">

        {/* Скользящий фон активной вкладки */}
        <div
          className="pointer-events-none absolute inset-0 flex w-1/3 items-stretch p-1"
          style={{
            transform: `translateX(${idx * 100}%)`,
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="flex-1 rounded-full bg-white/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
        </div>

        {ITEMS.map(({ id, label, Icon, iconClass }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === active) return;
                haptic('light');
                onChange(id);
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative z-10 flex h-11 flex-1 items-center justify-center transition-colors duration-200 ${
                isActive ? 'text-[#14140f]' : 'text-white'
              }`}
            >
              <span
                style={{
                  display: 'flex',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <Icon className={iconClass ?? 'h-5 w-5'} />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
