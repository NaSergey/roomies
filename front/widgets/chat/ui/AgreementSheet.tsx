'use client';

import { useCreateAgreement } from '@/features/chat';

export interface AgreementSheetProps {
  open: boolean;
  onClose: () => void;
  chatId: number;
}

const AGREEMENT_ITEMS_DISPLAY = [
  { category: 'quiet', ruleText: 'Тишина после 23:00' },
  { category: 'cleaning', ruleText: 'Уборка по очереди раз в неделю' },
  { category: 'guests', ruleText: 'Гости предупреждают за сутки' },
  { category: 'utilities', ruleText: 'Коммуналка делится поровну' },
  { category: 'shared_zones', ruleText: 'Кухня и ванная — убираем за собой' },
];

export function AgreementSheet({ open, onClose, chatId }: AgreementSheetProps) {
  const createMutation = useCreateAgreement(chatId);

  function handlePropose() {
    createMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 overflow-y-auto rounded-t-3xl border-t-2 border-black bg-white px-5 pt-4 pb-8 shadow-[0_-4px_0_rgba(20,20,15,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)] max-h-[88dvh] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="mx-auto h-1 w-10 rounded-full bg-[#d0d0cc]" />

        {/* Title */}
        <div>
          <h3 className="text-lg font-black text-(--text)">Roomie Agreement</h3>
          <p className="text-sm text-muted mt-1">
            Стандартные правила совместного проживания
          </p>
        </div>

        {/* Items preview */}
        <ul className="flex flex-col gap-2 my-2">
          {AGREEMENT_ITEMS_DISPLAY.map((item) => (
            <li
              key={item.category}
              className="flex items-start gap-2 text-sm text-(--text)"
            >
              <span className="shrink-0 leading-snug">•</span>
              <span>{item.ruleText}</span>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <button
            type="button"
            onClick={handlePropose}
            disabled={createMutation.isPending}
            className="w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Создаём...' : 'Предложить соглашение'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full border-2 border-black bg-white py-3 text-sm font-black text-[#6f6f68] active:scale-95 transition-transform duration-100"
          >
            Отмена
          </button>
        </div>
      </div>
    </>
  );
}
