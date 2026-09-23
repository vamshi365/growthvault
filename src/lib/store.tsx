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
  GraceState,
  Journey,
  ReminderPrefs,
  ShareEvent,
  ShareTemplateId,
} from "./types";
import {
  appendShareEvent,
  clearAllData,
  DEFAULT_PROFILE,
  fileToDataUrl,
  loadSnapshot,
  putBadges,
  putJourney,
  putLog,
  saveGrace,
  saveProfile,
  saveReminderPrefs,
  uid,
  writeSnapshot,
} from "./db";
import { deriveBadges } from "./badges";
import { buildDemoSnapshot, emptySnapshot, PLACEHOLDER_DAY1 } from "./demo";
import {
  currentStreak,
  dayKey,
  daysSinceStart,
  loggedDayKeys,
  longestStreak,
} from "./streaks";
import {
  canConsumeFreeze,
  consumeFreeze,
  freezesRemaining,
  maybeAutoFreeze,
} from "./grace";
import { syncLocalReminders, withUnreliableFlag } from "./notifications";
import { pushWidgetData } from "./widgetBridge";

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
  freezesLeft: number;
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
  recordShareEvent: (input: {
    templateId: ShareTemplateId;
    journeyId: string;
    logIds: string[];
  }) => Promise<ShareEvent>;
  shareEventCount: number;
  /** Manual freeze for a missed calendar day (YYYY-MM-DD). */
  applyFreeze: (day?: string) => Promise<boolean>;
  updateReminderPrefs: (prefs: ReminderPrefs) => Promise<void>;
  dismissUnreliableBanner: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

async function syncWidgetFromSnap(snap: AppSnapshot) {
  const frozen = snap.grace?.frozenDayKeys ?? [];
  const streak = currentStreak(snap.logs, new Date(), frozen);
  const active = snap.journeys.filter((j) => j.status === "active");
  const primary =
    active.find((j) => j.id === snap.profile.primaryJourneyId) ??
    active[0] ??
    null;
  const dayLabel = primary
    ? `Day ${daysSinceStart(primary.startedAt)}`
    : "Open to log";
  await pushWidgetData({
    streak,
    journeyTitle: primary?.title ?? "GrowthVault",
    dayLabel,
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot());

  const refresh = useCallback(async () => {
    try {
      let snap = await loadSnapshot();
      const auto = maybeAutoFreeze(
        loggedDayKeys(snap.logs),
        snap.grace,
        new Date()
      );
      if (auto.appliedDay) {
        await saveGrace(auto.grace);
        snap = { ...snap, grace: auto.grace };
      }
      const badges = deriveBadges(
        snap.journeys,
        snap.logs,
        snap.badges,
        snap.grace
      );
      if (JSON.stringify(badges) !== JSON.stringify(snap.badges)) {
        await putBadges(badges);
        snap.badges = badges;
      }
      setSnapshot(snap);
      void syncWidgetFromSnap(snap);
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
    async (
      journeys: Journey[],
      logs: EvolutionLog[],
      grace: GraceState,
      prev = snapshot.badges
    ) => {
      const badges = deriveBadges(journeys, logs, prev, grace);
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
      const badges = await persistBadges(
        journeys,
        snapshot.logs,
        snapshot.grace
      );
      const next = { ...snapshot, profile, journeys, badges };
      setSnapshot(next);
      void syncWidgetFromSnap(next);
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
      const badges = await persistBadges(journeys, logs, snapshot.grace);
      const next = { ...snapshot, journeys, logs, badges };
      setSnapshot(next);
      void syncWidgetFromSnap(next);
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
      const badges = await persistBadges(
        journeys,
        snapshot.logs,
        snapshot.grace
      );
      const next = { ...snapshot, journeys, badges };
      setSnapshot(next);
      void syncWidgetFromSnap(next);
    },
    [snapshot, persistBadges]
  );

  const setPrimary = useCallback(
    async (id: string | null) => {
      const profile = { ...snapshot.profile, primaryJourneyId: id };
      await saveProfile(profile);
      const next = { ...snapshot, profile };
      setSnapshot(next);
      void syncWidgetFromSnap(next);
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
    void syncWidgetFromSnap(demo);
  }, []);

  const clearData = useCallback(async () => {
    await clearAllData();
    const empty = emptySnapshot();
    await saveProfile(DEFAULT_PROFILE);
    await putBadges(empty.badges);
    await saveGrace(empty.grace);
    await saveReminderPrefs(empty.reminderPrefs);
    setSnapshot(empty);
    void syncWidgetFromSnap(empty);
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
      const badges = await persistBadges(
        journeys,
        snapshot.logs,
        snapshot.grace
      );
      setSnapshot({ ...snapshot, journeys, badges });
    },
    [snapshot, persistBadges]
  );

  const recordShareEvent = useCallback(
    async (input: {
      templateId: ShareTemplateId;
      journeyId: string;
      logIds: string[];
    }) => {
      const event: ShareEvent = {
        id: uid("share"),
        createdAt: new Date().toISOString(),
        templateId: input.templateId,
        journeyId: input.journeyId,
        logIds: input.logIds,
      };
      const shareEvents = await appendShareEvent(event);
      setSnapshot((prev) => ({ ...prev, shareEvents }));
      return event;
    },
    []
  );

  const applyFreeze = useCallback(
    async (day?: string) => {
      const target = day ?? dayKey(addDaysDate(new Date(), -1));
      if (!canConsumeFreeze(snapshot.grace, target)) return false;
      const grace = consumeFreeze(snapshot.grace, target);
      await saveGrace(grace);
      const badges = await persistBadges(
        snapshot.journeys,
        snapshot.logs,
        grace
      );
      const next = { ...snapshot, grace, badges };
      setSnapshot(next);
      void syncWidgetFromSnap(next);
      return true;
    },
    [snapshot, persistBadges]
  );

  const updateReminderPrefs = useCallback(
    async (prefs: ReminderPrefs) => {
      const titles: Record<string, string> = {};
      for (const j of snapshot.journeys) titles[j.id] = j.title;
      const result = await syncLocalReminders(prefs, titles);
      const nextPrefs = withUnreliableFlag(
        prefs,
        result.unreliable || !result.ok ? true : prefs.remindersUnreliable
      );
      // If schedule succeeded and user hadn't flagged, keep prior unreliable unless fail
      const finalPrefs =
        result.ok && !result.unreliable
          ? { ...prefs, remindersUnreliable: prefs.remindersUnreliable }
          : nextPrefs;
      await saveReminderPrefs(finalPrefs);
      setSnapshot((prev) => ({ ...prev, reminderPrefs: finalPrefs }));
    },
    [snapshot.journeys]
  );

  const dismissUnreliableBanner = useCallback(async () => {
    const prefs = {
      ...snapshot.reminderPrefs,
      unreliableBannerDismissed: true,
    };
    await saveReminderPrefs(prefs);
    setSnapshot((prev) => ({ ...prev, reminderPrefs: prefs }));
  }, [snapshot.reminderPrefs]);

  const frozen = snapshot.grace?.frozenDayKeys ?? [];
  const value = useMemo<StoreValue>(
    () => ({
      ready,
      snapshot,
      streak: currentStreak(snapshot.logs, new Date(), frozen),
      longest: longestStreak(snapshot.logs, frozen),
      freezesLeft: freezesRemaining(snapshot.grace),
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
      recordShareEvent,
      shareEventCount: snapshot.shareEvents?.length ?? 0,
      applyFreeze,
      updateReminderPrefs,
      dismissUnreliableBanner,
    }),
    [
      ready,
      snapshot,
      frozen,
      refresh,
      createJourney,
      addLog,
      updateJourney,
      setPrimary,
      updateProfile,
      loadDemo,
      clearData,
      completeJourney,
      recordShareEvent,
      applyFreeze,
      updateReminderPrefs,
      dismissUnreliableBanner,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

function addDaysDate(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
