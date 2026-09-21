"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { getTemplate } from "@/data/templates";
import { useStore } from "@/lib/store";
import type { Category } from "@/lib/types";
import { CameraIcon, CloseIcon } from "@/components/icons";
import { PhotoPicker } from "@/components/PhotoPicker";
import { GradientCtaButton } from "@/components/ui";
import { useToast, vibrateOnce } from "@/components/Toast";

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
  const { createJourney } = useStore();
  const { toast } = useToast();

  const [title, setTitle] = useState(template?.title ?? "");
  const [goal, setGoal] = useState(template?.ultimateGoal ?? "");
  const [category, setCategory] = useState<Category>(
    template?.category ?? "Fitness"
  );
  const [duration, setDuration] = useState(template?.durationDays ?? 30);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const valid = useMemo(
    () => title.trim().length > 0 && goal.trim().length > 0 && duration > 0,
    [title, goal, duration]
  );

  async function onSubmit() {
    setTouched(true);
    if (!valid || busy) return;
    setBusy(true);
    try {
      await createJourney({
        title,
        ultimateGoal: goal,
        category,
        durationDays: Number(duration),
        day1PhotoUri: photo,
      });
      vibrateOnce();
      toast("Journey started");
      router.push("/home");
    } catch {
      toast("Couldn’t save — try again", "error");
      setBusy(false);
    }
  }

  return (
    <div className="gv-page">
      <header className="relative flex min-h-[44px] items-center justify-center">
        <Link
          href="/home"
          className="absolute left-0 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
          aria-label="Close"
        >
          <CloseIcon />
        </Link>
        <h1 className="gv-eyebrow text-gv-text-muted">New Journey</h1>
      </header>

      {template && (
        <p className="gv-eyebrow text-gv-accent-text">
          From Explore · {template.title}
        </p>
      )}

      {/* Step A — essentials */}
      <label className="block space-y-2">
        <span className="gv-eyebrow text-gv-text-muted">What are you tracking?</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. Summer Body Prep"
          className="w-full rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none placeholder:text-gv-placeholder focus:border-gv-accent"
        />
        {touched && !title.trim() && (
          <p className="text-xs text-[#FF8A80]">Add a title to begin</p>
        )}
      </label>

      <label className="block space-y-2">
        <span className="gv-eyebrow text-gv-text-muted">Ultimate goal</span>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Who do you become?"
          rows={3}
          className="w-full resize-none rounded-[22px] border border-gv-border bg-gv-card px-4 py-3.5 outline-none placeholder:text-gv-placeholder focus:border-gv-accent"
        />
        {touched && !goal.trim() && (
          <p className="text-xs text-[#FF8A80]">Add a goal to begin</p>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2">
          <span className="gv-eyebrow text-gv-text-muted">Category</span>
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
          <span className="gv-eyebrow text-gv-text-muted">Duration (days)</span>
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

      {/* Step B — progressive */}
      {!showExtras ? (
        <button
          type="button"
          onClick={() => setShowExtras(true)}
          className="min-h-[44px] text-left text-sm font-semibold text-gv-accent-text"
        >
          + Add Day 1 photo & tip (optional)
        </button>
      ) : (
        <>
          <div className="gv-card flex items-start gap-3 bg-gv-muted p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-gv-border text-gv-accent">
              <CameraIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-gv-accent">Identity Tip</p>
              <p className="mt-1 text-sm italic text-gv-text-muted">
                Capture a Day 1 photo. You are not chasing a look — you are
                becoming someone who shows up.
              </p>
            </div>
          </div>

          <PhotoPicker
            photo={photo}
            onPhoto={setPhoto}
            emptyLabel="Add Day 1 photo (optional · camera or gallery)"
            previewClassName="h-40 w-full rounded-[16px] object-cover"
            className="gv-card border border-dashed border-gv-border bg-transparent p-5"
          />
        </>
      )}

      <GradientCtaButton disabled={busy} onClick={() => void onSubmit()}>
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
