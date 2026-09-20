"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { BackIcon } from "@/components/icons";
import { dayKey } from "@/lib/streaks";

export default function ComparePage() {
  const params = useParams<{ id: string }>();
  const { snapshot } = useStore();
  const journey = snapshot.journeys.find((j) => j.id === params.id);
  const logs = useMemo(
    () => snapshot.logs.filter((l) => l.journeyId === params.id),
    [snapshot.logs, params.id]
  );

  const [left, setLeft] = useState(
    () => journey?.day1PhotoUri ?? logs[logs.length - 1]?.photoUri ?? ""
  );
  const [right, setRight] = useState(
    () => journey?.todayPhotoUri ?? logs[0]?.photoUri ?? ""
  );

  if (!journey) {
    return (
      <div className="gv-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-bold">Journey not found</p>
        <Link href="/home" className="gv-cta px-6 py-3 text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  const leftDate = dayKey(journey.startedAt);
  const rightDate = logs[0] ? dayKey(logs[0].createdAt) : "Today";

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href={`/journeys/${journey.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Before vs After</h1>
      </header>

      <div className="overflow-hidden rounded-[28px] border border-gv-border">
        <div className="grid grid-cols-2">
          <div className="relative aspect-[3/4] bg-gv-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={left} alt="Before" className="h-full w-full object-cover" />
          </div>
          <div className="relative aspect-[3/4] bg-gv-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={right} alt="After" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-gv-card px-3 py-3 text-center text-xs text-gv-text-muted">
          <span>{leftDate}</span>
          <span>{rightDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="gv-pill cursor-pointer border border-gv-accent px-3 py-3 text-center text-xs font-semibold text-gv-accent-text">
          Select image left
          <select
            className="mt-2 w-full rounded-lg bg-gv-muted px-2 py-1 text-gv-text"
            value={left}
            onChange={(e) => setLeft(e.target.value)}
          >
            {journey.day1PhotoUri && (
              <option value={journey.day1PhotoUri}>Day 1</option>
            )}
            {logs.map((l) => (
              <option key={l.id} value={l.photoUri}>
                Day {l.dayIndex}
              </option>
            ))}
          </select>
        </label>
        <label className="gv-pill cursor-pointer border border-gv-accent px-3 py-3 text-center text-xs font-semibold text-gv-accent-text">
          Select image right
          <select
            className="mt-2 w-full rounded-lg bg-gv-muted px-2 py-1 text-gv-text"
            value={right}
            onChange={(e) => setRight(e.target.value)}
          >
            {journey.todayPhotoUri && (
              <option value={journey.todayPhotoUri}>Today</option>
            )}
            {logs.map((l) => (
              <option key={l.id} value={l.photoUri}>
                Day {l.dayIndex}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex justify-around text-sm text-gv-text-muted">
        <button type="button" className="opacity-60" disabled>
          Share
        </button>
        <button type="button" className="opacity-60" disabled>
          Edit
        </button>
        <button type="button" className="opacity-60" disabled>
          Save
        </button>
      </div>
    </div>
  );
}
