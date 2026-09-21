"use client";

import Link from "next/link";
import type { Journey, EvolutionLog } from "@/lib/types";
import { journeyProgress, relativeTime, daysSinceStart } from "@/lib/streaks";
import { BoltIcon, FlameIcon, SparkleIcon, UserIcon } from "./icons";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="gv-progress h-[6px] w-full overflow-hidden rounded-full bg-gv-track">
      <div
        className="h-full rounded-full bg-gv-accent transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  hint,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  hint?: string;
}) {
  return (
    <div className="gv-card flex flex-col items-center px-5 py-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[rgba(159,132,255,0.18)] text-gv-accent">
        <SparkleIcon />
      </div>
      <p className="gv-section-title">{title}</p>
      <p className="mt-2 max-w-xs text-[14px] italic leading-relaxed text-gv-text-muted">
        {body}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="gv-cta mt-5 flex w-full max-w-sm items-center justify-center px-6 text-sm"
        >
          {actionLabel}
        </Link>
      )}
      {hint && (
        <p className="mt-2 text-xs text-gv-text-muted">{hint}</p>
      )}
    </div>
  );
}

export function InsightCard({
  title,
  quote,
}: {
  title: string;
  quote: string;
}) {
  return (
    <div className="gv-card flex items-start gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(159,132,255,0.18)] text-gv-accent">
        <SparkleIcon />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-[14px] italic leading-relaxed text-gv-text-muted">
          “{quote}”
        </p>
      </div>
    </div>
  );
}

export function QuickStatPair({
  streak,
  logs,
}: {
  streak: number;
  logs: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="gv-tile p-4">
        <p className="gv-eyebrow text-gv-accent">Streak</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="gv-metric">{streak}</span>
          <FlameIcon className="mb-1 text-gv-flame" />
        </div>
        <p className="mt-1 text-[10px] text-gv-text-muted">Vault total</p>
      </div>
      <div className="gv-tile p-4">
        <p className="gv-eyebrow text-gv-accent">Growth Logs</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="gv-metric">{logs}</span>
          <BoltIcon className="mb-1 text-gv-accent" />
        </div>
        <p className="mt-1 text-[10px] text-gv-text-muted">Vault total</p>
      </div>
    </div>
  );
}

export function CategoryPill({ label }: { label: string }) {
  return (
    <span className="gv-pill inline-flex min-h-[28px] items-center border border-[rgba(159,132,255,0.35)] bg-[rgba(159,132,255,0.12)] px-2.5 py-1 text-[10px] font-bold tracking-[0.06em] text-gv-accent-text">
      {label.toUpperCase()}
    </span>
  );
}

export function HeroSplitCard({
  journey,
  streak,
  logCount,
}: {
  journey: Journey;
  streak: number;
  logCount: number;
}) {
  const day = daysSinceStart(journey.startedAt);
  return (
    <Link href={`/journeys/${journey.id}`} className="block min-h-0">
      <div className="relative overflow-hidden rounded-[28px] border border-gv-border shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="grid grid-cols-2">
          <div className="relative aspect-[3/4] bg-gv-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={journey.day1PhotoUri ?? ""}
              alt="Day 1"
              className="h-full w-full object-cover grayscale"
            />
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
              DAY 1
            </span>
          </div>
          <div className="relative aspect-[3/4] bg-gv-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={journey.todayPhotoUri ?? journey.day1PhotoUri ?? ""}
              alt="Today"
              className="h-full w-full object-cover"
            />
            <span className="absolute right-3 top-3 rounded-full bg-gv-accent px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
              TODAY
            </span>
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-20"
          style={{
            background:
              "linear-gradient(transparent, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.92))",
          }}
        >
          <CategoryPill
            label={
              journey.category === "Fitness" ? "Growth Seeker" : journey.category
            }
          />
          <h2 className="mt-2 text-xl font-bold leading-tight text-white">
            {journey.title}
          </h2>
          <div className="mt-2 flex items-center gap-4 text-sm text-white/90">
            <span className="inline-flex items-center gap-1">
              <FlameIcon className="text-gv-flame" size={16} />
              {streak} day streak
            </span>
            <span className="inline-flex items-center gap-1">
              <BoltIcon className="text-gv-accent" size={16} />
              {logCount} logs · Day {day}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function JourneyListCard({
  journey,
  logs,
}: {
  journey: Journey;
  logs: EvolutionLog[];
}) {
  const day = daysSinceStart(journey.startedAt);
  const latest = logs[0]?.dayIndex ?? day;
  const pct = journeyProgress(latest, journey.durationDays);
  return (
    <Link
      href={`/journeys/${journey.id}`}
      className="gv-card flex min-h-[72px] items-center gap-3 p-3"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-gv-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={journey.todayPhotoUri ?? journey.day1PhotoUri ?? ""}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryPill label={journey.category} />
          <span className="rounded-full bg-gv-muted px-2 py-0.5 text-[10px] text-gv-text-muted">
            Day {day}
          </span>
        </div>
        <p className="mt-1 truncate font-semibold">{journey.title}</p>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-[11px] font-bold tracking-wider text-[#A1A1AA]">
            <span>PROGRESS</span>
            <span>
              {latest} / {journey.durationDays}
            </span>
          </div>
          <ProgressBar value={pct} />
        </div>
      </div>
    </Link>
  );
}

export function ProfileButton() {
  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted text-gv-text-muted"
    >
      <UserIcon />
    </Link>
  );
}

export function GradientCtaButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="gv-cta w-full py-4 text-sm disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconClass?: string;
}) {
  return (
    <div className="gv-tile p-4">
      <span className={iconClass}>{icon}</span>
      <p className="gv-eyebrow mt-2 text-gv-text-muted">{label}</p>
      <p className="gv-metric mt-2">{value}</p>
    </div>
  );
}

export function ActivityBarChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="gv-card p-5">
      <p className="gv-section-title">Activity per Journey</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm italic text-gv-text-muted">
          No journeys yet. Start one to see activity.
        </p>
      ) : (
        <div className="mt-5 flex items-end gap-3" style={{ minHeight: 140 }}>
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-2"
              title={item.label}
            >
              <span className="text-xs font-semibold text-gv-accent-text">
                {item.value}
              </span>
              <div
                className="w-full max-w-[48px] rounded-t-2xl bg-gv-accent"
                style={{
                  height: `${Math.max(4, (item.value / max) * 110)}px`,
                }}
              />
              <span className="max-w-full truncate text-center text-[10px] text-gv-text-muted">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogThumb({
  log,
  variant = "grid",
}: {
  log: EvolutionLog;
  variant?: "grid" | "list";
}) {
  if (variant === "grid") {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[16px] bg-gv-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={log.photoUri} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 bg-[rgba(159,132,255,0.5)] px-2 py-1 text-[10px] font-semibold text-white">
          {relativeTime(log.createdAt)}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="h-3 w-3 rounded-full bg-gv-accent" />
        <span className="w-px flex-1 bg-gv-border" />
      </div>
      <div className="mb-4 flex flex-1 gap-3 pb-2">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-gv-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={log.photoUri} alt="" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-semibold">Day {log.dayIndex}</p>
          <p className="text-xs text-gv-accent-text">{relativeTime(log.createdAt)}</p>
          {log.note && (
            <p className="mt-1 text-sm text-gv-text-muted">{log.note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
