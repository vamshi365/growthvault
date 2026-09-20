"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CloseIcon, CameraIcon } from "@/components/icons";
import { GradientCtaButton } from "@/components/ui";

const TAG_OPTIONS = ["progress", "milestone", "mindset", "setback", "win"];

export default function LogEvolutionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { snapshot, addLog, readPhotoFile } = useStore();
  const journeys = snapshot.journeys.filter((j) => j.status === "active");

  const [journeyId, setJourneyId] = useState(params.id);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const journey = useMemo(
    () => snapshot.journeys.find((j) => j.id === journeyId),
    [snapshot.journeys, journeyId]
  );

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    setPhoto(await readPhotoFile(file));
  }

  async function onSave() {
    if (!photo || !journey || busy) return;
    setBusy(true);
    setError(null);
    try {
      await addLog({
        journeyId,
        photoUri: photo,
        note,
        tags,
      });
      router.push(`/journeys/${journeyId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save log");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="gv-card w-full max-w-[440px] space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Log Evolution</h1>
          <Link
            href={journey ? `/journeys/${journey.id}` : "/home"}
            className="text-gv-text-muted"
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

        <label className="flex cursor-pointer flex-col items-center gap-2 overflow-hidden rounded-[22px] border border-dashed border-gv-border bg-gv-muted p-4">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Preview"
              className="max-h-56 w-full rounded-[16px] object-cover"
            />
          ) : (
            <>
              <CameraIcon className="text-gv-accent" />
              <span className="text-sm text-gv-text-muted">
                Upload photo (file picker)
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
          />
        </label>

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
                className={`gv-pill px-3 py-1.5 text-xs font-semibold capitalize ${
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

        {error && <p className="text-sm text-[#FF8A80]">{error}</p>}

        <button
          type="button"
          disabled={!photo || busy}
          onClick={() => void onSave()}
          className="w-full rounded-full bg-gv-accent py-3.5 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <Link
          href={journey ? `/journeys/${journey.id}` : "/home"}
          className="block text-center text-sm text-gv-text-muted"
        >
          Close
        </Link>
      </div>
    </div>
  );
}
