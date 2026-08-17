export interface RoomieProfile {
  id: number;
  name: string;
  age?: number;
  scenario: string;
  budgetMin: number | null;
  budgetMax: number | null;
  photos: string[];
  vibeTags: { id: number; label: string }[];
  districts: { id: number; name: string }[];
  lifestyleScales: {
    noiseLevel: number | null;
    cleanliness: number | null;
    sleepSchedule: number | null;
    socialLevel: number | null;
    workFromHome: number | null;
  } | null;
  matchScore: number;
  /** Терпимость к чужому курению / питомцам. */
  smokingOk: boolean;
  petsOk: boolean;
  /** Собственное поведение — именно это показывает карточка. */
  smokes: boolean;
  hasPets: boolean;
  guestsPref: 'rarely' | 'sometimes' | 'often';
  matchReasons: string[];
  matchRisks?: string[];
}
