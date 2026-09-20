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

export default function AwardsPage() {
  const { ready, snapshot } = useStore();
  const medals = medalCount(snapshot.badges);
  const next = nextIncompleteBadge(snapshot.badges);

  if (!ready) {
    return <div className="gv-page text-gv-text-muted">Loading…</div>;
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-bold">Vault Awards</h1>
          <p className="mt-1 text-sm text-gv-text-muted">
            Earn badges for your consistency.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-gv-accent text-gv-accent">
          <AwardsIcon />
        </div>
      </header>

      <div className="space-y-3">
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted text-gv-accent">
                <AwardsIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{meta.title}</p>
                <p className="text-xs text-gv-text-muted">{meta.description}</p>
                {!unlocked && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-bold tracking-wider text-gv-text-muted">
                      {progress.current} / {progress.target} PROGRESS
                    </p>
                    <ProgressBar
                      value={(progress.current / progress.target) * 100}
                    />
                  </div>
                )}
              </div>
              {unlocked ? (
                <span className="gv-pill shrink-0 bg-[rgba(159,132,255,0.18)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-gv-accent-text">
                  Unlocked
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-[28px] bg-gv-accent p-5 text-white">
        <p className="text-sm font-semibold italic tracking-wide opacity-90">
          KEEP BUILDING
        </p>
        <p className="mt-2 text-[15px] italic leading-relaxed">
          “
          {pickQuote(KEEP_BUILDING_QUOTES, snapshot.profile.insightSeed + 11)}
          ”
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[16px] bg-white/15 p-3">
            <p className="gv-eyebrow text-white/70">Next Goal</p>
            <p className="mt-1 text-sm font-bold">
              {next ? BADGE_META[next.id].title : "All unlocked"}
            </p>
          </div>
          <div className="rounded-[16px] bg-white/15 p-3">
            <p className="gv-eyebrow text-white/70">Total Medals</p>
            <p className="mt-1 text-sm font-bold">
              {medals} / {BADGE_ORDER.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
