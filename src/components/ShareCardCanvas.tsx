"use client";

import { useEffect, useRef, useState } from "react";
import {
  renderShareCardPng,
  SHARE_SIZES,
  type ShareCardInput,
  type ShareFormat,
} from "@/lib/share";

/** Live preview of the composed card (real journey data → canvas PNG). */
export function ShareCardCanvas({
  input,
  onBlob,
}: {
  input: ShareCardInput | null;
  onBlob?: (blob: Blob | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const revokes = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setUrl(null);
      onBlob?.(null);
      return;
    }
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const blob = await renderShareCardPng(input);
        if (cancelled) return;
        const next = URL.createObjectURL(blob);
        revokes.current.push(next);
        setUrl(next);
        onBlob?.(blob);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Render failed");
        onBlob?.(null);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input?.templateId,
    input?.format,
    input?.beforeUri,
    input?.afterUri,
    input?.photoUri,
    input?.streak,
    input?.dayIndex,
    input?.journey.id,
    input?.badge?.id,
    input?.quote,
  ]);

  useEffect(() => {
    return () => {
      for (const u of revokes.current) URL.revokeObjectURL(u);
      revokes.current = [];
    };
  }, []);

  const format: ShareFormat = input?.format ?? "stories";
  const { w, h } = SHARE_SIZES[format];
  const aspect = `${w} / ${h}`;

  return (
    <div
      className="overflow-hidden rounded-[22px] border border-gv-border bg-gv-muted"
      style={{ aspectRatio: aspect }}
      data-share-preview={input?.templateId ?? "none"}
    >
      {busy && !url && (
        <div className="flex h-full items-center justify-center text-sm text-gv-text-muted">
          Composing card…
        </div>
      )}
      {error && (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-[#FF8A80]">Couldn’t render card</p>
          <p className="text-xs text-gv-text-muted">{error}</p>
        </div>
      )}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Share card preview"
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}
