// Общие хелперы для тайм-серий CRM-аналитики. Дни считаем в UTC — DateTime-колонки
// в схеме хранятся без явного часового пояса и заполняются из Node (всегда UTC),
// так что date_trunc('day', ...) на стороне Postgres и эти границы совпадают.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  return startOfUtcDay(new Date(from.getTime() - n * DAY_MS));
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildDateRange(days: number, since: Date): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(toDateKey(new Date(since.getTime() + i * DAY_MS)));
  }
  return out;
}

export interface DayCount {
  day: Date;
  count: number;
}

export function toCountMap(rows: DayCount[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(toDateKey(r.day), Number(r.count));
  }
  return map;
}

// Доля part/whole, округлённая до 3 знаков (0..1). whole=0 → 0, а не NaN/Infinity.
export function rate(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 1000;
}
