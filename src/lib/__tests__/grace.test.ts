import { describe, expect, it } from "vitest";
import {
  GRACE_RULE_ID,
  canConsumeFreeze,
  consumeFreeze,
  freezesRemaining,
  maybeAutoFreeze,
} from "@/lib/grace";
import {
  badgeLoggedStreak,
  currentStreak,
  dayKey,
} from "@/lib/streaks";
import type { EvolutionLog } from "@/lib/types";
import { deriveBadges } from "@/lib/badges";

function log(createdAt: string, id = "l1"): EvolutionLog {
  return {
    id,
    journeyId: "j1",
    photoUri: "data:,",
    createdAt,
    dayIndex: 1,
    captureSource: "gallery",
  };
}

function localIso(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m - 1, d, h, 0, 0).toISOString();
}

describe("grace rule", () => {
  it("locks one_freeze_per_30_days", () => {
    expect(GRACE_RULE_ID).toBe("one_freeze_per_30_days");
  });

  it("starts with 1 freeze available", () => {
    expect(freezesRemaining({ frozenDayKeys: [] })).toBe(1);
  });

  it("consumes freeze and empties inventory", () => {
    const now = new Date(2026, 8, 20);
    const next = consumeFreeze({ frozenDayKeys: [] }, "2026-09-19", now);
    expect(next.frozenDayKeys).toContain("2026-09-19");
    expect(freezesRemaining(next, now)).toBe(0);
    expect(canConsumeFreeze(next, "2026-09-18", now)).toBe(false);
  });

  it("refreshes after 30 days", () => {
    const last = new Date(2026, 7, 20).toISOString();
    const now = new Date(2026, 8, 20);
    expect(
      freezesRemaining({ lastFreezeAt: last, frozenDayKeys: ["2026-08-19"] }, now)
    ).toBe(1);
  });
});

describe("streak + grace", () => {
  it("freeze bridges a missed day for display streak", () => {
    const now = new Date(2026, 8, 20, 10, 0);
    // Logged 18 + 17; missed 19; freeze 19 → streak ends yesterday
    const logs = [
      log(localIso(2026, 9, 17), "a"),
      log(localIso(2026, 9, 18), "b"),
    ];
    expect(currentStreak(logs, now)).toBe(0);
    expect(currentStreak(logs, now, ["2026-09-19"])).toBe(3);
  });

  it("badge streak excludes freeze days", () => {
    const now = new Date(2026, 8, 20, 10, 0);
    const logs = [
      log(localIso(2026, 9, 17), "a"),
      log(localIso(2026, 9, 18), "b"),
      log(localIso(2026, 9, 20), "c"),
    ];
    const frozen = ["2026-09-19"];
    expect(currentStreak(logs, now, frozen)).toBe(4);
    expect(badgeLoggedStreak(logs, now, frozen)).toBe(3);
  });

  it("deriveBadges uses logged-only streak", () => {
    const now = new Date(2026, 8, 20, 12, 0);
    // 6 logged + 1 freeze would be display 7, badge 6
    const logs = [0, 1, 2, 3, 4, 6].map((offset, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      d.setHours(12, 0, 0, 0);
      return log(d.toISOString(), `l${i}`);
    });
    // freeze yesterday relative to a gap — build explicitly:
    // days: today-0,1,2,3,4,6 logged; freeze day 5 (yesterday-ish)
    const frozenKey = dayKey(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5)
    );
    const grace = { frozenDayKeys: [frozenKey], lastFreezeAt: now.toISOString() };
    const badges = deriveBadges(
      [
        {
          id: "j1",
          archiveNo: 1,
          title: "T",
          ultimateGoal: "g",
          category: "Fitness",
          durationDays: 30,
          startedAt: localIso(2026, 9, 1),
          day1PhotoUri: null,
          todayPhotoUri: null,
          status: "active",
        },
      ],
      logs,
      [],
      grace,
      now
    );
    const seven = badges.find((b) => b.id === "seven_day_warrior")!;
    // display would be higher; badge must stay below 7 if only 6 logged in run
    expect(seven.current).toBeLessThanOrEqual(6);
    expect(seven.unlockedAt).toBeNull();
  });

  it("maybeAutoFreeze bridges yesterday when day-before logged", () => {
    const now = new Date(2026, 8, 20, 9, 0);
    const logged = new Set(["2026-09-18"]);
    const { grace, appliedDay } = maybeAutoFreeze(
      logged,
      { frozenDayKeys: [] },
      now
    );
    expect(appliedDay).toBe("2026-09-19");
    expect(grace.frozenDayKeys).toContain("2026-09-19");
  });

  it("maybeAutoFreeze no-ops when freeze already used", () => {
    const now = new Date(2026, 8, 20, 9, 0);
    const logged = new Set(["2026-09-18"]);
    const { appliedDay } = maybeAutoFreeze(
      logged,
      {
        lastFreezeAt: now.toISOString(),
        frozenDayKeys: ["2026-09-10"],
      },
      now
    );
    expect(appliedDay).toBeNull();
  });
});
