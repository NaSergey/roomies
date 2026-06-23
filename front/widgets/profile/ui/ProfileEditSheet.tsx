'use client';

import { useEffect, useState } from 'react';
import { usePatchProfile } from '@/features/profile';
import type { MyProfile, UpdateProfilePayload } from '@/shared/lib/api';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';

interface ProfileEditSheetProps {
  open: boolean;
  profile: MyProfile;
  onClose: () => void;
}

function ToggleChip(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <Chip className="px-3 py-1.5" {...props} />;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-muted">{children}</span>
  );
}

export function ProfileEditSheet({ open, profile, onClose }: ProfileEditSheetProps) {
  const patch = usePatchProfile();

  const [name, setName] = useState(profile.name);
  const [budgetMin, setBudgetMin] = useState(String(profile.budgetMin ?? ''));
  const [budgetMax, setBudgetMax] = useState(String(profile.budgetMax ?? ''));
  const [smokingOk, setSmokingOk] = useState(profile.smokingOk);
  const [petsOk, setPetsOk] = useState(profile.petsOk);
  const [guestsPref, setGuestsPref] = useState<'rarely' | 'sometimes' | 'often'>(profile.guestsPref);

  // Sync form state when profile changes
  useEffect(() => {
    setName(profile.name);
    setBudgetMin(String(profile.budgetMin ?? ''));
    setBudgetMax(String(profile.budgetMax ?? ''));
    setSmokingOk(profile.smokingOk);
    setPetsOk(profile.petsOk);
    setGuestsPref(profile.guestsPref);
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  async function handleSave() {
    const payload: UpdateProfilePayload = {};
    if (name.trim() && name.trim() !== profile.name) payload.name = name.trim();
    const minNum = parseInt(budgetMin, 10);
    const maxNum = parseInt(budgetMax, 10);
    if (!isNaN(minNum) && minNum !== profile.budgetMin) payload.budgetMin = minNum;
    if (!isNaN(maxNum) && maxNum !== profile.budgetMax) payload.budgetMax = maxNum;
    if (smokingOk !== profile.smokingOk) payload.smokingOk = smokingOk;
    if (petsOk !== profile.petsOk) payload.petsOk = petsOk;
    if (guestsPref !== profile.guestsPref) payload.guestsPref = guestsPref;

    if (Object.keys(payload).length > 0) {
      await patch.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} className="gap-5" label="Редактировать профиль">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-(--text)">Редактировать</h3>
          <button type="button" onClick={onClose} className="text-xs font-bold text-muted underline">
            Отмена
          </button>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Имя</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold text-(--text) outline-none ring-accent focus:ring-2"
            placeholder="Твоё имя"
          />
        </div>

        {/* Budget */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Бюджет (₽/мес.)</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold text-(--text) outline-none ring-accent focus:ring-2"
              placeholder="от"
              min={0}
            />
            <span className="shrink-0 text-sm text-muted">—</span>
            <input
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold text-(--text) outline-none ring-accent focus:ring-2"
              placeholder="до"
              min={0}
            />
          </div>
        </div>

        {/* Smoking */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Курение</FieldLabel>
          <div className="flex gap-2">
            <ToggleChip active={!smokingOk} onClick={() => setSmokingOk(false)}>🚭 Не курю</ToggleChip>
            <ToggleChip active={smokingOk} onClick={() => setSmokingOk(true)}>🚬 Курение ок</ToggleChip>
          </div>
        </div>

        {/* Pets */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Питомцы</FieldLabel>
          <div className="flex gap-2">
            <ToggleChip active={petsOk} onClick={() => setPetsOk(true)}>🐾 Есть питомцы</ToggleChip>
            <ToggleChip active={!petsOk} onClick={() => setPetsOk(false)}>🚫 Без питомцев</ToggleChip>
          </div>
        </div>

        {/* Guests */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Гости</FieldLabel>
          <div className="flex gap-2">
            <ToggleChip active={guestsPref === 'often'} onClick={() => setGuestsPref('often')}>Часто</ToggleChip>
            <ToggleChip active={guestsPref === 'sometimes'} onClick={() => setGuestsPref('sometimes')}>Иногда</ToggleChip>
            <ToggleChip active={guestsPref === 'rarely'} onClick={() => setGuestsPref('rarely')}>Редко</ToggleChip>
          </div>
        </div>

        <Button onClick={handleSave} disabled={patch.isPending} className="mt-1 w-full py-3 text-sm">
          {patch.isPending ? 'Сохраняем...' : 'Сохранить'}
        </Button>
    </BottomSheet>
  );
}
