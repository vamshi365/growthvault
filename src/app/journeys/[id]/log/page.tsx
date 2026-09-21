"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { currentStreak } from "@/lib/streaks";
import { CloseIcon } from "@/components/icons";
import { PhotoPicker } from "@/components/PhotoPicker";
import { useToast, vibrateOnce } from "@/components/Toast";
import { EmptyState } from "@/components/ui";

const TAG_OPTIONS = ["progress", "milestone", "mindset", "setback", "win"];

export default function LogEvolutionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { snapshot, addLog, ready } = useStore();
  const { toast } = useToast();
  const journeys = snapshot.journeys.filter((j) => j.status === "active");

  const [journeyId, setJourneyId] = useState(params.id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const journey = useMemo(
    () => snapshot.journeys.find((j) => j.id === journeyId),
    [snapshot.journeys, journeyId]
  );

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="gv-card w-full max-w-[440px] space-y-4 p-5">
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

        <PhotoPicker
          photo={photo}
          onPhoto={setPhoto}
          emptyLabel="Tap to add photo · camera or gallery"
        />

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
