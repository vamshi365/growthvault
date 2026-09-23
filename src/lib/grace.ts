import type { GraceState } from "./types";
import { dayKey } from "./streaks";

/** Locked v2.3 rule: 1 free freeze every 30 calendar days. */
export const GRACE_RULE_ID = "one_freeze_per_30_days" as const;
export const GRACE_COOLDOWN_DAYS = 30;

export const DEFAULT_GRACE: GraceState = {
  frozenDayKeys: [],
};

export function freezesRemaining(
  grace: GraceState,
  now = new Date()
): number {
  if (!grace.lastFreezeAt) return 1;
  const last = new Date(grace.lastFreezeAt);
  const elapsedMs = now.getTime() - last.getTime();
  const days = elapsedMs / 86400000;
  return days >= GRACE_COOLDOWN_DAYS ? 1 : 0;
}

export function daysUntilFreezeRefresh(
  grace: GraceState,
  now = new Date()
): number | null {
  if (!grace.lastFreezeAt) return null;
  if (freezesRemaining(grace, now) > 0) return null;
  const last = new Date(grace.lastFreezeAt);
  const refreshAt = last.getTime() + GRACE_COOLDOWN_DAYS * 86400000;
  return Math.max(0, Math.ceil((refreshAt - now.getTime()) / 86400000));
}

export function canConsumeFreeze(
  grace: GraceState,
  day: string,
  now = new Date()
): boolean {
  if (freezesRemaining(grace, now) <= 0) return false;
  if (grace.frozenDayKeys.includes(day)) return false;
  return true;
}

/**
 * Consume one freeze for a calendar day.
 * Freeze bridges streak gaps; does NOT create a log.
 */
export function consumeFreeze(
  grace: GraceState,
  day: string,
  now = new Date()
): GraceState {
  if (!canConsumeFreeze(grace, day, now)) return grace;
  return {
    lastFreezeAt: now.toISOString(),
    frozenDayKeys: [...new Set([...grace.frozenDayKeys, day])].sort(),
  };
}

/**
 * If streak would be broken (no log today or yesterday) but a single
 * missing day can be bridged and a freeze is available, auto-apply.
 * Quiet retention — no guilt copy at call site.
 */
export function maybeAutoFreeze(
  loggedKeys: Set<string>,
  grace: GraceState,
  now = new Date()
): { grace: GraceState; appliedDay: string | null } {
  if (freezesRemaining(grace, now) <= 0) {
    return { grace, appliedDay: null };
  }
  const today = dayKey(now);
  const yesterday = addDayKey(today, -1);
  const dayBefore = addDayKey(today, -2);

  const covered = (k: string) =>
    loggedKeys.has(k) || grace.frozenDayKeys.includes(k);

  // Already have coverage through yesterday → no auto freeze needed
  if (covered(today) || covered(yesterday)) {
    return { grace, appliedDay: null };
  }

  // Need a bridge on yesterday, and day-before must already be covered
  if (!covered(dayBefore)) {
    return { grace, appliedDay: null };
  }

  if (!canConsumeFreeze(grace, yesterday, now)) {
    return { grace, appliedDay: null };
  }

  return {
    grace: consumeFreeze(grace, yesterday, now),
    appliedDay: yesterday,
  };
}

function addDayKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dayKey(dt);
}
