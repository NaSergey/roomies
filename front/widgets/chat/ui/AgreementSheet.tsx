'use client';

import { useCreateAgreement } from '@/features/chat';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

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
    <BottomSheet open={open} onClose={onClose} label="Roomie Agreement">
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
          <Button onClick={handlePropose} disabled={createMutation.isPending} className="w-full py-3 text-sm">
            {createMutation.isPending ? 'Создаём...' : 'Предложить соглашение'}
          </Button>
          <Button variant="white" onClick={onClose} className="w-full py-3 text-sm">
            Отмена
          </Button>
        </div>
    </BottomSheet>
  );
}
