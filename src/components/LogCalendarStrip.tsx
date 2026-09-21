"use client";

import type { EvolutionLog } from "@/lib/types";
import { dayKey } from "@/lib/streaks";

export type StripSlot =
  | { kind: "day1"; photoUri: string; label: string }
  | { kind: "log"; log: EvolutionLog; label: string }
  | { kind: "today"; photoUri: string; label: string };

type LogCalendarStripProps = {
  slots: StripSlot[];
  selectedId: string | null;
  activeSide: "A" | "B";
  onSelect: (slotId: string) => void;
};

function slotId(slot: StripSlot): string {
  if (slot.kind === "log") return slot.log.id;
  if (slot.kind === "day1") return "day1";
  return "today";
}

/** Horizontal calendar / timeline strip — tap to set compare A or B. */
export function LogCalendarStrip({
  slots,
  selectedId,
  activeSide,
  onSelect,
}: LogCalendarStripProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm italic text-gv-text-muted">
        No logs yet — add an evolution to compare.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="gv-eyebrow text-gv-accent-text">Timeline</p>
        <p className="text-[11px] text-gv-text-muted">
          Tap to set side {activeSide}
        </p>
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Log timeline"
      >
        {slots.map((slot) => {
          const id = slotId(slot);
          const selected = selectedId === id;
          const thumb =
            slot.kind === "log" ? slot.log.photoUri : slot.photoUri;
          const sub =
            slot.kind === "log"
              ? dayKey(slot.log.createdAt)
              : slot.kind === "day1"
                ? "Start"
                : "Latest";
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(id)}
              className={`flex w-[72px] shrink-0 flex-col gap-1 rounded-[16px] border p-1.5 text-left transition ${
                selected
                  ? "border-gv-accent bg-[rgba(159,132,255,0.18)]"
                  : "border-gv-border bg-gv-muted"
              }`}
            >
              <div className="aspect-square overflow-hidden rounded-[12px] bg-gv-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb}
                  alt={slot.label}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="truncate text-[10px] font-bold text-gv-text">
                {slot.label}
              </span>
              <span className="truncate text-[9px] text-gv-text-muted">
                {sub}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function buildCompareSlots(
  day1PhotoUri: string | null,
  todayPhotoUri: string | null,
  logs: EvolutionLog[]
): StripSlot[] {
  const slots: StripSlot[] = [];
  if (day1PhotoUri) {
    slots.push({ kind: "day1", photoUri: day1PhotoUri, label: "Day 1" });
  }
  const chronological = [...logs].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const log of chronological) {
    // Skip if identical uri already represented as Day1 thumb (still list for pick)
    slots.push({
      kind: "log",
      log,
      label: `Day ${log.dayIndex}`,
    });
  }
  if (
    todayPhotoUri &&
    !logs.some((l) => l.photoUri === todayPhotoUri) &&
    todayPhotoUri !== day1PhotoUri
  ) {
    slots.push({ kind: "today", photoUri: todayPhotoUri, label: "Today" });
  }
  return slots;
}
