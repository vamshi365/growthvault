import type {
  BadgeId,
  BadgeProgress,
  EvolutionLog,
  GraceState,
  Journey,
} from "./types";
import { badgeLoggedStreak } from "./streaks";

export const BADGE_META: Record<
  BadgeId,
  { title: string; description: string; target: number }
> = {
  growth_pioneer: {
    title: "Growth Pioneer",
    description: "Create your first transformation journey.",
    target: 1,
  },
  seven_day_warrior: {
    title: "7 Day Warrior",
    description: "Log on 7 consecutive calendar days (freeze days do not count).",
    target: 7,
  },
  thirty_day_consistency: {
    title: "30 Day Consistency",
    description: "Hold a 30-day logging streak (freeze days do not count).",
    target: 30,
  },
  hundred_day_legend: {
    title: "100 Day Legend",
    description: "Reach a legendary 100-day streak (freeze days do not count).",
    target: 100,
  },
  transformation_master: {
    title: "Transformation Master",
    description: "Complete a full journey duration.",
    target: 1,
  },
};

export const BADGE_ORDER: BadgeId[] = [
  "growth_pioneer",
  "seven_day_warrior",
  "thirty_day_consistency",
  "hundred_day_legend",
  "transformation_master",
];

function emptyBadges(): BadgeProgress[] {
  return BADGE_ORDER.map((id) => ({
    id,
    unlockedAt: null,
    current: 0,
    target: BADGE_META[id].target,
  }));
}

/**
 * Derive badge progress from journeys + logs.
 * Streak badges use logged-only streak (grace freezes bridge but do not count).
 * Preserves unlockedAt when already unlocked.
 */
export function deriveBadges(
  journeys: Journey[],
  logs: EvolutionLog[],
  previous: BadgeProgress[] = [],
  grace?: GraceState,
  now = new Date()
): BadgeProgress[] {
  const prevMap = new Map(previous.map((b) => [b.id, b]));
  const streak = badgeLoggedStreak(logs, now, grace?.frozenDayKeys ?? []);
  const hasJourney = journeys.length >= 1;
  const completed = journeys.some(
    (j) =>
      j.status === "completed" ||
      logs
        .filter((l) => l.journeyId === j.id)
        .some((l) => l.dayIndex >= j.durationDays)
  );

  const values: Record<BadgeId, number> = {
    growth_pioneer: hasJourney ? 1 : 0,
    seven_day_warrior: streak,
    thirty_day_consistency: streak,
    hundred_day_legend: streak,
    transformation_master: completed ? 1 : 0,
  };

  const iso = now.toISOString();
  return BADGE_ORDER.map((id) => {
    const target = BADGE_META[id].target;
    const current = Math.min(values[id], target);
    const prev = prevMap.get(id);
    const unlocked =
      current >= target ? prev?.unlockedAt ?? iso : null;
    return { id, unlockedAt: unlocked, current, target };
  });
}

export function nextIncompleteBadge(
  badges: BadgeProgress[]
): BadgeProgress | null {
  for (const id of BADGE_ORDER) {
    const b = badges.find((x) => x.id === id);
    if (b && !b.unlockedAt) return b;
  }
  return null;
}

export function medalCount(badges: BadgeProgress[]): number {
  return badges.filter((b) => b.unlockedAt).length;
}

export function initialBadges(): BadgeProgress[] {
  return emptyBadges();
}
