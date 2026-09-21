"use client";

type CompareSplitProps = {
  leftUri: string;
  rightUri: string;
  leftLabel: string;
  rightLabel: string;
  leftMeta?: string;
  rightMeta?: string;
};

/** Side-by-side A/B split matching Home hero language. Clear Day1 / Today labels. */
export function CompareSplit({
  leftUri,
  rightUri,
  leftLabel,
  rightLabel,
  leftMeta,
  rightMeta,
}: CompareSplitProps) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border border-gv-border"
      data-testid="compare-split"
    >
      <div className="grid grid-cols-2">
        <div className="relative aspect-[3/4] bg-gv-muted">
          {leftUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={leftUri}
              alt={leftLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gv-text-muted">
              No photo
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {leftLabel}
          </span>
        </div>
        <div className="relative aspect-[3/4] bg-gv-muted">
          {rightUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={rightUri}
              alt={rightLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gv-text-muted">
              No photo
            </div>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-gv-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {rightLabel}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 bg-gv-card px-3 py-3 text-center text-xs font-semibold text-gv-text-muted">
        <span data-testid="compare-left-meta">{leftMeta ?? leftLabel}</span>
        <span data-testid="compare-right-meta">{rightMeta ?? rightLabel}</span>
      </div>
    </div>
  );
}
