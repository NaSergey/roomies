import { GuestsPreference } from '@prisma/client';
import {
  generateMatchReasons,
  generateMatchRisks,
  hasHardConflict,
} from './feed.service';

// Minimal UserScoreFields mock factory
function makeUser(overrides: Partial<{
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
  smokes: boolean;
  hasPets: boolean;
  guestsPref: GuestsPreference;
  noiseLevel: object | null;
  cleanliness: object | null;
  sleepSchedule: object | null;
  socialLevel: object | null;
  workFromHome: object | null;
}> = {}) {
  return {
    budgetMin: null,
    budgetMax: null,
    smokingOk: false,
    petsOk: false,
    smokes: false,
    hasPets: false,
    guestsPref: GuestsPreference.sometimes,
    noiseLevel: null,
    cleanliness: null,
    sleepSchedule: null,
    socialLevel: null,
    workFromHome: null,
    ...overrides,
  };
}

describe('generateMatchReasons', () => {
  it('returns "Похожий режим сна" when both sleepSchedule values are close (diff < 0.2)', () => {
    const me = makeUser({ sleepSchedule: 0.3 as unknown as object });
    const candidate = makeUser({ sleepSchedule: 0.4 as unknown as object });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Похожий режим сна');
  });

  it('does NOT return "Похожий режим сна" when sleepSchedule values differ too much', () => {
    const me = makeUser({ sleepSchedule: 0.1 as unknown as object });
    const candidate = makeUser({ sleepSchedule: 0.9 as unknown as object });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).not.toContain('Похожий режим сна');
  });

  it('returns "Оба не курят" when both have smokes=false', () => {
    const me = makeUser({ smokes: false });
    const candidate = makeUser({ smokes: false });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Оба не курят');
  });

  it('does NOT return "Оба не курят" when either user smokes', () => {
    const me = makeUser({ smokes: true });
    const candidate = makeUser({ smokes: false });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).not.toContain('Оба не курят');
  });

  // Терпимость на эту строчку больше не влияет — только факт курения.
  it('returns "Оба не курят" for two non-smokers with opposite tolerance', () => {
    const me = makeUser({ smokes: false, smokingOk: true });
    const candidate = makeUser({ smokes: false, smokingOk: false });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Оба не курят');
  });

  it('returns "Оба любят питомцев" when both have petsOk=true', () => {
    const me = makeUser({ petsOk: true });
    const candidate = makeUser({ petsOk: true });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Оба любят питомцев');
  });

  it('returns "Одинаковое отношение к гостям" when guestsPref matches', () => {
    const me = makeUser({ guestsPref: GuestsPreference.often });
    const candidate = makeUser({ guestsPref: GuestsPreference.often });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Одинаковое отношение к гостям');
  });

  it('returns at most 3 reasons even when many criteria match', () => {
    const me = makeUser({
      smokingOk: false,
      petsOk: true,
      guestsPref: GuestsPreference.often,
      sleepSchedule: 0.5 as unknown as object,
      noiseLevel: 0.5 as unknown as object,
      cleanliness: 0.5 as unknown as object,
      socialLevel: 0.5 as unknown as object,
      workFromHome: 0.5 as unknown as object,
    });
    const candidate = makeUser({
      smokingOk: false,
      petsOk: true,
      guestsPref: GuestsPreference.often,
      sleepSchedule: 0.55 as unknown as object,
      noiseLevel: 0.55 as unknown as object,
      cleanliness: 0.55 as unknown as object,
      socialLevel: 0.55 as unknown as object,
      workFromHome: 0.55 as unknown as object,
    });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array when no criteria match', () => {
    // All nulls, one smokes, petsOk false, guestsPref mismatch
    const me = makeUser({ smokes: true, petsOk: false, guestsPref: GuestsPreference.rarely });
    const candidate = makeUser({ smokes: false, petsOk: false, guestsPref: GuestsPreference.often });
    const reasons = generateMatchReasons(me, candidate);
    // With all nulls for scales, only smokingOk/petsOk/guestsPref matter
    expect(reasons).not.toContain('Оба не курят');
    expect(reasons).not.toContain('Оба любят питомцев');
    expect(reasons).not.toContain('Одинаковое отношение к гостям');
  });
});

describe('hasHardConflict — курение и питомцы', () => {
  it('не разводит двоих некурящих, даже если они по-разному относятся к курению', () => {
    // Ровно тот случай, ради которого поля разделили: один «отношусь спокойно»,
    // второй «рядом не хочу», но НИ ОДИН не курит — жить вместе им ничто не мешает.
    const me = makeUser({ smokes: false, smokingOk: true });
    const candidate = makeUser({ smokes: false, smokingOk: false });
    expect(hasHardConflict(me, candidate)).toBe(false);
  });

  it('отсекает курящего кандидата, если я не терплю курение', () => {
    const me = makeUser({ smokes: false, smokingOk: false });
    const candidate = makeUser({ smokes: true, smokingOk: true });
    expect(hasHardConflict(me, candidate)).toBe(true);
  });

  it('отсекает кандидата, не терпящего курение, если курю я', () => {
    const me = makeUser({ smokes: true, smokingOk: true });
    const candidate = makeUser({ smokes: false, smokingOk: false });
    expect(hasHardConflict(me, candidate)).toBe(true);
  });

  it('оставляет двоих курящих, которые оба терпят курение', () => {
    const me = makeUser({ smokes: true, smokingOk: true });
    const candidate = makeUser({ smokes: true, smokingOk: true });
    expect(hasHardConflict(me, candidate)).toBe(false);
  });

  it('не разводит двоих бездетных по животным при разной терпимости', () => {
    const me = makeUser({ hasPets: false, petsOk: true });
    const candidate = makeUser({ hasPets: false, petsOk: false });
    expect(hasHardConflict(me, candidate)).toBe(false);
  });

  it('отсекает владельца питомца, если у меня аллергия', () => {
    const me = makeUser({ hasPets: false, petsOk: false });
    const candidate = makeUser({ hasPets: true, petsOk: true });
    expect(hasHardConflict(me, candidate)).toBe(true);
  });

  it('отсекает кандидата с аллергией, если питомец у меня', () => {
    const me = makeUser({ hasPets: true, petsOk: true });
    const candidate = makeUser({ hasPets: false, petsOk: false });
    expect(hasHardConflict(me, candidate)).toBe(true);
  });

  it('считает конфликтом непересекающиеся бюджеты', () => {
    const me = makeUser({ budgetMin: 60_000, budgetMax: 90_000 });
    const candidate = makeUser({ budgetMin: 20_000, budgetMax: 40_000 });
    expect(hasHardConflict(me, candidate)).toBe(true);
  });
});

describe('generateMatchRisks', () => {
  it('returns risk when me=rarely and candidate=often', () => {
    const me = makeUser({ guestsPref: GuestsPreference.rarely });
    const candidate = makeUser({ guestsPref: GuestsPreference.often });
    const risks = generateMatchRisks(me, candidate);
    expect(risks).toContain('Разное отношение к гостям — обсудите при знакомстве');
  });

  it('returns risk when me=often and candidate=rarely', () => {
    const me = makeUser({ guestsPref: GuestsPreference.often });
    const candidate = makeUser({ guestsPref: GuestsPreference.rarely });
    const risks = generateMatchRisks(me, candidate);
    expect(risks).toContain('Разное отношение к гостям — обсудите при знакомстве');
  });

  it('returns no risk when guestsPref values are not polar opposite', () => {
    const me = makeUser({ guestsPref: GuestsPreference.sometimes });
    const candidate = makeUser({ guestsPref: GuestsPreference.often });
    const risks = generateMatchRisks(me, candidate);
    expect(risks).toHaveLength(0);
  });

  it('returns at most 1 risk', () => {
    const me = makeUser({ guestsPref: GuestsPreference.rarely });
    const candidate = makeUser({ guestsPref: GuestsPreference.often });
    const risks = generateMatchRisks(me, candidate);
    expect(risks.length).toBeLessThanOrEqual(1);
  });
});
