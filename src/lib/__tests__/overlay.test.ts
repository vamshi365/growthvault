import { describe, expect, it } from "vitest";
import {
  resolveOverlayReference,
  toReferenceLogId,
} from "@/lib/overlay";
import { buildCompareSlots } from "@/components/LogCalendarStrip";
import type { EvolutionLog, Journey } from "@/lib/types";

function journey(partial: Partial<Journey> = {}): Journey {
  return {
    id: "j1",
    archiveNo: 1,
    title: "Test",
    ultimateGoal: "Grow",
    category: "Fitness",
    durationDays: 30,
    startedAt: new Date().toISOString(),
    day1PhotoUri: "data:day1",
    todayPhotoUri: "data:today",
    status: "active",
    ...partial,
  };
}

function log(
  id: string,
  opts: Partial<EvolutionLog> = {}
): EvolutionLog {
  return {
    id,
    journeyId: "j1",
    photoUri: `data:${id}`,
    createdAt: new Date().toISOString(),
    dayIndex: 1,
    captureSource: "camera",
    ...opts,
  };
}

describe("overlay reference links", () => {
  it("prefers Day1 when present", () => {
    const logs = [log("l2", { dayIndex: 2, photoUri: "data:l2" })];
    const ref = resolveOverlayReference(journey(), logs, "day1");
    expect(ref?.label).toBe("Day 1");
    expect(ref?.photoUri).toBe("data:day1");
    expect(toReferenceLogId(ref!)).toBeUndefined(); // synthetic day1
  });

  it("links to earliest log when Day1 uri matches a log", () => {
    const day1 = log("l1", { photoUri: "data:day1", dayIndex: 1 });
    const later = log("l2", {
      photoUri: "data:l2",
      dayIndex: 5,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    });
    const ref = resolveOverlayReference(journey(), [later, day1], "day1");
    expect(ref?.kind).toBe("log");
    expect(toReferenceLogId(ref!)).toBe("l1");
  });

  it("falls back to last log when prefer=last", () => {
    const a = log("a", {
      dayIndex: 1,
      createdAt: "2026-09-01T10:00:00.000Z",
    });
    const b = log("b", {
      dayIndex: 3,
      createdAt: "2026-09-10T10:00:00.000Z",
    });
    const ref = resolveOverlayReference(journey(), [a, b], "last");
    expect(ref?.id).toBe("b");
    expect(toReferenceLogId(ref!)).toBe("b");
  });

  it("returns null when no Day1 and no logs", () => {
    const ref = resolveOverlayReference(
      journey({ day1PhotoUri: null, todayPhotoUri: null }),
      [],
      "day1"
    );
    expect(ref).toBeNull();
  });
});

describe("compare data links", () => {
  it("buildCompareSlots includes day1 + chronological logs", () => {
    const logs = [
      log("l2", {
        dayIndex: 2,
        createdAt: "2026-09-02T10:00:00.000Z",
      }),
      log("l1", {
        dayIndex: 1,
        createdAt: "2026-09-01T10:00:00.000Z",
        photoUri: "data:day1",
      }),
    ];
    const slots = buildCompareSlots("data:day1", "data:today", logs);
    expect(slots[0]?.kind).toBe("day1");
    expect(slots.filter((s) => s.kind === "log").map((s) => (s.kind === "log" ? s.log.id : ""))).toEqual(
      ["l1", "l2"]
    );
  });

  it("persisted referenceLogId round-trips on EvolutionLog shape", () => {
    const child = log("child", {
      referenceLogId: "parent",
      captureSource: "camera",
    });
    expect(child.referenceLogId).toBe("parent");
    expect(child.captureSource).toBe("camera");
  });
});

import { compositePixelAlpha } from "@/lib/overlay";

describe("true pixel alpha overlay math", () => {
  it("composites ghost over base (not multiply/screen blend)", () => {
    // base black, ghost white @ 40% → mid-gray ~102
    const [r, g, b] = compositePixelAlpha(0, 0, 0, 255, 255, 255, 0.4);
    expect(r).toBe(102);
    expect(g).toBe(102);
    expect(b).toBe(102);
  });

  it("a=0 keeps destination; a=1 replaces with source", () => {
    expect(compositePixelAlpha(10, 20, 30, 200, 210, 220, 0)).toEqual([
      10, 20, 30,
    ]);
    expect(compositePixelAlpha(10, 20, 30, 200, 210, 220, 1)).toEqual([
      200, 210, 220,
    ]);
  });
});
