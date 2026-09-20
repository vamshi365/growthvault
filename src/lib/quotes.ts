/** Static insight pools — not AI-generated. */
export const DAILY_INSIGHTS = [
  "Small daily improvements are the key to staggering long-term results.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Consistency compounds. Show up again today.",
  "Progress is not always visible — log it so you can see it later.",
  "The only bad workout is the one that didn’t happen.",
  "Identity change begins when you act like the person you want to become.",
  "Archive today’s version of you. Future you will thank you.",
];

export const EVOLUTION_INSIGHTS = [
  "Your Day 1 photo is proof you started. Your Today photo is proof you stayed.",
  "Transformation is a gallery of quiet days stacked together.",
  "Compare yourself to yesterday, not to strangers.",
  "Every log is a receipt of effort.",
  "Streaks break. Character rebuilds them.",
  "The vault remembers what your mind forgets.",
];

export const KEEP_BUILDING_QUOTES = [
  "Medals follow momentum. Keep logging.",
  "The next badge is one consistent day away.",
  "You are building an archive of proof.",
];

export function pickQuote(pool: string[], seed: number, dayKey?: string): string {
  const day =
    dayKey ??
    new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const n = seed + Number(day) % 997;
  return pool[Math.abs(n) % pool.length];
}
