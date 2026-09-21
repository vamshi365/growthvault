"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { BackIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui";
import { ShareTemplatePicker } from "@/components/ShareTemplatePicker";
import { ShareCardCanvas } from "@/components/ShareCardCanvas";
import { useToast } from "@/components/Toast";
import type { ShareTemplateId } from "@/lib/types";
import {
  defaultCaption,
  journeyDayIndex,
  pickAwardBadge,
  renderShareCardPng,
  resolveSharePhotos,
  sharePngBlob,
  type ShareCardInput,
  type ShareFormat,
} from "@/lib/share";

function ComposeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, snapshot, streak, recordShareEvent } = useStore();
  const { toast } = useToast();

  const journeyId = params.get("journeyId") ?? "";
  const logIdsParam = params.get("logIds") ?? "";
  const templateParam = params.get("template") as ShareTemplateId | null;

  const logIds = useMemo(
    () =>
      logIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [logIdsParam]
  );

  const journey = snapshot.journeys.find((j) => j.id === journeyId);
  const logs = useMemo(
    () => snapshot.logs.filter((l) => l.journeyId === journeyId),
    [snapshot.logs, journeyId]
  );

  const initialTemplate: ShareTemplateId =
    templateParam &&
    ["before_after", "streak", "award", "quote"].includes(templateParam)
      ? templateParam
      : "before_after";

  const [templateId, setTemplateId] =
    useState<ShareTemplateId>(initialTemplate);
  const [format, setFormat] = useState<ShareFormat>("stories");
  const [caption, setCaption] = useState("");
  const [captionTouched, setCaptionTouched] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const dayIndex = journey ? journeyDayIndex(journey) : 0;
  const photos = journey
    ? resolveSharePhotos(journey, logs, logIds)
    : { beforeUri: null, afterUri: null, photoUri: null };

  const badge = pickAwardBadge(snapshot.badges);

  const prefill = journey ? defaultCaption(journey, dayIndex) : "";
  const effectiveCaption = captionTouched ? caption : prefill;

  const cardInput: ShareCardInput | null = journey
    ? {
        templateId,
        format,
        journey,
        beforeUri: photos.beforeUri,
        afterUri: photos.afterUri,
        photoUri: photos.photoUri,
        streak,
        dayIndex,
        badge,
        insightSeed: snapshot.profile.insightSeed,
      }
    : null;

  const onShare = useCallback(async () => {
    if (!journey || !cardInput) return;
    setSharing(true);
    try {
      const blob =
        previewBlob ?? (await renderShareCardPng(cardInput));
      const result = await sharePngBlob(blob, {
        caption: effectiveCaption,
        filename: `growthvault-${templateId}.png`,
      });

      if (result.status === "cancelled") {
        // Quiet exit — no shame toast
        return;
      }
      if (result.status === "error") {
        toast("Couldn’t share — try again", "error");
        return;
      }

      await recordShareEvent({
        templateId,
        journeyId: journey.id,
        logIds:
          logIds.length > 0
            ? logIds
            : logs.slice(0, 2).map((l) => l.id),
      });

      toast(
        result.status === "downloaded"
          ? "Card saved — share from Files if needed"
          : "Card ready to send",
        "success"
      );
    } catch {
      toast("Couldn’t share — try again", "error");
    } finally {
      setSharing(false);
    }
  }, [
    journey,
    cardInput,
    previewBlob,
    effectiveCaption,
    templateId,
    recordShareEvent,
    logIds,
    logs,
    toast,
  ]);

  if (!ready) {
    return (
      <div className="gv-page text-gv-text-muted">Loading…</div>
    );
  }

  if (!journeyId || !journey) {
    return (
      <div className="gv-page">
        <EmptyState
          title="Nothing to share yet"
          body="Open a journey or Compare, then tap Share to compose a card."
          actionHref="/home"
          actionLabel="Back to Home"
        />
      </div>
    );
  }

  const backHref =
    logIds.length > 0
      ? `/journeys/${journey.id}/compare`
      : `/journeys/${journey.id}`;

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">Share card</h1>
          <p className="truncate text-xs text-gv-text-muted">
            {journey.title} · system share only
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-gv-text-muted"
        >
          Cancel
        </button>
      </header>

      <ShareTemplatePicker value={templateId} onChange={setTemplateId} />

      <div className="flex gap-1 rounded-full bg-gv-muted p-1">
        <button
          type="button"
          onClick={() => setFormat("stories")}
          className={`min-h-[44px] flex-1 rounded-full text-xs font-semibold ${
            format === "stories"
              ? "bg-gv-accent text-white"
              : "text-gv-text-muted"
          }`}
        >
          Stories 9:16
        </button>
        <button
          type="button"
          onClick={() => setFormat("square")}
          className={`min-h-[44px] flex-1 rounded-full text-xs font-semibold ${
            format === "square"
              ? "bg-gv-accent text-white"
              : "text-gv-text-muted"
          }`}
        >
          Square 1:1
        </button>
      </div>

      <ShareCardCanvas input={cardInput} onBlob={setPreviewBlob} />

      <label className="block space-y-1">
        <span className="gv-eyebrow text-gv-text-muted">
          Caption (optional)
        </span>
        <textarea
          value={effectiveCaption}
          onChange={(e) => {
            setCaptionTouched(true);
            setCaption(e.target.value);
          }}
          rows={2}
          placeholder="Add a short caption…"
          className="w-full rounded-[18px] border border-gv-border bg-gv-muted px-4 py-3 text-sm text-gv-text outline-none focus-visible:ring-2 focus-visible:ring-[#E8D9FF]"
        />
      </label>

      <button
        type="button"
        disabled={sharing || !previewBlob}
        onClick={() => void onShare()}
        className="gv-cta w-full py-4 text-sm disabled:opacity-50"
        data-share-cta="system"
      >
        {sharing ? "Opening share…" : "Share"}
      </button>

      <p className="text-center text-[11px] text-gv-text-muted">
        Opens your system share sheet · Cancel leaves quietly · No feed
      </p>

      <Link
        href={backHref}
        className="block text-center text-sm font-semibold text-gv-text-muted"
      >
        Not now
      </Link>
    </div>
  );
}

export default function ShareComposePage() {
  return (
    <Suspense
      fallback={
        <div className="gv-page text-gv-text-muted">Loading…</div>
      }
    >
      <ComposeInner />
    </Suspense>
  );
}
