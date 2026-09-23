import type { EvolutionLog, GraceState } from "./types";

/** Calendar day key YYYY-MM-DD in local time. */
export function dayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dayKey(dt);
}

/** Unique calendar days that have ≥1 log (global across journeys). */
export function loggedDayKeys(logs: EvolutionLog[]): Set<string> {
  const set = new Set<string>();
  for (const log of logs) set.add(dayKey(log.createdAt));
  return set;
}

/** Logged days ∪ freeze-bridged days (streak continuity only). */
export function streakCoverageKeys(
  logs: EvolutionLog[],
  frozenDayKeys: string[] = []
): Set<string> {
  const set = loggedDayKeys(logs);
  for (const k of frozenDayKeys) set.add(k);
  return set;
}

/**
 * Current streak: consecutive calendar days ending today or yesterday.
 * Frozen days bridge gaps (prevent break) and count toward display streak.
 * Documented choice: GLOBAL streak.
 */
export function currentStreak(
  logs: EvolutionLog[],
  now = new Date(),
  frozenDayKeys: string[] = []
): number {
  const days = streakCoverageKeys(logs, frozenDayKeys);
  if (days.size === 0) return 0;
  let cursor = dayKey(now);
  if (!days.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!days.has(cursor)) return 0;
  }
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Badge streak (7/30/100): consecutive run length counting ONLY logged days.
 * Freeze bridges keep the run alive but do not increment badge progress.
 */
export function badgeLoggedStreak(
  logs: EvolutionLog[],
  now = new Date(),
  frozenDayKeys: string[] = []
): number {
  const logged = loggedDayKeys(logs);
  const frozen = new Set(frozenDayKeys);
  if (logged.size === 0) return 0;

  let cursor = dayKey(now);
  const covered = (k: string) => logged.has(k) || frozen.has(k);
  if (!covered(cursor)) {
    cursor = addDays(cursor, -1);
    if (!covered(cursor)) return 0;
  }

  let loggedCount = 0;
  while (covered(cursor)) {
    if (logged.has(cursor)) loggedCount += 1;
    cursor = addDays(cursor, -1);
  }
  return loggedCount;
}

/** Longest historical consecutive run (logged ∪ frozen). */
export function longestStreak(
  logs: EvolutionLog[],
  frozenDayKeys: string[] = []
): number {
  const days = streakCoverageKeys(logs, frozenDayKeys);
  if (days.size === 0) return 0;
  const sorted = Array.from(days).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDays(sorted[i - 1], 1)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function daysSinceStart(startedAt: string, now = new Date()): number {
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export function journeyProgress(
  dayIndex: number,
  durationDays: number
): number {
  if (durationDays <= 0) return 0;
  return Math.min(100, Math.round((dayIndex / durationDays) * 100));
}

export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now.getTime() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function graceFromSnapshot(grace?: GraceState): string[] {
  return grace?.frozenDayKeys ?? [];
}
