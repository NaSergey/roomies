import { GuestsPreference } from '@prisma/client';
import { generateMatchReasons, generateMatchRisks } from './feed.service';

// Minimal UserScoreFields mock factory
function makeUser(overrides: Partial<{
  budgetMin: number | null;
  budgetMax: number | null;
  smokingOk: boolean;
  petsOk: boolean;
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

  it('returns "Оба не курят" when both have smokingOk=false', () => {
    const me = makeUser({ smokingOk: false });
    const candidate = makeUser({ smokingOk: false });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).toContain('Оба не курят');
  });

  it('does NOT return "Оба не курят" when either user has smokingOk=true', () => {
    const me = makeUser({ smokingOk: true });
    const candidate = makeUser({ smokingOk: false });
    const reasons = generateMatchReasons(me, candidate);
    expect(reasons).not.toContain('Оба не курят');
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
    // All nulls, smokingOk different, petsOk false, guestsPref mismatch
    const me = makeUser({ smokingOk: true, petsOk: false, guestsPref: GuestsPreference.rarely });
    const candidate = makeUser({ smokingOk: false, petsOk: false, guestsPref: GuestsPreference.often });
    const reasons = generateMatchReasons(me, candidate);
    // With all nulls for scales, only smokingOk/petsOk/guestsPref matter
    expect(reasons).not.toContain('Оба не курят');
    expect(reasons).not.toContain('Оба любят питомцев');
    expect(reasons).not.toContain('Одинаковое отношение к гостям');
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
