"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppProfile,
  AppSnapshot,
  Category,
  EvolutionLog,
  Journey,
} from "./types";
import {
  clearAllData,
  DEFAULT_PROFILE,
  fileToDataUrl,
  loadSnapshot,
  putBadges,
  putJourney,
  putLog,
  saveProfile,
  uid,
  writeSnapshot,
} from "./db";
import { deriveBadges } from "./badges";
import { buildDemoSnapshot, emptySnapshot, PLACEHOLDER_DAY1 } from "./demo";
import { currentStreak, daysSinceStart, longestStreak } from "./streaks";

type CreateJourneyInput = {
  title: string;
  ultimateGoal: string;
  category: Category;
  durationDays: number;
  day1PhotoUri?: string | null;
};

type AddLogInput = {
  journeyId: string;
  photoUri: string;
  note?: string;
  tags?: string[];
  referenceLogId?: string;
  captureSource?: "camera" | "gallery";
};

type StoreValue = {
  ready: boolean;
  snapshot: AppSnapshot;
  streak: number;
  longest: number;
  refresh: () => Promise<void>;
  createJourney: (input: CreateJourneyInput) => Promise<Journey>;
  addLog: (input: AddLogInput) => Promise<EvolutionLog>;
  updateJourney: (journey: Journey) => Promise<void>;
  setPrimary: (id: string | null) => Promise<void>;
  updateProfile: (patch: Partial<AppProfile>) => Promise<void>;
  loadDemo: () => Promise<void>;
  clearData: () => Promise<void>;
  completeJourney: (id: string) => Promise<void>;
  readPhotoFile: (file: File) => Promise<string>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot());

  const refresh = useCallback(async () => {
    try {
      const snap = await loadSnapshot();
      const badges = deriveBadges(snap.journeys, snap.logs, snap.badges);
      if (JSON.stringify(badges) !== JSON.stringify(snap.badges)) {
        await putBadges(badges);
        snap.badges = badges;
      }
      setSnapshot(snap);
    } catch {
      setSnapshot(emptySnapshot());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const persistBadges = useCallback(
    async (journeys: Journey[], logs: EvolutionLog[], prev = snapshot.badges) => {
      const badges = deriveBadges(journeys, logs, prev);
      await putBadges(badges);
      return badges;
    },
    [snapshot.badges]
  );

  const createJourney = useCallback(
    async (input: CreateJourneyInput) => {
      const archiveNo =
        snapshot.journeys.reduce((m, j) => Math.max(m, j.archiveNo), 0) + 1;
      const journey: Journey = {
        id: uid("j"),
        archiveNo,
        title: input.title.trim(),
        ultimateGoal: input.ultimateGoal.trim(),
        category: input.category,
        durationDays: input.durationDays,
        startedAt: new Date().toISOString(),
        day1PhotoUri: input.day1PhotoUri ?? PLACEHOLDER_DAY1,
        todayPhotoUri: input.day1PhotoUri ?? PLACEHOLDER_DAY1,
        status: "active",
      };
      await putJourney(journey);
      const journeys = [...snapshot.journeys, journey];
      const profile = {
        ...snapshot.profile,
        primaryJourneyId: journey.id,
      };
      await saveProfile(profile);
      const badges = await persistBadges(journeys, snapshot.logs);
      setSnapshot({ ...snapshot, profile, journeys, badges });
      return journey;
    },
    [snapshot, persistBadges]
  );

  const addLog = useCallback(
    async (input: AddLogInput) => {
      const journey = snapshot.journeys.find((j) => j.id === input.journeyId);
      if (!journey) throw new Error("Journey not found");
      const dayIndex = daysSinceStart(journey.startedAt);
      const log: EvolutionLog = {
        id: uid("log"),
        journeyId: input.journeyId,
        photoUri: input.photoUri,
        note: input.note?.trim() || undefined,
        tags: input.tags,
        createdAt: new Date().toISOString(),
        dayIndex,
        referenceLogId: input.referenceLogId,
        captureSource: input.captureSource ?? "gallery",
      };
      const updatedJourney: Journey = {
        ...journey,
        todayPhotoUri: input.photoUri,
        day1PhotoUri: journey.day1PhotoUri ?? input.photoUri,
        status:
          dayIndex >= journey.durationDays ? "completed" : journey.status,
      };
      await putLog(log);
      await putJourney(updatedJourney);
      const journeys = snapshot.journeys.map((j) =>
        j.id === updatedJourney.id ? updatedJourney : j
      );
      const logs = [log, ...snapshot.logs];
      const badges = await persistBadges(journeys, logs);
      setSnapshot({ ...snapshot, journeys, logs, badges });
      return log;
    },
    [snapshot, persistBadges]
  );

  const updateJourney = useCallback(
    async (journey: Journey) => {
      await putJourney(journey);
      const journeys = snapshot.journeys.map((j) =>
        j.id === journey.id ? journey : j
      );
      const badges = await persistBadges(journeys, snapshot.logs);
      setSnapshot({ ...snapshot, journeys, badges });
    },
    [snapshot, persistBadges]
  );

  const setPrimary = useCallback(
    async (id: string | null) => {
      const profile = { ...snapshot.profile, primaryJourneyId: id };
      await saveProfile(profile);
      setSnapshot({ ...snapshot, profile });
    },
    [snapshot]
  );

  const updateProfile = useCallback(
    async (patch: Partial<AppProfile>) => {
      const profile = { ...snapshot.profile, ...patch };
      await saveProfile(profile);
      setSnapshot({ ...snapshot, profile });
    },
    [snapshot]
  );

  const loadDemo = useCallback(async () => {
    const demo = buildDemoSnapshot();
    await writeSnapshot(demo);
    setSnapshot(demo);
  }, []);

  const clearData = useCallback(async () => {
    await clearAllData();
    const empty = emptySnapshot();
    await saveProfile(DEFAULT_PROFILE);
    await putBadges(empty.badges);
    setSnapshot(empty);
  }, []);

  const completeJourney = useCallback(
    async (id: string) => {
      const journey = snapshot.journeys.find((j) => j.id === id);
      if (!journey) return;
      const updated = { ...journey, status: "completed" as const };
      await putJourney(updated);
      const journeys = snapshot.journeys.map((j) =>
        j.id === id ? updated : j
      );
      const badges = await persistBadges(journeys, snapshot.logs);
      setSnapshot({ ...snapshot, journeys, badges });
    },
    [snapshot, persistBadges]
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      snapshot,
      streak: currentStreak(snapshot.logs),
      longest: longestStreak(snapshot.logs),
      refresh,
      createJourney,
      addLog,
      updateJourney,
      setPrimary,
      updateProfile,
      loadDemo,
      clearData,
      completeJourney,
      readPhotoFile: fileToDataUrl,
    }),
    [
      ready,
      snapshot,
      refresh,
      createJourney,
      addLog,
      updateJourney,
      setPrimary,
      updateProfile,
      loadDemo,
      clearData,
      completeJourney,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
