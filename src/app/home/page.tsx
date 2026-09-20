"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { pickQuote, DAILY_INSIGHTS, EVOLUTION_INSIGHTS } from "@/lib/quotes";
import {
  EmptyState,
  HeroSplitCard,
  InsightCard,
  JourneyListCard,
  ProfileButton,
  QuickStatPair,
} from "@/components/ui";

export default function HomePage() {
  const { ready, snapshot, streak } = useStore();
  const active = snapshot.journeys.filter((j) => j.status === "active");
  const primary =
    active.find((j) => j.id === snapshot.profile.primaryJourneyId) ??
    active[0] ??
    null;
  const primaryLogs = primary
    ? snapshot.logs.filter((l) => l.journeyId === primary.id)
    : [];

  if (!ready) {
    return (
      <div className="gv-page flex items-center justify-center text-gv-text-muted">
        Loading vault…
      </div>
    );
  }

  const hasJourneys = active.length > 0;

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          {hasJourneys && primary ? (
            <p className="gv-eyebrow text-gv-accent-text">
              Archive No. {primary.archiveNo}
            </p>
          ) : (
            <p className="text-sm text-gv-text-muted">Welcome back,</p>
          )}
          <h1 className="text-[28px] font-bold leading-tight">GrowthVault</h1>
        </div>
        <ProfileButton />
      </header>

      {hasJourneys && primary && (
        <HeroSplitCard
          journey={primary}
          streak={streak}
          logCount={primaryLogs.length}
        />
      )}

      <InsightCard
        title={hasJourneys ? "Evolution Insight" : "Daily Insight"}
        quote={pickQuote(
          hasJourneys ? EVOLUTION_INSIGHTS : DAILY_INSIGHTS,
          snapshot.profile.insightSeed
        )}
      />

      <QuickStatPair streak={streak} logs={snapshot.logs.length} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Active Journeys</h2>
          <Link
            href="/journeys/new"
            className="gv-pill border border-gv-border px-3 py-1.5 text-xs font-semibold text-gv-accent-text"
          >
            + New
          </Link>
        </div>

        {!hasJourneys ? (
          <EmptyState
            title="Start your first journey"
            body="Document Day 1. Come back for Today. Build your vault."
            actionHref="/journeys/new"
            actionLabel="Begin Journey"
          />
        ) : (
          <div className="space-y-3">
            {active.map((j) => (
              <JourneyListCard
                key={j.id}
                journey={j}
                logs={snapshot.logs.filter((l) => l.journeyId === j.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
