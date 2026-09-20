"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JOURNEY_TEMPLATES } from "@/data/templates";
import type { Category } from "@/lib/types";
import { CategoryPill } from "@/components/ui";

const FILTERS: Array<"All" | Category> = [
  "All",
  "Fitness",
  "Mindset",
  "Career",
  "Creative",
];

export default function ExplorePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const templates = useMemo(
    () =>
      filter === "All"
        ? JOURNEY_TEMPLATES
        : JOURNEY_TEMPLATES.filter((t) => t.category === filter),
    [filter]
  );

  return (
    <div className="gv-page space-y-4">
      <header>
        <h1 className="text-[28px] font-bold">Explore</h1>
        <p className="mt-1 text-sm text-gv-text-muted">
          Start a proven journey template.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`gv-pill shrink-0 px-3 py-1.5 text-xs font-semibold ${
              filter === f
                ? "bg-gv-accent text-white"
                : "bg-gv-card text-gv-text-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {templates.length === 0 ? (
        <p className="py-10 text-center text-sm italic text-gv-text-muted">
          Nothing to explore yet.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/explore/${t.id}`}
              className="gv-card block overflow-hidden"
            >
              <div
                className="h-28 w-full"
                style={{ background: t.coverGradient }}
              />
              <div className="space-y-2 p-4">
                <CategoryPill label={t.category} />
                <h2 className="text-lg font-bold">{t.title}</h2>
                <p className="text-sm text-gv-text-muted">{t.blurb}</p>
                <p className="gv-eyebrow text-gv-accent-text">
                  {t.durationDays} days
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
