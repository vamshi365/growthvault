"use client";

import Link from "next/link";
import { freezesRemaining, daysUntilFreezeRefresh } from "@/lib/grace";
import type { GraceState } from "@/lib/types";

type Props = {
  grace: GraceState;
  compact?: boolean;
};

/**
 * Quiet grace inventory chip — never guilt copy.
 * Accent #9F84FF on vault #0B0B10.
 */
export function GraceBadge({ grace, compact }: Props) {
  const left = freezesRemaining(grace);
  const refreshIn = daysUntilFreezeRefresh(grace);
  const label =
    left > 0
      ? compact
        ? "Grace available"
        : "1 freeze available"
      : compact
        ? "Grace used"
        : refreshIn != null
          ? `Freeze refreshes in ${refreshIn}d`
          : "No freeze left";

  return (
    <Link
      href="/settings/grace"
      className="gv-pill inline-flex min-h-[44px] items-center gap-2 border border-gv-border bg-[rgba(159,132,255,0.12)] px-3 text-xs font-semibold text-gv-accent-text"
      title="Streak grace — freeze prevents a break; does not count as a logged day"
    >
      <span aria-hidden className="text-gv-accent">
        ❄
      </span>
      <span>{label}</span>
    </Link>
  );
}
