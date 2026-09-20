"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { getTemplate } from "@/data/templates";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { CameraIcon, CloseIcon } from "@/components/icons";
import { GradientCtaButton } from "@/components/ui";

const CATEGORIES: Category[] = [
  "Fitness",
  "Mindset",
  "Career",
  "Creative",
  "Custom",
];

function NewJourneyForm() {
  const router = useRouter();
  const search = useSearchParams();
  const templateId = search.get("template");
  const template = templateId ? getTemplate(templateId) : undefined;
  const { createJourney, readPhotoFile } = useStore();

  const [title, setTitle] = useState(template?.title ?? "");
  const [goal, setGoal] = useState(template?.ultimateGoal ?? "");
  const [category, setCategory] = useState<Category>(
    template?.category ?? "Fitness"
  );
  const [duration, setDuration] = useState(template?.durationDays ?? 30);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = useMemo(
    () => title.trim().length > 0 && goal.trim().length > 0 && duration > 0,
    [title, goal, duration]
  );

  async function onPhoto(file: File | null) {
    if (!file) return;
    const url = await readPhotoFile(file);
    setPhoto(url);
  }

  async function onSubmit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createJourney({
        title,
        ultimateGoal: goal,
        category,
        durationDays: Number(duration),
        day1PhotoUri: photo,
      });
      router.push("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create journey");
      setBusy(false);
    }
  }

  return (
    <div className="gv-page space-y-4">
      <header className="relative flex items-center justify-center">
        <Link
          href="/home"
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
          aria-label="Close"
        >
          <CloseIcon />
        </Link>
        <h1 className="gv-eyebrow text-gv-text-muted">New Journey</h1>
      </header>

      <label className="block space-y-2">
        <span className="gv-eyebrow text-gv-accent-text">What are you tracking?</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summer Body Prep"
          className="w-full rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none placeholder:text-gv-placeholder focus:border-gv-accent"
        />
      </label>

      <label className="block space-y-2">
        <span className="gv-eyebrow text-gv-accent-text">Ultimate goal</span>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Who do you become?"
          rows={3}
          className="w-full resize-none rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none placeholder:text-gv-placeholder focus:border-gv-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2">
          <span className="gv-eyebrow text-gv-accent-text">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full appearance-none rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none focus:border-gv-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="gv-eyebrow text-gv-accent-text">Duration (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none focus:border-gv-accent"
          />
        </label>
      </div>

      <div className="gv-card flex items-start gap-3 bg-gv-muted p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border text-gv-accent">
          <CameraIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-gv-accent">Identity Tip</p>
          <p className="mt-1 text-sm italic text-gv-text-muted">
            Capture a Day 1 photo. You are not chasing a look — you are becoming
            someone who shows up.
          </p>
        </div>
      </div>

      <label className="gv-card flex cursor-pointer flex-col items-center gap-2 border border-dashed border-gv-border p-5 text-center">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt="Day 1 preview"
            className="h-40 w-full rounded-[16px] object-cover"
          />
        ) : (
          <>
            <CameraIcon className="text-gv-accent" />
            <span className="text-sm text-gv-text-muted">
              Add Day 1 photo (optional — file upload)
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

      {error && <p className="text-sm text-[#FF8A80]">{error}</p>}

      <GradientCtaButton disabled={!valid || busy} onClick={() => void onSubmit()}>
        {busy ? "Creating…" : "Begin Journey"}
      </GradientCtaButton>
    </div>
  );
}

export default function NewJourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="gv-page text-gv-text-muted">Loading form…</div>
      }
    >
      <NewJourneyForm />
    </Suspense>
  );
}
