import { describe, expect, it } from "vitest";
import {
  BADGE_ORDER,
  deriveBadges,
  medalCount,
  nextIncompleteBadge,
} from "@/lib/badges";
import type { EvolutionLog, Journey } from "@/lib/types";

function journey(partial: Partial<Journey> & { id: string }): Journey {
  return {
    archiveNo: 1,
    title: "Test",
    ultimateGoal: "Grow",
    category: "Fitness",
    durationDays: 30,
    startedAt: new Date(2026, 8, 1).toISOString(),
    day1PhotoUri: null,
    todayPhotoUri: null,
    status: "active",
    ...partial,
  };
}

function log(
  dayOffset: number,
  journeyId = "j1",
  dayIndex = 1
): EvolutionLog {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - dayOffset);
  return {
    id: `l_${dayOffset}_${journeyId}`,
    journeyId,
    photoUri: "data:,",
    createdAt: d.toISOString(),
    dayIndex,
    captureSource: "gallery",
  };
}

describe("deriveBadges", () => {
  it("starts empty with no journeys/logs", () => {
    const badges = deriveBadges([], []);
    expect(badges).toHaveLength(5);
    expect(medalCount(badges)).toBe(0);
    expect(badges.every((b) => b.unlockedAt === null)).toBe(true);
  });

  it("unlocks Growth Pioneer on first journey", () => {
    const badges = deriveBadges([journey({ id: "j1" })], []);
    const pioneer = badges.find((b) => b.id === "growth_pioneer")!;
    expect(pioneer.unlockedAt).toBeTruthy();
    expect(pioneer.current).toBe(1);
  });

  it("progresses streak badges toward 7/30/100", () => {
    const logs = [0, 1, 2].map((i) => log(i));
    const badges = deriveBadges([journey({ id: "j1" })], logs);
    const seven = badges.find((b) => b.id === "seven_day_warrior")!;
    expect(seven.current).toBe(3);
    expect(seven.unlockedAt).toBeNull();
    expect(seven.target).toBe(7);
  });

  it("unlocks 7 Day Warrior at streak 7", () => {
    const logs = Array.from({ length: 7 }, (_, i) => log(i));
    const badges = deriveBadges([journey({ id: "j1" })], logs);
    const seven = badges.find((b) => b.id === "seven_day_warrior")!;
    expect(seven.unlockedAt).toBeTruthy();
    expect(seven.current).toBe(7);
  });

  it("preserves previous unlockedAt", () => {
    const prev = deriveBadges([journey({ id: "j1" })], []);
    const pioneerAt = prev.find((b) => b.id === "growth_pioneer")!.unlockedAt;
    const again = deriveBadges([journey({ id: "j1" })], [], prev);
    expect(again.find((b) => b.id === "growth_pioneer")!.unlockedAt).toBe(
      pioneerAt
    );
  });

  it("unlocks Transformation Master when journey completed", () => {
    const j = journey({ id: "j1", status: "completed", durationDays: 30 });
    const badges = deriveBadges([j], []);
    const master = badges.find((b) => b.id === "transformation_master")!;
    expect(master.unlockedAt).toBeTruthy();
  });

  it("unlocks Transformation Master when dayIndex reaches duration", () => {
    const j = journey({ id: "j1", durationDays: 21 });
    const logs = [log(0, "j1", 21)];
    const badges = deriveBadges([j], logs);
    const master = badges.find((b) => b.id === "transformation_master")!;
    expect(master.unlockedAt).toBeTruthy();
  });

  it("nextIncompleteBadge follows BADGE_ORDER", () => {
    const badges = deriveBadges([journey({ id: "j1" })], []);
    const next = nextIncompleteBadge(badges);
    expect(next?.id).toBe("seven_day_warrior");
    expect(BADGE_ORDER[0]).toBe("growth_pioneer");
  });
});
