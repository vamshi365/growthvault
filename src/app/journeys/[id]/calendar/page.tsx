"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { dayKey } from "@/lib/streaks";
import { EmptyState } from "@/components/ui";
import { BackIcon, FlameIcon } from "@/components/icons";

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string | null }> = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(new Date(year, month, d));
    cells.push({ day: d, key });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });
  return cells;
}

export default function CalendarPage() {
  const params = useParams<{ id: string }>();
  const { snapshot, streak } = useStore();
  const journey = snapshot.journeys.find((j) => j.id === params.id);
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });

  const logged = useMemo(() => {
    const set = new Set<string>();
    for (const l of snapshot.logs.filter((x) => x.journeyId === params.id)) {
      set.add(dayKey(l.createdAt));
    }
    return set;
  }, [snapshot.logs, params.id]);

  const cells = monthMatrix(cursor.y, cursor.m);
  const startKey = journey ? dayKey(journey.startedAt) : null;
  const todayKey = dayKey(now);
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

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

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href={`/journeys/${journey.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Calendar</h1>
      </header>

      <div className="gv-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="text-gv-accent"
            onClick={() =>
              setCursor((c) => {
                const d = new Date(c.y, c.m - 1, 1);
                return { y: d.getFullYear(), m: d.getMonth() };
              })
            }
          >
            ‹
          </button>
          <p className="font-bold">{label}</p>
          <button
            type="button"
            className="text-gv-accent"
            onClick={() =>
              setCursor((c) => {
                const d = new Date(c.y, c.m + 1, 1);
                return { y: d.getFullYear(), m: d.getMonth() };
              })
            }
          >
            ›
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gv-text-muted">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.day || !c.key) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const isLogged = logged.has(c.key);
            const isMissed =
              startKey &&
              c.key >= startKey &&
              c.key < todayKey &&
              !isLogged;
            return (
              <div
                key={c.key}
                className={`flex aspect-square items-center justify-center rounded-full text-sm font-semibold ${
                  isLogged
                    ? "bg-[rgba(159,132,255,0.25)] ring-2 ring-gv-accent text-white"
                    : isMissed
                      ? "bg-[var(--gv-missed-bg)] text-[var(--gv-missed-text)]"
                      : "text-gv-text"
                }`}
              >
                {c.day}
              </div>
            );
          })}
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(159,132,255,0.15)] px-4 py-2 text-sm font-semibold text-gv-accent-text">
        <FlameIcon className="text-gv-flame" size={16} />
        {streak} day streak
      </div>
    </div>
  );
}
