'use client';

import type { ComponentType } from 'react';
import { haptic } from '@/shared/lib/telegram';
import { CardsIcon, ChatIcon, ProfileIcon } from '@/shared/ui/icons';

export type NavTab = 'chat' | 'deck' | 'profile';

const ITEMS: { id: NavTab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'chat',    label: 'Чат',      Icon: ChatIcon },
  { id: 'deck',    label: 'Карточки', Icon: CardsIcon },
  { id: 'profile', label: 'Профиль',  Icon: ProfileIcon },
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
    <nav className="shrink-0 px-3 pt-1.5 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="relative mx-auto flex w-full max-w-md items-center overflow-hidden rounded-full border-2 border-black bg-white shadow-[3px_3px_0_rgba(20,20,15,0.9)]">

        {/* Скользящий фон активной вкладки */}
        <div
          className="pointer-events-none absolute inset-0 flex w-1/3 items-stretch p-1"
          style={{
            transform: `translateX(${idx * 100}%)`,
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="flex-1 rounded-full bg-accent" />
        </div>

        {ITEMS.map(({ id, label, Icon }) => {
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
                isActive ? 'text-[#14140f]' : 'text-[#9a9a93]'
              }`}
            >
              <span
                style={{
                  display: 'flex',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <Icon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
