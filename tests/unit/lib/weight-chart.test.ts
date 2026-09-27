import { describe, expect, it } from "vitest";

import {
  buildPeriodBands,
  buildWeightSeries,
  filterByDateRange,
} from "@/lib/weight-chart";
import type { Period, WeightLog } from "@/types";

function log(overrides: Partial<WeightLog>): WeightLog {
  return { id: "1", weight: 80, date: null, importOrder: null, ...overrides };
}

function period(overrides: Partial<Period>): Period {
  return {
    id: "p1",
    type: "mass",
    label: null,
    startDate: null,
    endDate: null,
    ...overrides,
  };
}

describe("buildWeightSeries", () => {
  it("sorts undated entries before dated ones, undated by importOrder", () => {
    const logs = [
      log({ id: "dated", weight: 3, date: "2026-01-05" }),
      log({ id: "u2", weight: 2, importOrder: 1 }),
      log({ id: "u1", weight: 1, importOrder: 0 }),
    ];
    const series = buildWeightSeries(logs);
    expect(series.map((p) => p.weight)).toEqual([1, 2, 3]);
  });

  it("labels a dated entry with its date and an undated one with its order", () => {
    const series = buildWeightSeries([
      log({ date: "2026-01-05" }),
      log({ importOrder: 3 }),
    ]);
    expect(series.map((p) => p.label)).toEqual(["#3", "2026-01-05"]);
  });

  it("labels an entry with neither date nor importOrder as '#?'", () => {
    const [point] = buildWeightSeries([log({})]);
    expect(point?.label).toBe("#?");
  });

  it("sorts two undated entries by importOrder", () => {
    const series = buildWeightSeries([
      log({ id: "b", weight: 2, importOrder: 1 }),
      log({ id: "a", weight: 1, importOrder: 0 }),
    ]);
    expect(series.map((p) => p.weight)).toEqual([1, 2]);
  });

  it("sorts two dated entries by date", () => {
    const series = buildWeightSeries([
      log({ id: "later", weight: 2, date: "2026-02-01" }),
      log({ id: "earlier", weight: 1, date: "2026-01-01" }),
    ]);
    expect(series.map((p) => p.weight)).toEqual([1, 2]);
  });
});

describe("buildPeriodBands", () => {
  it("skips periods missing a start or end date", () => {
    const periods = [
      period({ startDate: "2026-01-01", endDate: null }),
      period({ startDate: null, endDate: "2026-02-01" }),
      period({
        id: "complete",
        startDate: "2026-01-01",
        endDate: "2026-02-01",
      }),
    ];
    const bands = buildPeriodBands(periods);
    expect(bands).toHaveLength(1);
    expect(bands[0]?.id).toBe("complete");
  });

  it("converts start/end dates to timestamps", () => {
    const [band] = buildPeriodBands([
      period({ startDate: "2026-01-01", endDate: "2026-01-31" }),
    ]);
    expect(band?.x1).toBe(Date.parse("2026-01-01"));
    expect(band?.x2).toBe(Date.parse("2026-01-31"));
  });
});

describe("filterByDateRange", () => {
  it("returns all points when no range is set", () => {
    const points = buildWeightSeries([log({ date: "2026-01-01" })]);
    expect(filterByDateRange(points, null, null)).toEqual(points);
  });

  it("filters to the given start date", () => {
    const points = buildWeightSeries([
      log({ id: "1", date: "2026-01-01" }),
      log({ id: "2", date: "2026-02-01" }),
    ]);
    expect(filterByDateRange(points, "2026-01-15", null)).toHaveLength(1);
  });

  it("filters to the given end date", () => {
    const points = buildWeightSeries([
      log({ id: "1", date: "2026-01-01" }),
      log({ id: "2", date: "2026-02-01" }),
    ]);
    const filtered = filterByDateRange(points, null, "2026-01-15");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.weight).toBe(80);
  });
});
