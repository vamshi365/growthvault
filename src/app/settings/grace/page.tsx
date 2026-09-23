"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { BackIcon } from "@/components/icons";
import { GraceBadge } from "@/components/GraceBadge";
import {
  GRACE_COOLDOWN_DAYS,
  GRACE_RULE_ID,
  canConsumeFreeze,
  daysUntilFreezeRefresh,
  freezesRemaining,
} from "@/lib/grace";
import { dayKey, addDays } from "@/lib/streaks";

export default function GraceSettingsPage() {
  const { ready, snapshot, applyFreeze, streak } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="gv-page text-gv-text-muted">Loading…</div>;
  }

  const grace = snapshot.grace;
  const left = freezesRemaining(grace);
  const refreshIn = daysUntilFreezeRefresh(grace);
  const yesterday = addDays(dayKey(new Date()), -1);
  const canFreezeYesterday = canConsumeFreeze(grace, yesterday);

  async function useFreeze() {
    setBusy(true);
    try {
      const ok = await applyFreeze(yesterday);
      setMsg(
        ok
          ? `Freeze applied for ${yesterday}. Streak protected — freeze does not count as a logged day.`
          : "No freeze available right now."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Streak grace</h1>
          <p className="text-xs text-gv-text-muted">Anti-shame · one freeze</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <GraceBadge grace={grace} />
        <span className="gv-pill border border-gv-border px-3 py-2 text-xs text-gv-text-muted">
          Streak {streak}
        </span>
      </div>

      <div className="gv-card space-y-3 p-4">
        <p className="gv-eyebrow text-gv-accent-text">Rule locked</p>
        <p className="text-sm font-semibold">
          1 free freeze / {GRACE_COOLDOWN_DAYS} days
        </p>
        <p className="text-xs leading-relaxed text-gv-text-muted">
          Rule id: <code className="text-gv-accent-text">{GRACE_RULE_ID}</code>.
          A freeze keeps your streak from breaking if you miss a day. It does{" "}
          <strong className="text-gv-text">not</strong> count as a logged day
          for 7 / 30 / 100 badges.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-gv-text-muted">
          <li>Freezes left: {left}</li>
          <li>
            {refreshIn != null
              ? `Next freeze in ~${refreshIn} day(s)`
              : "Freeze ready when you need it"}
          </li>
          <li>
            Frozen days:{" "}
            {grace.frozenDayKeys.length
              ? grace.frozenDayKeys.join(", ")
              : "none yet"}
          </li>
        </ul>
      </div>

      <button
        type="button"
        className="gv-cta w-full py-3 text-sm disabled:opacity-40"
        disabled={busy || !canFreezeYesterday || left <= 0}
        onClick={() => void useFreeze()}
      >
        {left <= 0
          ? "Freeze on cooldown"
          : `Use freeze for ${yesterday}`}
      </button>

      {msg && <p className="text-sm text-gv-accent-text">{msg}</p>}

      <p className="text-center text-xs leading-relaxed text-gv-text-muted">
        Auto-freeze may apply quietly when a single missed day would break your
        streak. No guilt copy — just room to continue.
      </p>
    </div>
  );
}
