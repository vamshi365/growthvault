import type { AppSnapshot, EvolutionLog, Journey } from "./types";
import { deriveBadges } from "./badges";
import { DEFAULT_PROFILE, uid } from "./db";

/** SVG placeholder photos (data URLs) — no external assets required. */
function placeholder(label: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <text x="300" y="400" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-size="36" font-weight="700">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_DAY1 = placeholder("DAY 1", "#2A2A3A", "#14141C");
export const PLACEHOLDER_TODAY = placeholder("TODAY", "#7C5CFF", "#5B7CFF");

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

/** Demo: Summer Body Prep, 2 logs, streak ~5, Pioneer + 7 Day unlocked. */
export function buildDemoSnapshot(): AppSnapshot {
  const journeyId = uid("j");
  const startedAt = daysAgo(6);
  const day1 = PLACEHOLDER_DAY1;
  const today = PLACEHOLDER_TODAY;

  const journey: Journey = {
    id: journeyId,
    archiveNo: 1,
    title: "Summer Body Prep",
    ultimateGoal: "Feel strong and confident in my body by summer.",
    category: "Fitness",
    durationDays: 30,
    startedAt,
    day1PhotoUri: day1,
    todayPhotoUri: today,
    status: "active",
  };

  const logs: EvolutionLog[] = [];
  // Logs on days 6,5,4,3,2 ago → streak of 5 if today not logged; add today too for streak 6/7
  const offsets = [6, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < offsets.length; i++) {
    const n = offsets[i];
    logs.push({
      id: uid("log"),
      journeyId,
      photoUri: i === 0 ? day1 : today,
      note:
        i === 0
          ? "Day one. Starting the vault."
          : i === offsets.length - 1
            ? "Still showing up."
            : undefined,
      tags: i === 0 ? ["start"] : ["progress"],
      createdAt: daysAgo(n),
      dayIndex: 7 - n,
      captureSource: i === 0 ? "camera" : "gallery",
      referenceLogId: i === 0 ? undefined : logs[0]?.id,
    });
  }

  const profile = {
    ...DEFAULT_PROFILE,
    displayName: "Alex",
    primaryJourneyId: journeyId,
    insightSeed: 3,
  };

  const badges = deriveBadges([journey], logs, []);

  return {
    profile,
    journeys: [journey],
    logs,
    badges,
    shareEvents: [],
    grace: { frozenDayKeys: [] },
    reminderPrefs: {
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
  };
}

export function emptySnapshot(): AppSnapshot {
  return {
    profile: { ...DEFAULT_PROFILE },
    journeys: [],
    logs: [],
    badges: deriveBadges([], [], []),
    shareEvents: [],
    grace: { frozenDayKeys: [] },
    reminderPrefs: {
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
  };
}
