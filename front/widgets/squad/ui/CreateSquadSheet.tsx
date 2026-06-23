'use client';

import { useState } from 'react';
import { useCreateSquad } from '@/features/squad';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';

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

  return (
    <BottomSheet open={open} onClose={onClose} label="Создать сквад">
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
          className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium text-(--text) outline-none ring-accent focus:ring-2"
        />
        <input
          type="number"
          min={0}
          placeholder="до ₽"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-medium text-(--text) outline-none ring-accent focus:ring-2"
        />
      </div>

      {/* Actions */}
      <Button onClick={handleSubmit} disabled={createSquad.isPending} className="w-full py-3 text-sm">
        {createSquad.isPending ? 'Создаём...' : 'Создать'}
      </Button>
      <Button variant="white" onClick={onClose} className="w-full py-3 text-sm">
        Отмена
      </Button>
    </BottomSheet>
  );
}
