/**
 * GrowthVault v2.1 share-out cards — canvas → PNG → system share.
 * Authority: CREATOR growthvault-share-cards.md · ARCHITECT §v2.1
 * No in-app feed. Cancel = quiet. No encryption claims on art.
 */

import type {
  BadgeProgress,
  EvolutionLog,
  Journey,
  ShareTemplateId,
} from "./types";
import { BADGE_META } from "./badges";
import { EVOLUTION_INSIGHTS, pickQuote } from "./quotes";
import { daysSinceStart } from "./streaks";

export const SHARE_TEMPLATES: {
  id: ShareTemplateId;
  letter: "A" | "B" | "C" | "D";
  label: string;
  blurb: string;
}[] = [
  {
    id: "before_after",
    letter: "A",
    label: "Before / After",
    blurb: "Day 1 vs Today split",
  },
  {
    id: "streak",
    letter: "B",
    label: "Streak",
    blurb: "Flame + day streak",
  },
  {
    id: "award",
    letter: "C",
    label: "Award",
    blurb: "Unlocked badge story",
  },
  {
    id: "quote",
    letter: "D",
    label: "Quote + Photo",
    blurb: "Evolution insight",
  },
];

export type ShareFormat = "stories" | "square";

export const SHARE_SIZES: Record<ShareFormat, { w: number; h: number }> = {
  stories: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

const BG = "#0B0B10";
const ACCENT = "#9F84FF";
const MUTED = "#8E8E93";
const FLAME = "#FF9F43";
const WHITE = "#FFFFFF";
const INSET = 64;

export type ShareCardInput = {
  templateId: ShareTemplateId;
  format: ShareFormat;
  journey: Journey;
  /** Resolved photo URIs for before/after (real journey data). */
  beforeUri: string | null;
  afterUri: string | null;
  /** Primary photo for streak/award/quote. */
  photoUri: string | null;
  streak: number;
  dayIndex: number;
  badge?: BadgeProgress | null;
  quote?: string;
  caption?: string;
  insightSeed?: number;
};

export function defaultCaption(journey: Journey, dayIndex: number): string {
  return `Day ${dayIndex} of ${journey.title}. Quiet work.`;
}

export function resolveSharePhotos(
  journey: Journey,
  logs: EvolutionLog[],
  logIds: string[]
): { beforeUri: string | null; afterUri: string | null; photoUri: string | null } {
  const byId = new Map(logs.map((l) => [l.id, l]));
  const sorted = logs
    .filter((l) => l.journeyId === journey.id)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  let beforeUri: string | null = journey.day1PhotoUri;
  let afterUri: string | null =
    journey.todayPhotoUri ?? sorted[sorted.length - 1]?.photoUri ?? null;

  if (logIds.length >= 2) {
    const a = byId.get(logIds[0]);
    const b = byId.get(logIds[1]);
    if (a) beforeUri = a.photoUri;
    if (b) afterUri = b.photoUri;
  } else if (logIds.length === 1) {
    const only = byId.get(logIds[0]);
    if (only) afterUri = only.photoUri;
  }

  const photoUri =
    afterUri ?? beforeUri ?? sorted[sorted.length - 1]?.photoUri ?? null;

  return { beforeUri, afterUri, photoUri };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawWordmark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const x = INSET;
  const y = h - 48;
  ctx.fillStyle = WHITE;
  ctx.font = "bold 30px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("GrowthVault", x, y);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(x, y + 6, 120, 4);
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  textColor = WHITE
) {
  ctx.font = "bold 22px Inter, system-ui, sans-serif";
  const padX = 18;
  const padY = 10;
  const tw = ctx.measureText(text).width;
  const pw = tw + padX * 2;
  const ph = 22 + padY * 2;
  roundRect(ctx, x, y, pw, ph, 999);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + ph / 2);
  return { w: pw, h: ph };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth || words.length > 0) {
      let trimmed = last;
      while (
        trimmed.length > 0 &&
        ctx.measureText(trimmed + "…").width > maxWidth
      ) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = trimmed + (trimmed === last ? "" : "…");
    }
  }
  return lines;
}

async function drawBeforeAfter(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  w: number,
  h: number
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const isStories = h > w;
  const titleTop = INSET;
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(input.journey.category.toUpperCase(), INSET, titleTop + 24);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  const titleLines = wrapText(ctx, input.journey.title, w - INSET * 2, 2);
  titleLines.forEach((ln, i) => {
    ctx.fillText(ln, INSET, titleTop + 80 + i * 56);
  });

  ctx.fillStyle = MUTED;
  ctx.font = "28px Inter, system-ui, sans-serif";
  ctx.fillText(`Day ${input.dayIndex}`, INSET, titleTop + 80 + titleLines.length * 56 + 36);

  const photoTop = titleTop + 80 + titleLines.length * 56 + 80;
  const photoBottom = h - 140;
  const photoH = Math.max(200, photoBottom - photoTop);
  const gap = 16;

  if (isStories) {
    // Vertical 50|50
    const half = (photoH - gap) / 2;
    const pw = w - INSET * 2;
    for (const [i, uri, label, pill] of [
      [0, input.beforeUri, "DAY 1", "rgba(0,0,0,0.55)"] as const,
      [1, input.afterUri, "TODAY", ACCENT] as const,
    ]) {
      const y = photoTop + i * (half + gap);
      roundRect(ctx, INSET, y, pw, half, 28);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#1A1A24";
      ctx.fillRect(INSET, y, pw, half);
      if (uri) {
        try {
          const img = await loadImage(uri);
          drawCover(ctx, img, INSET, y, pw, half);
        } catch {
          /* keep placeholder panel */
        }
      }
      ctx.restore();
      drawPill(ctx, label, INSET + 20, y + 20, pill);
    }
  } else {
    // Horizontal split for square
    const half = (w - INSET * 2 - gap) / 2;
    for (const [i, uri, label, pill] of [
      [0, input.beforeUri, "DAY 1", "rgba(0,0,0,0.55)"] as const,
      [1, input.afterUri, "TODAY", ACCENT] as const,
    ]) {
      const x = INSET + i * (half + gap);
      roundRect(ctx, x, photoTop, half, photoH, 28);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "#1A1A24";
      ctx.fillRect(x, photoTop, half, photoH);
      if (uri) {
        try {
          const img = await loadImage(uri);
          drawCover(ctx, img, x, photoTop, half, photoH);
        } catch {
          /* keep panel */
        }
      }
      ctx.restore();
      drawPill(ctx, label, x + 16, photoTop + 16, pill);
    }
  }

  ctx.fillStyle = MUTED;
  ctx.font = "22px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Private vault · On my phone", INSET, h - 100);
  drawWordmark(ctx, w, h);
}

async function drawStreak(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  w: number,
  h: number
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Soft photo wash behind
  if (input.photoUri) {
    try {
      const img = await loadImage(input.photoUri);
      ctx.globalAlpha = 0.25;
      drawCover(ctx, img, 0, 0, w, h);
      ctx.globalAlpha = 1;
      const grad = ctx.createLinearGradient(0, h * 0.3, 0, h);
      grad.addColorStop(0, "rgba(11,11,16,0.4)");
      grad.addColorStop(1, "rgba(11,11,16,0.95)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } catch {
      /* bg only */
    }
  }

  const cx = w / 2;
  const cy = h * 0.42;

  // Flame circle
  ctx.beginPath();
  ctx.arc(cx, cy - 120, 90, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,159,67,0.18)";
  ctx.fill();
  ctx.fillStyle = FLAME;
  ctx.font = "bold 96px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🔥", cx, cy - 120);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 160px Inter, system-ui, sans-serif";
  ctx.fillText(String(Math.max(0, input.streak)), cx, cy + 60);

  ctx.fillStyle = ACCENT;
  ctx.font = "bold 28px Inter, system-ui, sans-serif";
  ctx.fillText("DAY STREAK", cx, cy + 160);

  ctx.fillStyle = MUTED;
  ctx.font = "32px Inter, system-ui, sans-serif";
  const nameLines = wrapText(ctx, input.journey.title, w - INSET * 2, 2);
  nameLines.forEach((ln, i) => {
    ctx.fillText(ln, cx, cy + 220 + i * 40);
  });

  drawWordmark(ctx, w, h);
}

async function drawAward(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  w: number,
  h: number
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const badge = input.badge;
  const meta = badge ? BADGE_META[badge.id] : null;
  const title = meta?.title ?? "Vault Award";
  const blurb = meta?.description ?? "Keep showing up.";

  const cx = w / 2;
  const cy = h * 0.38;

  // Accent border frame
  roundRect(ctx, INSET, INSET, w - INSET * 2, h - INSET * 2 - 40, 36);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Squircle icon
  const sq = 160;
  roundRect(ctx, cx - sq / 2, cy - 200, sq, sq, 36);
  ctx.fillStyle = "rgba(159,132,255,0.22)";
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 72px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", cx, cy - 200 + sq / 2);

  drawPill(ctx, "UNLOCKED", cx - 70, cy - 10, ACCENT);

  ctx.fillStyle = WHITE;
  ctx.font = "bold 52px Inter, system-ui, sans-serif";
  const titleLines = wrapText(ctx, title, w - INSET * 2 - 40, 2);
  titleLines.forEach((ln, i) => {
    ctx.fillText(ln, cx, cy + 80 + i * 60);
  });

  ctx.fillStyle = MUTED;
  ctx.font = "italic 28px Inter, system-ui, sans-serif";
  const blurbLines = wrapText(ctx, blurb, w - INSET * 2 - 40, 3);
  blurbLines.forEach((ln, i) => {
    ctx.fillText(ln, cx, cy + 80 + titleLines.length * 60 + 40 + i * 36);
  });

  ctx.fillStyle = MUTED;
  ctx.font = "26px Inter, system-ui, sans-serif";
  ctx.fillText(input.journey.title, cx, h - 160);

  drawWordmark(ctx, w, h);
}

async function drawQuote(
  ctx: CanvasRenderingContext2D,
  input: ShareCardInput,
  w: number,
  h: number
) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const photoH = Math.floor(h * 0.55);
  roundRect(ctx, 0, 0, w, photoH, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, photoH);
  ctx.clip();
  ctx.fillStyle = "#1A1A24";
  ctx.fillRect(0, 0, w, photoH);
  if (input.photoUri) {
    try {
      const img = await loadImage(input.photoUri);
      drawCover(ctx, img, 0, 0, w, photoH);
    } catch {
      /* panel */
    }
  }
  // Bottom scrim on photo
  const scrim = ctx.createLinearGradient(0, photoH * 0.55, 0, photoH);
  scrim.addColorStop(0, "transparent");
  scrim.addColorStop(1, "rgba(11,11,16,0.85)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, photoH);
  ctx.restore();

  const quote =
    input.quote ??
    pickQuote(EVOLUTION_INSIGHTS, input.insightSeed ?? 7);

  const cardY = photoH - 40;
  const cardH = h - cardY - 120;
  roundRect(ctx, INSET, cardY, w - INSET * 2, cardH, 28);
  ctx.fillStyle = "#1A1A24";
  ctx.fill();
  ctx.strokeStyle = "rgba(159,132,255,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = ACCENT;
  ctx.font = "bold 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("EVOLUTION INSIGHT", INSET + 36, cardY + 48);

  ctx.fillStyle = MUTED;
  ctx.font = "italic 34px Inter, system-ui, sans-serif";
  const qLines = wrapText(ctx, `"${quote}"`, w - INSET * 2 - 72, 5);
  qLines.forEach((ln, i) => {
    ctx.fillText(ln, INSET + 36, cardY + 100 + i * 44);
  });

  ctx.fillStyle = WHITE;
  ctx.font = "26px Inter, system-ui, sans-serif";
  ctx.fillText(input.journey.title, INSET + 36, cardY + cardH - 36);

  drawWordmark(ctx, w, h);
}

/** Render share card to PNG blob. Uses real journey photo URIs — never fake social. */
export async function renderShareCardPng(
  input: ShareCardInput
): Promise<Blob> {
  const { w, h } = SHARE_SIZES[input.format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  switch (input.templateId) {
    case "before_after":
      await drawBeforeAfter(ctx, input, w, h);
      break;
    case "streak":
      await drawStreak(ctx, input, w, h);
      break;
    case "award":
      await drawAward(ctx, input, w, h);
      break;
    case "quote":
      await drawQuote(ctx, input, w, h);
      break;
    default:
      await drawBeforeAfter(ctx, input, w, h);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG encode failed"));
      },
      "image/png",
      1
    );
  });
}

export type ShareResult =
  | { status: "shared" }
  | { status: "cancelled" }
  | { status: "downloaded" }
  | { status: "error"; message: string };

/**
 * System share sheet only. Cancel / AbortError → quiet cancelled (no shame).
 * Falls back to Capacitor Share text, then download.
 */
export async function sharePngBlob(
  blob: Blob,
  opts: { caption?: string; filename?: string } = {}
): Promise<ShareResult> {
  const filename = opts.filename ?? "growthvault-share.png";
  const caption = opts.caption?.trim() || undefined;
  const file = new File([blob], filename, { type: "image/png" });

  // Web Share API with files (Android Chrome / Capacitor WebView)
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      const canFiles =
        typeof navigator.canShare === "function"
          ? navigator.canShare({ files: [file] })
          : true;
      if (canFiles) {
        await navigator.share({
          files: [file],
          title: "GrowthVault",
          text: caption,
        });
        return { status: "shared" };
      }
      // Text-only share still counts as system sheet
      await navigator.share({
        title: "GrowthVault",
        text: caption ?? "Shared from GrowthVault",
      });
      // Also trigger download so the PNG is available
      downloadBlob(blob, filename);
      return { status: "shared" };
    }
  } catch (err) {
    if (isAbort(err)) return { status: "cancelled" };
    // fall through
  }

  // Capacitor Share plugin (text + hint; PNG via download companion)
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({
      title: "GrowthVault",
      text: caption ?? "Shared from GrowthVault",
      dialogTitle: "Share card",
    });
    downloadBlob(blob, filename);
    return { status: "shared" };
  } catch (err) {
    if (isAbort(err)) return { status: "cancelled" };
    // fall through to download
  }

  try {
    downloadBlob(blob, filename);
    return { status: "downloaded" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Share failed",
    };
  }
}

function isAbort(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; message?: string };
  return (
    e.name === "AbortError" ||
    /abort|cancel/i.test(e.message ?? "") ||
    /cancel/i.test(e.name ?? "")
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function pickAwardBadge(
  badges: BadgeProgress[]
): BadgeProgress | null {
  const unlocked = badges.filter((b) => b.unlockedAt);
  if (unlocked.length === 0) return badges[0] ?? null;
  return unlocked.sort(
    (a, b) =>
      new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
  )[0];
}

export function journeyDayIndex(journey: Journey): number {
  return daysSinceStart(journey.startedAt);
}
