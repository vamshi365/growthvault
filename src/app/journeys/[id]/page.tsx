"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  daysSinceStart,
  journeyProgress,
} from "@/lib/streaks";
import {
  BackIcon,
  CalendarIcon,
  CompareIcon,
  GridIcon,
  ListIcon,
  ShareIcon,
} from "@/components/icons";
import {
  CategoryPill,
  EmptyState,
  LogThumb,
  ProgressBar,
} from "@/components/ui";

type SubTab = "log" | "calendar" | "stats" | "edit";

export default function JourneyDetailPage() {
  const params = useParams<{ id: string }>();
  const { ready, snapshot, streak, completeJourney } = useStore();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sub, setSub] = useState<SubTab>("log");

  const journey = snapshot.journeys.find((j) => j.id === params.id);
  const logs = useMemo(
    () => snapshot.logs.filter((l) => l.journeyId === params.id),
    [snapshot.logs, params.id]
  );

  if (!ready) {
    return <div className="gv-page text-gv-text-muted">Loading…</div>;
  }
  if (!journey) {
    return (
      <div className="gv-page">
        <EmptyState
          title="Journey not found"
          body="This journey id is missing or was cleared from local storage."
          actionHref="/home"
          actionLabel="Back to Home"
        />
      </div>
    );
  }

  const day = daysSinceStart(journey.startedAt);
  const latest = logs[0]?.dayIndex ?? day;
  const pct = journeyProgress(latest, journey.durationDays);
  const canComplete =
    journey.status === "active" && latest >= journey.durationDays;

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
          >
            <BackIcon />
          </Link>
          <h1 className="max-w-[180px] truncate text-lg font-bold">
            {journey.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/journeys/${journey.id}/calendar`}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted text-gv-accent"
            aria-label="Calendar"
          >
            <CalendarIcon />
          </Link>
          <Link
            href={`/journeys/${journey.id}/compare`}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted text-gv-accent"
            aria-label="Compare"
          >
            <CompareIcon />
          </Link>
          <Link
            href={`/share/compose?journeyId=${encodeURIComponent(journey.id)}&template=before_after`}
            className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted text-gv-accent"
            aria-label="Share card"
            data-share-entry="journey"
          >
            <ShareIcon />
          </Link>
        </div>
      </header>

      {/* Hero split */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[28px]">
        <div className="relative aspect-[3/4] bg-gv-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={journey.day1PhotoUri ?? ""}
            alt="Day 1"
            className="h-full w-full object-cover grayscale"
          />
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
            DAY 1
          </span>
        </div>
        <div className="relative aspect-[3/4] bg-gv-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={journey.todayPhotoUri ?? journey.day1PhotoUri ?? ""}
            alt="Today"
            className="h-full w-full object-cover"
          />
          <span className="absolute right-2 top-2 rounded-full bg-gv-accent px-2 py-1 text-[10px] font-bold text-white">
            TODAY
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryPill label={journey.category} />
        <span className="rounded-full bg-gv-muted px-2.5 py-1 text-xs text-gv-text-muted">
          Day {day}
        </span>
        <span className="rounded-full bg-gv-muted px-2.5 py-1 text-xs text-gv-text-muted">
          Streak {streak}
        </span>
        <span className="rounded-full bg-gv-muted px-2.5 py-1 text-xs text-gv-text-muted">
          {journey.status}
        </span>
      </div>

      <div>
        <p className="gv-eyebrow mb-1 text-gv-text-muted">Ultimate goal</p>
        <p className="text-sm italic text-gv-text-muted">
          “{journey.ultimateGoal}”
        </p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-bold tracking-wider text-gv-text-muted">
            <span>PROGRESS</span>
            <span>
              {latest} / {journey.durationDays}
            </span>
          </div>
          <ProgressBar value={pct} />
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex gap-1 border-b border-gv-border">
        {(
          [
            ["log", "Log"],
            ["calendar", "Calendar"],
            ["stats", "Stats"],
            ["edit", "Edit"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === "calendar") {
                window.location.href = `/journeys/${journey.id}/calendar`;
                return;
              }
              setSub(key);
            }}
            className={`px-3 py-2 text-sm font-semibold ${
              sub === key
                ? "border-b-2 border-gv-accent text-gv-accent"
                : "text-gv-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === "log" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Evolution Logs</h2>
            <div className="flex gap-1 rounded-full bg-gv-muted p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-full p-2 ${
                  view === "grid" ? "bg-gv-accent text-white" : "text-gv-text-muted"
                }`}
              >
                <GridIcon />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-full p-2 ${
                  view === "list" ? "bg-gv-accent text-white" : "text-gv-text-muted"
                }`}
              >
                <ListIcon />
              </button>
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-sm italic text-gv-text-muted">
              No logs yet. Add your first evolution.
            </p>
          ) : view === "grid" ? (
            <div className="grid grid-cols-3 gap-2">
              {logs.map((log) => (
                <LogThumb key={log.id} log={log} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="pt-2">
              {logs.map((log) => (
                <LogThumb key={log.id} log={log} variant="list" />
              ))}
            </div>
          )}
        </>
      )}

      {sub === "stats" && (
        <div className="gv-card space-y-2 p-4">
          <p className="font-bold">Journey stats</p>
          <p className="text-sm text-gv-text-muted">Logs: {logs.length}</p>
          <p className="text-sm text-gv-text-muted">Day index: {day}</p>
          <p className="text-sm text-gv-text-muted">Progress: {pct}%</p>
        </div>
      )}

      {sub === "edit" && (
        <div className="gv-card space-y-3 p-4">
          <p className="font-bold">Edit</p>
          <p className="text-sm text-gv-text-muted">
            Title: {journey.title}
          </p>
          <p className="text-sm text-gv-text-muted">
            Goal: {journey.ultimateGoal}
          </p>
          {canComplete && (
            <button
              type="button"
              className="gv-cta w-full py-3 text-sm"
              onClick={() => void completeJourney(journey.id)}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}

      <Link
        href={`/journeys/${journey.id}/log`}
        className="gv-cta block w-full py-4 text-center text-sm"
      >
        Add Evolution Log
      </Link>
    </div>
  );
}
