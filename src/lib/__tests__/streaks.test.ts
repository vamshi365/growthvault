import { describe, expect, it } from "vitest";
import type { EvolutionLog } from "@/lib/types";
import {
  currentStreak,
  dayKey,
  longestStreak,
  loggedDayKeys,
} from "@/lib/streaks";

function log(createdAt: string, id = "l1"): EvolutionLog {
  return {
    id,
    journeyId: "j1",
    photoUri: "data:,",
    createdAt,
    dayIndex: 1,
    captureSource: "gallery" as const,
  };
}

function localIso(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m - 1, d, h, 0, 0).toISOString();
}

describe("dayKey / loggedDayKeys", () => {
  it("maps ISO to local YYYY-MM-DD", () => {
    const d = new Date(2026, 8, 20, 15, 30);
    expect(dayKey(d)).toBe("2026-09-20");
  });

  it("dedupes multiple logs on the same calendar day", () => {
    const keys = loggedDayKeys([
      log(localIso(2026, 9, 18), "a"),
      log(localIso(2026, 9, 18, 22), "b"),
      log(localIso(2026, 9, 19), "c"),
    ]);
    expect(keys.size).toBe(2);
    expect(keys.has("2026-09-18")).toBe(true);
    expect(keys.has("2026-09-19")).toBe(true);
  });
});

describe("currentStreak", () => {
  it("returns 0 with no logs", () => {
    expect(currentStreak([], new Date(2026, 8, 20))).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const now = new Date(2026, 8, 20, 18, 0);
    const logs = [
      log(localIso(2026, 9, 18), "a"),
      log(localIso(2026, 9, 19), "b"),
      log(localIso(2026, 9, 20), "c"),
    ];
    expect(currentStreak(logs, now)).toBe(3);
  });

  it("allows streak to end yesterday (grace)", () => {
    const now = new Date(2026, 8, 20, 10, 0);
    const logs = [
      log(localIso(2026, 9, 18), "a"),
      log(localIso(2026, 9, 19), "b"),
    ];
    expect(currentStreak(logs, now)).toBe(2);
  });

  it("breaks when gap before yesterday", () => {
    const now = new Date(2026, 8, 20);
    const logs = [log(localIso(2026, 9, 17), "a")];
    expect(currentStreak(logs, now)).toBe(0);
  });

  it("is global across journeys", () => {
    const now = new Date(2026, 8, 20);
    const logs: EvolutionLog[] = [
      { ...log(localIso(2026, 9, 19), "a"), journeyId: "j1" },
      { ...log(localIso(2026, 9, 20), "b"), journeyId: "j2" },
    ];
    expect(currentStreak(logs, now)).toBe(2);
  });
});

describe("longestStreak", () => {
  it("finds best historical run", () => {
    const logs = [
      log(localIso(2026, 9, 1), "a"),
      log(localIso(2026, 9, 2), "b"),
      log(localIso(2026, 9, 3), "c"),
      log(localIso(2026, 9, 10), "d"),
      log(localIso(2026, 9, 11), "e"),
    ];
    expect(longestStreak(logs)).toBe(3);
  });
});
