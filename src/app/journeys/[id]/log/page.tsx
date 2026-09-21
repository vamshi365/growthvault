"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currentStreak } from "@/lib/streaks";
import { CloseIcon } from "@/components/icons";
import { PhotoPicker } from "@/components/PhotoPicker";
import { OverlayAlignView } from "@/components/OverlayAlignView";
import { useToast, vibrateOnce } from "@/components/Toast";
import { EmptyState } from "@/components/ui";
import {
  resolveOverlayReference,
  toReferenceLogId,
} from "@/lib/overlay";
import type { CaptureSource } from "@/lib/types";
import type { PhotoSource } from "@/lib/camera";

const TAG_OPTIONS = ["progress", "milestone", "mindset", "setback", "win"];

export default function LogEvolutionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { snapshot, addLog, ready } = useStore();
  const { toast } = useToast();
  const journeys = snapshot.journeys.filter((j) => j.status === "active");

  const [journeyId, setJourneyId] = useState(params.id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<CaptureSource>("gallery");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [alignEnabled, setAlignEnabled] = useState(true);
  const [refPrefer, setRefPrefer] = useState<"day1" | "last">("day1");

  const journey = useMemo(
    () => snapshot.journeys.find((j) => j.id === journeyId),
    [snapshot.journeys, journeyId]
  );

  const journeyLogs = useMemo(
    () => snapshot.logs.filter((l) => l.journeyId === journeyId),
    [snapshot.logs, journeyId]
  );

  const overlayRef = useMemo(
    () => resolveOverlayReference(journey, journeyLogs, refPrefer),
    [journey, journeyLogs, refPrefer]
  );

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function onPhoto(dataUrl: string, source: PhotoSource) {
    setPhoto(dataUrl);
    setCaptureSource(source);
    // Default align on when a reference exists
    setAlignEnabled(!!resolveOverlayReference(journey, journeyLogs, refPrefer));
  }

  async function onSave() {
    if (!photo || !journey || busy) return;
    setBusy(true);
    const prevStreak = currentStreak(snapshot.logs);
    try {
      const log = await addLog({
        journeyId,
        photoUri: photo,
        note,
        tags,
        captureSource,
        referenceLogId:
          alignEnabled && overlayRef
            ? toReferenceLogId(overlayRef)
            : undefined,
      });
      vibrateOnce();
      toast("Evolution logged");
      const nextStreak = currentStreak([log, ...snapshot.logs]);
      if (nextStreak > prevStreak) {
        window.setTimeout(
          () => toast(`🔥 Streak · ${nextStreak} days`, "info"),
          400
        );
      }
      router.push(`/journeys/${journeyId}`);
    } catch {
      toast("Couldn’t save — try again", "error");
      setBusy(false);
    }
  }

  if (ready && !journey && params.id !== "_") {
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <div className="gv-card my-4 w-full max-w-[440px] space-y-4 p-5">
        <div className="flex min-h-[44px] items-center justify-between">
          <h1 className="text-lg font-bold">Log Evolution</h1>
          <Link
            href={journey ? `/journeys/${journey.id}` : "/home"}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-gv-text-muted"
            aria-label="Close"
          >
            <CloseIcon />
          </Link>
        </div>

        {journeys.length > 1 && (
          <label className="block space-y-2">
            <span className="gv-eyebrow text-gv-accent-text">Journey</span>
            <select
              value={journeyId}
              onChange={(e) => setJourneyId(e.target.value)}
              className="w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {!photo ? (
          <PhotoPicker
            photo={photo}
            onPhoto={onPhoto}
            emptyLabel="Tap to add photo · camera or gallery"
          />
        ) : overlayRef ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={alignEnabled}
                  onChange={(e) => setAlignEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[var(--gv-accent,#9F84FF)]"
                />
                Align with overlay
              </label>
              <div className="flex gap-1 rounded-full bg-gv-muted p-1">
                <button
                  type="button"
                  onClick={() => setRefPrefer("day1")}
                  className={`min-h-[36px] rounded-full px-3 text-[11px] font-semibold ${
                    refPrefer === "day1"
                      ? "bg-gv-accent text-white"
                      : "text-gv-text-muted"
                  }`}
                >
                  Day 1
                </button>
                <button
                  type="button"
                  onClick={() => setRefPrefer("last")}
                  className={`min-h-[36px] rounded-full px-3 text-[11px] font-semibold ${
                    refPrefer === "last"
                      ? "bg-gv-accent text-white"
                      : "text-gv-text-muted"
                  }`}
                >
                  Last log
                </button>
              </div>
            </div>
            {alignEnabled ? (
              <OverlayAlignView
                photo={photo}
                reference={
                  resolveOverlayReference(journey, journeyLogs, refPrefer) ??
                  overlayRef
                }
                enabled
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Preview"
                className="max-h-56 w-full rounded-[16px] object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
              }}
              className="text-sm text-gv-text-muted underline"
            >
              Retake / choose another
            </button>
          </>
        ) : (
          <>
            <PhotoPicker
              photo={photo}
              onPhoto={onPhoto}
              emptyLabel="Tap to change photo"
            />
            <div
              role="status"
              className="rounded-[16px] border border-gv-border bg-gv-muted px-3 py-3 text-xs leading-relaxed text-gv-text-muted"
            >
              Overlay disabled — add a Day 1 photo first to align captures.
              <Link
                href={`/journeys/${journeyId}`}
                className="mt-2 block font-semibold text-gv-accent-text"
              >
                Add Day 1 photo first →
              </Link>
            </div>
          </>
        )}

        <label className="block space-y-2">
          <span className="gv-eyebrow text-gv-accent-text">Caption</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What shifted today?"
            className="w-full resize-none rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none placeholder:text-gv-placeholder"
          />
        </label>

        <div>
          <p className="gv-eyebrow mb-2 text-gv-accent-text">Tags</p>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`gv-pill min-h-[44px] px-4 text-xs font-semibold capitalize ${
                  tags.includes(t)
                    ? "bg-gv-accent text-white"
                    : "bg-gv-card text-gv-text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!photo || busy}
          onClick={() => void onSave()}
          className="w-full min-h-[52px] rounded-full bg-gv-accent py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <Link
          href={journey ? `/journeys/${journey.id}` : "/home"}
          className="flex min-h-[44px] items-center justify-center text-sm text-gv-text-muted"
        >
          Close
        </Link>
      </div>
    </div>
  );
}
