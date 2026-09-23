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
import { GraceBadge } from "@/components/GraceBadge";
import { RemindersUnreliableBanner } from "@/components/RemindersUnreliableBanner";

export default function HomePage() {
  const { ready, snapshot, streak, dismissUnreliableBanner } = useStore();
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
      <div className="gv-page flex min-h-[60vh] items-center justify-center text-gv-text-muted">
        Loading vault…
      </div>
    );
  }

  const hasJourneys = active.length > 0;

  return (
    <div className="gv-page">
      <RemindersUnreliableBanner
        prefs={snapshot.reminderPrefs}
        onDismiss={() => void dismissUnreliableBanner()}
      />

      <div className="mb-1 flex flex-wrap items-center gap-2">
        <GraceBadge grace={snapshot.grace} compact />
      </div>

      <header className="flex items-start justify-between gap-3">
        <div>
          {hasJourneys && primary ? (
            <p className="gv-eyebrow text-gv-accent-text">
              Archive No. {primary.archiveNo}
            </p>
          ) : (
            <p className="text-sm text-gv-text-muted">Welcome back,</p>
          )}
          <h1 className="gv-title">GrowthVault</h1>
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
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="gv-section-title">Active Journeys</h2>
          {hasJourneys && (
            <Link
              href="/journeys/new"
              className="gv-pill inline-flex min-h-[44px] items-center border border-gv-border px-4 text-xs font-semibold text-gv-accent-text"
            >
              + New
            </Link>
          )}
        </div>

        {!hasJourneys ? (
          <EmptyState
            title="Start your first journey"
            body="Document Day 1. Come back for Today. Build your vault."
            actionHref="/journeys/new"
            actionLabel="Begin Journey"
            hint="Takes under a minute"
          />
        ) : (
          <div className="flex flex-col gap-3">
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
