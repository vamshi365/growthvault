"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  AppProfile,
  AppSnapshot,
  BadgeProgress,
  EvolutionLog,
  GraceState,
  Journey,
  ReminderPrefs,
  ShareEvent,
} from "./types";
import { initialBadges } from "./badges";
import { DEFAULT_GRACE } from "./grace";
import { DEFAULT_REMINDER_PREFS } from "./reminders";

interface GrowthVaultDB extends DBSchema {
  meta: { key: string; value: unknown };
  journeys: { key: string; value: Journey };
  logs: { key: string; value: EvolutionLog; indexes: { "by-journey": string } };
  badges: { key: string; value: BadgeProgress };
}

const DB_NAME = "growthvault";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GrowthVaultDB>> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = openDB<GrowthVaultDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("meta");
        db.createObjectStore("journeys", { keyPath: "id" });
        const logs = db.createObjectStore("logs", { keyPath: "id" });
        logs.createIndex("by-journey", "journeyId");
        db.createObjectStore("badges", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export const DEFAULT_PROFILE: AppProfile = {
  displayName: "Growth Seeker",
  primaryJourneyId: null,
  insightSeed: 7,
  passcodeEnabled: false,
  passcodeHash: null,
};

function normalizeGrace(raw: unknown): GraceState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GRACE, frozenDayKeys: [] };
  const g = raw as GraceState;
  return {
    lastFreezeAt: g.lastFreezeAt,
    frozenDayKeys: Array.isArray(g.frozenDayKeys) ? [...g.frozenDayKeys] : [],
  };
}

function normalizeReminderPrefs(raw: unknown): ReminderPrefs {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_REMINDER_PREFS,
      reminders: [],
      quietHours: { ...DEFAULT_REMINDER_PREFS.quietHours },
    };
  }
  const r = raw as ReminderPrefs;
  return {
    reminders: Array.isArray(r.reminders) ? r.reminders : [],
    quietHours: {
      ...DEFAULT_REMINDER_PREFS.quietHours,
      ...(r.quietHours ?? {}),
    },
    remindersUnreliable: Boolean(r.remindersUnreliable),
    unreliableBannerDismissed: Boolean(r.unreliableBannerDismissed),
  };
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const db = await getDb();
  const [
    profileRaw,
    journeys,
    logs,
    badges,
    shareEventsRaw,
    graceRaw,
    reminderRaw,
  ] = await Promise.all([
    db.get("meta", "profile"),
    db.getAll("journeys"),
    db.getAll("logs"),
    db.getAll("badges"),
    db.get("meta", "shareEvents"),
    db.get("meta", "grace"),
    db.get("meta", "reminderPrefs"),
  ]);
  const profile = {
    ...DEFAULT_PROFILE,
    ...((profileRaw as AppProfile | undefined) ?? {}),
  };
  const shareEvents = Array.isArray(shareEventsRaw)
    ? (shareEventsRaw as ShareEvent[])
    : [];
  return {
    profile,
    journeys: journeys.sort((a, b) => a.archiveNo - b.archiveNo),
    logs: logs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    badges: badges.length ? badges : initialBadges(),
    shareEvents,
    grace: normalizeGrace(graceRaw),
    reminderPrefs: normalizeReminderPrefs(reminderRaw),
  };
}

export async function saveProfile(profile: AppProfile): Promise<void> {
  const db = await getDb();
  await db.put("meta", profile, "profile");
}

export async function saveGrace(grace: GraceState): Promise<void> {
  const db = await getDb();
  await db.put("meta", grace, "grace");
}

export async function saveReminderPrefs(prefs: ReminderPrefs): Promise<void> {
  const db = await getDb();
  await db.put("meta", prefs, "reminderPrefs");
}

export async function putJourney(journey: Journey): Promise<void> {
  const db = await getDb();
  await db.put("journeys", journey);
}

export async function putLog(log: EvolutionLog): Promise<void> {
  const db = await getDb();
  await db.put("logs", log);
}

export async function putBadges(badges: BadgeProgress[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("badges", "readwrite");
  await Promise.all([...badges.map((b) => tx.store.put(b)), tx.done]);
}

export async function putShareEvents(events: ShareEvent[]): Promise<void> {
  const db = await getDb();
  await db.put("meta", events, "shareEvents");
}

export async function appendShareEvent(event: ShareEvent): Promise<ShareEvent[]> {
  const db = await getDb();
  const raw = await db.get("meta", "shareEvents");
  const prev = Array.isArray(raw) ? (raw as ShareEvent[]) : [];
  const next = [event, ...prev];
  await db.put("meta", next, "shareEvents");
  return next;
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ["meta", "journeys", "logs", "badges"],
    "readwrite"
  );
  await Promise.all([
    tx.objectStore("meta").clear(),
    tx.objectStore("journeys").clear(),
    tx.objectStore("logs").clear(),
    tx.objectStore("badges").clear(),
    tx.done,
  ]);
}

export async function writeSnapshot(snapshot: AppSnapshot): Promise<void> {
  await clearAllData();
  const db = await getDb();
  const tx = db.transaction(
    ["meta", "journeys", "logs", "badges"],
    "readwrite"
  );
  await tx.objectStore("meta").put(snapshot.profile, "profile");
  await tx
    .objectStore("meta")
    .put(snapshot.shareEvents ?? [], "shareEvents");
  await tx.objectStore("meta").put(
    snapshot.grace ?? { frozenDayKeys: [] },
    "grace"
  );
  await tx.objectStore("meta").put(
    snapshot.reminderPrefs ?? {
      reminders: [],
      quietHours: {
        enabled: false,
        startHour: 22,
        startMinute: 0,
        endHour: 7,
        endMinute: 0,
      },
      remindersUnreliable: false,
      unreliableBannerDismissed: false,
    },
    "reminderPrefs"
  );
  for (const j of snapshot.journeys) await tx.objectStore("journeys").put(j);
  for (const l of snapshot.logs) await tx.objectStore("logs").put(l);
  for (const b of snapshot.badges) await tx.objectStore("badges").put(b);
  await tx.done;
}

/** Close + delete DB — for Vitest isolation only. */
export async function resetDbForTests(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      /* ignore */
    }
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("deleteDatabase failed"));
    req.onblocked = () => resolve();
  });
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Read file as durable data URL for IDB. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
