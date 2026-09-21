import { describe, expect, it } from "vitest";
import {
  SHARE_TEMPLATES,
  SHARE_SIZES,
  defaultCaption,
  resolveSharePhotos,
  pickAwardBadge,
  journeyDayIndex,
} from "@/lib/share";
import type { BadgeProgress, EvolutionLog, Journey } from "@/lib/types";

function journey(partial: Partial<Journey> = {}): Journey {
  return {
    id: "j1",
    archiveNo: 1,
    title: "Summer Body Prep",
    ultimateGoal: "Feel strong",
    category: "Fitness",
    durationDays: 30,
    startedAt: new Date().toISOString(),
    day1PhotoUri: "data:day1-real",
    todayPhotoUri: "data:today-real",
    status: "active",
    ...partial,
  };
}

function log(id: string, uri: string, partial: Partial<EvolutionLog> = {}): EvolutionLog {
  return {
    id,
    journeyId: "j1",
    photoUri: uri,
    createdAt: new Date().toISOString(),
    dayIndex: 1,
    captureSource: "gallery",
    ...partial,
  };
}

describe("share templates A–D", () => {
  it("exposes four templates with letters A–D", () => {
    expect(SHARE_TEMPLATES.map((t) => t.letter)).toEqual(["A", "B", "C", "D"]);
    expect(SHARE_TEMPLATES.map((t) => t.id)).toEqual([
      "before_after",
      "streak",
      "award",
      "quote",
    ]);
  });

  it("locks canvas sizes to 1080×1920 and 1080×1080", () => {
    expect(SHARE_SIZES.stories).toEqual({ w: 1080, h: 1920 });
    expect(SHARE_SIZES.square).toEqual({ w: 1080, h: 1080 });
  });
});

describe("resolveSharePhotos — real journey data", () => {
  it("uses Day1 / Today journey photos by default", () => {
    const j = journey();
    const r = resolveSharePhotos(j, [], []);
    expect(r.beforeUri).toBe("data:day1-real");
    expect(r.afterUri).toBe("data:today-real");
    expect(r.photoUri).toBe("data:today-real");
  });

  it("honors explicit logIds for A/B compare share", () => {
    const j = journey();
    const logs = [
      log("l_a", "data:log-a"),
      log("l_b", "data:log-b"),
    ];
    const r = resolveSharePhotos(j, logs, ["l_a", "l_b"]);
    expect(r.beforeUri).toBe("data:log-a");
    expect(r.afterUri).toBe("data:log-b");
  });

  it("does not invent placeholder stock URIs when photos missing", () => {
    const j = journey({ day1PhotoUri: null, todayPhotoUri: null });
    const r = resolveSharePhotos(j, [], []);
    expect(r.beforeUri).toBeNull();
    expect(r.afterUri).toBeNull();
    expect(r.photoUri).toBeNull();
  });
});

describe("share copy helpers", () => {
  it("builds quiet en-IN prefill caption", () => {
    expect(defaultCaption(journey(), 12)).toBe(
      "Day 12 of Summer Body Prep. Quiet work."
    );
  });

  it("picks latest unlocked award for Template C", () => {
    const badges: BadgeProgress[] = [
      {
        id: "growth_pioneer",
        unlockedAt: "2026-01-01T00:00:00.000Z",
        current: 1,
        target: 1,
      },
      {
        id: "seven_day_warrior",
        unlockedAt: "2026-02-01T00:00:00.000Z",
        current: 7,
        target: 7,
      },
      {
        id: "thirty_day_consistency",
        unlockedAt: null,
        current: 2,
        target: 30,
      },
      {
        id: "hundred_day_legend",
        unlockedAt: null,
        current: 0,
        target: 100,
      },
      {
        id: "transformation_master",
        unlockedAt: null,
        current: 0,
        target: 1,
      },
    ];
    expect(pickAwardBadge(badges)?.id).toBe("seven_day_warrior");
  });

  it("journeyDayIndex is numeric from startedAt", () => {
    const d = journeyDayIndex(journey());
    expect(typeof d).toBe("number");
    expect(d).toBeGreaterThanOrEqual(0);
  });
});

describe("anti-patterns (spec lock)", () => {
  it("template blurbs never mention feed or followers", () => {
    const blob = JSON.stringify(SHARE_TEMPLATES).toLowerCase();
    expect(blob).not.toMatch(/feed|follower|like|comment|community/);
  });

  it("default caption never claims encryption / vault lock", () => {
    const c = defaultCaption(journey(), 3).toLowerCase();
    expect(c).not.toMatch(/encrypt|password|secure vault|locked vault/);
  });
});
