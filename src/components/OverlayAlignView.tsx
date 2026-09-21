"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downscaleForOverlay, type OverlayReference } from "@/lib/overlay";

type OverlayAlignViewProps = {
  /** Captured / picked photo (full res kept for save). */
  photo: string;
  reference: OverlayReference;
  /** When true, ghost is shown. Parent can toggle. */
  enabled?: boolean;
  className?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/**
 * True pixel overlay: base capture + ghost reference composited with
 * per-pixel alpha (canvas globalAlpha). Not CSS mix-blend-mode / filters.
 * Ghost is guidance only — saved photo remains the full-res capture.
 */
export function OverlayAlignView({
  photo,
  reference,
  enabled = true,
  className = "",
}: OverlayAlignViewProps) {
  const [opacity, setOpacity] = useState(0.4);
  const [flipped, setFlipped] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [ghostSrc, setGhostSrc] = useState(reference.photoUri);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void downscaleForOverlay(reference.photoUri).then((src) => {
      if (!cancelled) setGhostSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [reference.photoUri]);

  const paint = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = "#1A1A24";
    ctx.fillRect(0, 0, w, h);

    try {
      const base = await loadImage(photo);
      // Cover-fit base
      const scale = Math.max(w / base.naturalWidth, h / base.naturalHeight);
      const bw = base.naturalWidth * scale;
      const bh = base.naturalHeight * scale;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, bx, by, bw, bh);

      if (enabled) {
        const ghost = await loadImage(ghostSrc);
        const gScale = Math.max(w / ghost.naturalWidth, h / ghost.naturalHeight);
        const gw = ghost.naturalWidth * gScale;
        const gh = ghost.naturalHeight * gScale;
        const gx = (w - gw) / 2;
        const gy = (h - gh) / 2;
        const alpha = frozen ? Math.min(opacity, 0.55) : opacity;
        // True pixel alpha overlay — not mix-blend-mode
        ctx.save();
        if (flipped) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
          ctx.globalAlpha = alpha;
          ctx.drawImage(ghost, w - gx - gw, gy, gw, gh);
        } else {
          ctx.globalAlpha = alpha;
          ctx.drawImage(ghost, gx, gy, gw, gh);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    } catch {
      // leave solid background
    }
  }, [photo, ghostSrc, enabled, opacity, flipped, frozen]);

  useEffect(() => {
    void paint();
  }, [paint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      void paint();
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, [paint]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-[22px] border border-gv-border bg-gv-muted"
        data-overlay-mode="canvas-alpha"
        data-testid="overlay-align-view"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={
            enabled
              ? `Capture with ${Math.round(opacity * 100)}% ghost of ${reference.label}`
              : "New capture"
          }
        />
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
          Ghost · {reference.label}
        </span>
        {frozen && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-gv-accent px-2 py-1 text-[10px] font-bold text-white">
            Frozen
          </span>
        )}
      </div>

      <div className="space-y-3 rounded-[22px] border border-gv-border bg-gv-card p-3">
        <p className="text-[11px] font-medium text-gv-accent-text">
          True pixel overlay · canvas alpha (not blend-mode)
        </p>
        <label className="block space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gv-accent-text">Opacity</span>
            <span className="text-gv-text-muted">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            value={Math.round(opacity * 100)}
            disabled={!enabled || frozen}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="h-2 w-full cursor-pointer accent-[var(--gv-accent,#9F84FF)] disabled:opacity-40"
            aria-label="Ghost opacity"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!enabled}
            onClick={() => setFlipped((f) => !f)}
            className={`min-h-[44px] rounded-[16px] border px-3 text-xs font-semibold disabled:opacity-40 ${
              flipped
                ? "border-gv-accent bg-gv-accent text-white"
                : "border-gv-border bg-gv-muted text-gv-text"
            }`}
          >
            {flipped ? "Mirrored" : "Flip horizontal"}
          </button>
          <button
            type="button"
            disabled={!enabled}
            onClick={() => setFrozen((f) => !f)}
            className={`min-h-[44px] rounded-[16px] border px-3 text-xs font-semibold disabled:opacity-40 ${
              frozen
                ? "border-gv-accent bg-gv-accent text-white"
                : "border-gv-border bg-gv-muted text-gv-text"
            }`}
          >
            {frozen ? "Unfreeze" : "Freeze ghost"}
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-gv-text-muted">
          Ghost helps you match angle & framing. Only your new photo is saved —
          full resolution kept. Local-only · not uploaded.
        </p>
      </div>
    </div>
  );
}

/** Compact opacity-only control (blueprint OpacitySlider). */
export function OpacitySlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gv-accent-text">Opacity</span>
        <span className="text-gv-text-muted">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-2 w-full cursor-pointer accent-[var(--gv-accent,#9F84FF)] disabled:opacity-40"
        aria-label="Ghost opacity"
      />
    </label>
  );
}
