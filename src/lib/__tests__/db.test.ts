import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAllData,
  DEFAULT_PROFILE,
  loadSnapshot,
  putBadges,
  putJourney,
  putLog,
  resetDbForTests,
  saveProfile,
  uid,
  writeSnapshot,
} from "@/lib/db";
import { initialBadges } from "@/lib/badges";
import type { EvolutionLog, Journey } from "@/lib/types";

function makeJourney(id = "j_test"): Journey {
  return {
    id,
    archiveNo: 1,
    title: "Morning Strength",
    ultimateGoal: "Build consistency",
    category: "Fitness",
    durationDays: 30,
    startedAt: new Date().toISOString(),
    day1PhotoUri: "data:image/png;base64,aaa",
    todayPhotoUri: null,
    status: "active",
  };
}

function makeLog(journeyId: string, id = "l_test"): EvolutionLog {
  return {
    id,
    journeyId,
    photoUri: "data:image/png;base64,bbb",
    note: "Felt strong",
    tags: ["gym"],
    createdAt: new Date().toISOString(),
    dayIndex: 1,
  };
}

describe("IndexedDB CRUD", () => {
  beforeEach(async () => {
    await resetDbForTests();
  });

  it("loads empty snapshot defaults", async () => {
    const snap = await loadSnapshot();
    expect(snap.profile.displayName).toBe(DEFAULT_PROFILE.displayName);
    expect(snap.journeys).toEqual([]);
    expect(snap.logs).toEqual([]);
    expect(snap.badges).toHaveLength(5);
  });

  it("creates and reads a journey (putJourney)", async () => {
    const j = makeJourney(uid("j"));
    await putJourney(j);
    const snap = await loadSnapshot();
    expect(snap.journeys).toHaveLength(1);
    expect(snap.journeys[0].title).toBe("Morning Strength");
    expect(snap.journeys[0].id).toBe(j.id);
  });

  it("creates and reads a log tied to journey", async () => {
    const j = makeJourney("j1");
    await putJourney(j);
    await putLog(makeLog("j1", "l1"));
    const snap = await loadSnapshot();
    expect(snap.logs).toHaveLength(1);
    expect(snap.logs[0].journeyId).toBe("j1");
    expect(snap.logs[0].note).toBe("Felt strong");
  });

  it("saves profile and badges", async () => {
    await saveProfile({
      ...DEFAULT_PROFILE,
      displayName: "Alex",
      primaryJourneyId: "j1",
    });
    const badges = initialBadges().map((b) =>
      b.id === "growth_pioneer"
        ? { ...b, current: 1, unlockedAt: new Date().toISOString() }
        : b
    );
    await putBadges(badges);
    const snap = await loadSnapshot();
    expect(snap.profile.displayName).toBe("Alex");
    expect(snap.badges.find((b) => b.id === "growth_pioneer")?.unlockedAt).toBeTruthy();
  });

  it("writeSnapshot replaces all stores", async () => {
    await putJourney(makeJourney("old"));
    await writeSnapshot({
      profile: { ...DEFAULT_PROFILE, displayName: "Fresh" },
      journeys: [makeJourney("new")],
      logs: [makeLog("new", "l_new")],
      badges: initialBadges(),
    });
    const snap = await loadSnapshot();
    expect(snap.profile.displayName).toBe("Fresh");
    expect(snap.journeys.map((j) => j.id)).toEqual(["new"]);
    expect(snap.logs).toHaveLength(1);
  });

  it("clearAllData wipes journeys/logs/badges/meta", async () => {
    await putJourney(makeJourney());
    await putLog(makeLog("j_test"));
    await clearAllData();
    const snap = await loadSnapshot();
    expect(snap.journeys).toEqual([]);
    expect(snap.logs).toEqual([]);
    expect(snap.profile.displayName).toBe(DEFAULT_PROFILE.displayName);
  });
});
