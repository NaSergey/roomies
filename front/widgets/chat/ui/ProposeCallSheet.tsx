'use client';

import { useEffect, useState } from 'react';
import { useProposeCall } from '@/features/chat';

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
        <h3 className="text-lg font-black text-(--text)">
          Предложить время созвона
        </h3>

        {/* Slots */}
        <div className="flex flex-col gap-3">
          {slots.map((slot, i) => (
            <input
              key={i}
              type="datetime-local"
              value={slot}
              min={minDateTime}
              onChange={(e) =>
                setSlots((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))
              }
              className="w-full rounded-xl border-2 border-black px-4 py-2 text-sm bg-white outline-none"
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
          <button
            type="button"
            onClick={handlePropose}
            disabled={proposeMutation.isPending || validTimes.length === 0}
            className="w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-[#14140f] shadow-[3px_3px_0_rgba(20,20,15,0.9)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-50"
          >
            {proposeMutation.isPending ? 'Отправляем...' : 'Предложить'}
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
