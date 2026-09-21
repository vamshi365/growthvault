"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/ui";
import { BackIcon } from "@/components/icons";
import { dayKey } from "@/lib/streaks";
import { CompareSplit } from "@/components/CompareSplit";
import {
  buildCompareSlots,
  LogCalendarStrip,
  type StripSlot,
} from "@/components/LogCalendarStrip";

type Mode = "day1_today" | "a_b";

function resolveSlot(
  slots: StripSlot[],
  id: string | null
): { uri: string; label: string; meta: string } | null {
  if (!id) return null;
  const slot = slots.find((s) => {
    if (s.kind === "log") return s.log.id === id;
    if (s.kind === "day1") return id === "day1";
    return id === "today";
  });
  if (!slot) return null;
  if (slot.kind === "log") {
    return {
      uri: slot.log.photoUri,
      label: slot.label,
      meta: dayKey(slot.log.createdAt),
    };
  }
  return {
    uri: slot.photoUri,
    label: slot.label,
    meta: slot.kind === "day1" ? "Start" : "Latest",
  };
}

export default function ComparePage() {
  const params = useParams<{ id: string }>();
  const { snapshot } = useStore();
  const journey = snapshot.journeys.find((j) => j.id === params.id);
  const logs = useMemo(
    () =>
      snapshot.logs
        .filter((l) => l.journeyId === params.id)
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [snapshot.logs, params.id]
  );

  const slots = useMemo(
    () =>
      journey
        ? buildCompareSlots(
            journey.day1PhotoUri,
            journey.todayPhotoUri,
            logs
          )
        : [],
    [journey, logs]
  );

  const defaultA = journey?.day1PhotoUri ? "day1" : logs[0]?.id ?? null;
  const defaultB =
    logs.length > 0
      ? logs[logs.length - 1].id
      : journey?.todayPhotoUri
        ? "today"
        : defaultA;

  const [mode, setMode] = useState<Mode>("day1_today");
  const [sideA, setSideA] = useState<string | null>(defaultA);
  const [sideB, setSideB] = useState<string | null>(defaultB);
  const [picking, setPicking] = useState<"A" | "B">("A");

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

  // Day1 vs Today mode locks sides
  const effectiveA =
    mode === "day1_today"
      ? journey.day1PhotoUri
        ? "day1"
        : sideA
      : sideA;
  const effectiveB =
    mode === "day1_today"
      ? logs.length > 0
        ? logs[logs.length - 1].id
        : journey.todayPhotoUri
          ? "today"
          : sideB
      : sideB;

  const left = resolveSlot(slots, effectiveA);
  const right = resolveSlot(slots, effectiveB);

  function onStripSelect(id: string) {
    if (mode === "day1_today") {
      setMode("a_b");
    }
    if (picking === "A") {
      setSideA(id);
      setPicking("B");
    } else {
      setSideB(id);
      setPicking("A");
    }
  }

  function swap() {
    setSideA(effectiveB);
    setSideB(effectiveA);
    if (mode === "day1_today") setMode("a_b");
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href={`/journeys/${journey.id}`}
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <h1 className="text-xl font-bold">Compare</h1>
      </header>

      <div className="flex gap-1 rounded-full bg-gv-muted p-1">
        <button
          type="button"
          onClick={() => setMode("day1_today")}
          className={`min-h-[44px] flex-1 rounded-full px-3 text-xs font-semibold ${
            mode === "day1_today"
              ? "bg-gv-accent text-white"
              : "text-gv-text-muted"
          }`}
        >
          Day 1 vs Today
        </button>
        <button
          type="button"
          onClick={() => setMode("a_b")}
          className={`min-h-[44px] flex-1 rounded-full px-3 text-xs font-semibold ${
            mode === "a_b" ? "bg-gv-accent text-white" : "text-gv-text-muted"
          }`}
        >
          Log A vs Log B
        </button>
      </div>

      <CompareSplit
        leftUri={left?.uri ?? ""}
        rightUri={right?.uri ?? ""}
        leftLabel={
          mode === "day1_today"
            ? "DAY 1"
            : left?.label?.toUpperCase() ?? "A"
        }
        rightLabel={
          mode === "day1_today"
            ? "TODAY"
            : right?.label?.toUpperCase() ?? "B"
        }
        leftMeta={
          mode === "day1_today"
            ? `Day 1 · ${left?.meta ?? "Start"}`
            : left?.meta
        }
        rightMeta={
          mode === "day1_today"
            ? `Today · ${right?.meta ?? "Latest"}`
            : right?.meta
        }
      />

      <button
        type="button"
        onClick={swap}
        className="min-h-[44px] w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 text-sm font-semibold"
      >
        Swap A ↔ B
      </button>

      {mode === "a_b" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPicking("A")}
            className={`min-h-[40px] flex-1 rounded-full text-xs font-bold ${
              picking === "A"
                ? "bg-gv-accent text-white"
                : "bg-gv-muted text-gv-text-muted"
            }`}
          >
            Picking A
          </button>
          <button
            type="button"
            onClick={() => setPicking("B")}
            className={`min-h-[40px] flex-1 rounded-full text-xs font-bold ${
              picking === "B"
                ? "bg-gv-accent text-white"
                : "bg-gv-muted text-gv-text-muted"
            }`}
          >
            Picking B
          </button>
        </div>
      )}

      <LogCalendarStrip
        slots={slots}
        selectedId={picking === "A" ? effectiveA : effectiveB}
        activeSide={picking}
        onSelect={onStripSelect}
      />

      <p className="text-center text-[11px] text-gv-text-muted">
        Offline · photos stay on this device
      </p>
    </div>
  );
}
