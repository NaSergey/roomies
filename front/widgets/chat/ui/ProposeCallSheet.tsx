'use client';

import { useEffect, useState } from 'react';
import { useProposeCall } from '@/features/chat';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/text-input';

export interface ProposeCallSheetProps {
  open: boolean;
  onClose: () => void;
  chatId: number;
}

export function ProposeCallSheet({ open, onClose, chatId }: ProposeCallSheetProps) {
  const [slots, setSlots] = useState<string[]>(['']);
  const proposeMutation = useProposeCall(chatId);

  // Reset slots when sheet closes
  useEffect(() => {
    if (!open) {
      setSlots(['']);
    }
  }, [open]);

  const minDateTime = new Date().toISOString().slice(0, 16);

  const validTimes = slots.filter((s) => s.trim() !== '');

  function handlePropose() {
    if (validTimes.length === 0) return;
    proposeMutation.mutate(validTimes, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  return (
    <BottomSheet open={open} onClose={onClose} label="Предложить время созвона">
        {/* Title */}
        <h3 className="text-lg font-black text-(--text)">
          Предложить время созвона
        </h3>

        {/* Slots */}
        <div className="flex flex-col gap-3">
          {slots.map((slot, i) => (
            <TextInput
              key={i}
              type="datetime-local"
              value={slot}
              min={minDateTime}
              onChange={(e) =>
                setSlots((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))
              }
              className="w-full px-4 py-2 text-sm"
            />
          ))}
        </div>

        {/* Add slot button */}
        {slots.length < 3 && (
          <button
            type="button"
            onClick={() => setSlots((prev) => [...prev, ''])}
            className="text-xs font-bold text-muted underline underline-offset-2 self-start"
          >
            + Добавить слот
          </button>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <Button
            onClick={handlePropose}
            disabled={proposeMutation.isPending || validTimes.length === 0}
            className="w-full py-3 text-sm"
          >
            {proposeMutation.isPending ? 'Отправляем...' : 'Предложить'}
          </Button>
          <Button variant="white" onClick={onClose} className="w-full py-3 text-sm">
            Отмена
          </Button>
        </div>
    </BottomSheet>
  );
}
