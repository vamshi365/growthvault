"use client";

import { useStore } from "@/lib/store";
import {
  BADGE_META,
  BADGE_ORDER,
  medalCount,
  nextIncompleteBadge,
} from "@/lib/badges";
import { KEEP_BUILDING_QUOTES, pickQuote } from "@/lib/quotes";
import { AwardsIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ui";
import { GraceBadge } from "@/components/GraceBadge";

export default function AwardsPage() {
  const { ready, snapshot } = useStore();
  const medals = medalCount(snapshot.badges);
  const next = nextIncompleteBadge(snapshot.badges);

  if (!ready) {
    return (
      <div className="gv-page flex min-h-[60vh] items-center justify-center text-gv-text-muted">
        Loading vault…
      </div>
    );
  }

  return (
    <div className="gv-page">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="gv-title">Vault Awards</h1>
          <p className="mt-1 text-sm text-gv-text-muted">
            Earn badges for your consistency.
          </p>
        </div>
        <div className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-accent text-gv-accent">
          <AwardsIcon />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <GraceBadge grace={snapshot.grace} />
        <p className="text-xs text-gv-text-muted">
          Freeze days bridge streaks but do not count toward 7/30/100.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {BADGE_ORDER.map((id) => {
          const meta = BADGE_META[id];
          const progress =
            snapshot.badges.find((b) => b.id === id) ?? {
              id,
              unlockedAt: null,
              current: 0,
              target: meta.target,
            };
          const unlocked = Boolean(progress.unlockedAt);
          return (
            <div key={id} className="gv-card flex items-center gap-3 p-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted ${
                  unlocked
                    ? "text-gv-accent"
                    : "text-gv-text-muted opacity-60"
                }`}
              >
                <AwardsIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{meta.title}</p>
                <p className="text-xs text-gv-text-muted">{meta.description}</p>
                {!unlocked && (
                  <div className="mt-2">
                    <ProgressBar
                      value={(progress.current / progress.target) * 100}
                    />
                    <p className="gv-eyebrow mt-1.5 text-[#A1A1AA]">
                      {progress.current} / {progress.target} PROGRESS
                    </p>
                  </div>
                )}
              </div>
              {unlocked ? (
                <span className="gv-pill shrink-0 bg-[rgba(159,132,255,0.2)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-gv-accent-text">
                  Unlocked
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 rounded-[28px] bg-gv-accent p-5 text-white">
        <p className="text-sm font-semibold italic tracking-wide opacity-90">
          KEEP BUILDING
        </p>
        <p className="mt-2 text-[15px] italic leading-relaxed">
          “
          {pickQuote(KEEP_BUILDING_QUOTES, snapshot.profile.insightSeed + 11)}
          ”
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[16px] bg-white/10 p-3">
            <p className="gv-eyebrow text-white/80">Next Goal</p>
            <p className="mt-1 text-sm font-bold">
              {next ? BADGE_META[next.id].title : "All unlocked"}
            </p>
          </div>
          <div className="rounded-[16px] bg-white/10 p-3">
            <p className="gv-eyebrow text-white/80">Total Medals</p>
            <p className="mt-1 text-sm font-bold">
              {medals} / {BADGE_ORDER.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
