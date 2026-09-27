import type { Period, WeightLog } from "@/types";

export type WeightPoint = {
  x: number;
  label: string;
  weight: number;
};

function compareLogs(a: WeightLog, b: WeightLog): number {
  if (a.date !== null && b.date !== null) {
    return a.date.localeCompare(b.date);
  }
  if (a.date === null && b.date === null) {
    return (a.importOrder ?? 0) - (b.importOrder ?? 0);
  }
  return a.date === null ? -1 : 1;
}

/** Same historical-first ordering as exercise-progress.ts's sessions. */
export function buildWeightSeries(weightLogs: WeightLog[]): WeightPoint[] {
  const sorted = weightLogs.slice().sort(compareLogs);
  let undatedIndex = 0;
  return sorted.map((log) => ({
    x: log.date !== null ? Date.parse(log.date) : -1_000_000 + undatedIndex++,
    label: log.date ?? `#${log.importOrder ?? "?"}`,
    weight: log.weight,
  }));
}

export type PeriodBand = {
  id: string;
  type: Period["type"];
  x1: number;
  x2: number;
};

/**
 * Only periods with both a start and end date become a band — a period
 * missing either date has nothing to key a ReferenceArea's x1/x2 off, per
 * trainer#6's "colored background bands ... keyed off each period's
 * startDate/endDate".
 */
export function buildPeriodBands(periods: Period[]): PeriodBand[] {
  return periods
    .filter(
      (period): period is Period & { startDate: string; endDate: string } =>
        period.startDate !== null && period.endDate !== null,
    )
    .map((period) => ({
      id: period.id,
      type: period.type,
      x1: Date.parse(period.startDate),
      x2: Date.parse(period.endDate),
    }));
}

export function filterByDateRange(
  points: WeightPoint[],
  startDate: string | null,
  endDate: string | null,
): WeightPoint[] {
  const startX = startDate ? Date.parse(startDate) : null;
  const endX = endDate ? Date.parse(endDate) : null;
  if (startX === null && endX === null) return points;
  return points.filter((point) => {
    if (startX !== null && point.x < startX) return false;
    if (endX !== null && point.x > endX) return false;
    return true;
  });
}
