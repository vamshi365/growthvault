import type { EvolutionLog, Journey } from "./types";

export type OverlayReference = {
  /** Stable id for referenceLogId on save — "day1" synthetic or a log id */
  id: string;
  photoUri: string;
  label: string;
  kind: "day1" | "log";
};

/**
 * Pick ghost reference: Day1 journey photo first, else most recent prior log.
 * Missing Day1 and no logs → null (overlay disabled).
 */
export function resolveOverlayReference(
  journey: Journey | undefined,
  logs: EvolutionLog[],
  prefer: "day1" | "last" = "day1"
): OverlayReference | null {
  if (!journey) return null;
  const journeyLogs = logs
    .filter((l) => l.journeyId === journey.id)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (prefer === "last" && journeyLogs[0]) {
    return {
      id: journeyLogs[0].id,
      photoUri: journeyLogs[0].photoUri,
      label: `Day ${journeyLogs[0].dayIndex}`,
      kind: "log",
    };
  }

  if (journey.day1PhotoUri) {
    // Prefer linking to the earliest log if it is the Day1 shot; else synthetic id
    const earliest = [...journeyLogs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
    const day1Log =
      earliest && earliest.photoUri === journey.day1PhotoUri
        ? earliest
        : null;
    return {
      id: day1Log?.id ?? `day1:${journey.id}`,
      photoUri: journey.day1PhotoUri,
      label: "Day 1",
      kind: day1Log ? "log" : "day1",
    };
  }

  if (journeyLogs[0]) {
    return {
      id: journeyLogs[0].id,
      photoUri: journeyLogs[0].photoUri,
      label: `Day ${journeyLogs[0].dayIndex}`,
      kind: "log",
    };
  }

  return null;
}

/**
 * Downscale a data-URL image for overlay preview (keeps full-res for save).
 * Max edge 720px; returns original on failure.
 */
export async function downscaleForOverlay(
  dataUrl: string,
  maxEdge = 720
): Promise<string> {
  if (typeof window === "undefined") return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return dataUrl;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    if (scale >= 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/** Persistable referenceLogId — omit synthetic day1: ids that are not real logs. */
export function toReferenceLogId(ref: OverlayReference | null): string | undefined {
  if (!ref) return undefined;
  if (ref.kind === "day1") return undefined;
  return ref.id;
}


/**
 * True pixel alpha over: out = src * a + dst * (1 - a).
 * Used to document/test the canvas overlay math (not CSS blend-mode).
 */
export function compositePixelAlpha(
  dstR: number,
  dstG: number,
  dstB: number,
  srcR: number,
  srcG: number,
  srcB: number,
  a: number
): [number, number, number] {
  const alpha = Math.min(1, Math.max(0, a));
  const inv = 1 - alpha;
  return [
    Math.round(srcR * alpha + dstR * inv),
    Math.round(srcG * alpha + dstG * inv),
    Math.round(srcB * alpha + dstB * inv),
  ];
}
