'use client';

import { useState } from 'react';
import { useCreateSquad } from '@/features/squad';

interface CreateSquadSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSquadSheet({ open, onClose }: CreateSquadSheetProps) {
  const [name, setName] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const createSquad = useCreateSquad();

  function handleSubmit() {
    createSquad.mutate(
      {
        name: name.trim() || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setName('');
          setBudgetMin('');
          setBudgetMax('');
        },
      },
    );
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-2 border-black bg-[#f0efe9] shadow-[0_-4px_0_rgba(20,20,15,0.9)] p-4 gap-4">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#d0d0cc]" />

        <h3 className="text-lg font-black text-(--text)">Создать сквад</h3>

        {/* Name */}
        <input
          type="text"
          placeholder="Название (необязательно)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium text-(--text) outline-none ring-accent focus:ring-2"
        />

        {/* Budget */}
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Бюджет от ₽"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium text-(--text) outline-none ring-accent focus:ring-2"
          />
          <input
            type="number"
            min={0}
            placeholder="до ₽"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium text-(--text) outline-none ring-accent focus:ring-2"
          />
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createSquad.isPending}
          className="w-full rounded-full border-2 border-black bg-accent py-3 text-sm font-black text-(--text-on-accent) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100 disabled:opacity-60"
        >
          {createSquad.isPending ? 'Создаём...' : 'Создать'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full border-2 border-black bg-white py-3 text-sm font-black text-(--text) shadow-[2px_2px_0_rgba(20,20,15,0.9)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_rgba(20,20,15,0.9)] transition-all duration-100"
        >
          Отмена
        </button>
      </div>
    </>
  );
}
