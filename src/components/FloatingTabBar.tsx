"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AwardsIcon,
  ExploreIcon,
  HomeIcon,
  PlusIcon,
  StatsIcon,
} from "./icons";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/home", label: "HOME", Icon: HomeIcon },
  { href: "/explore", label: "EXPLORE", Icon: ExploreIcon },
  { href: "/stats", label: "STATS", Icon: StatsIcon },
  { href: "/awards", label: "AWARDS", Icon: AwardsIcon },
] as const;

export function FloatingTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { snapshot } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasJourneys = snapshot.journeys.some((j) => j.status === "active");

  const hide =
    pathname.startsWith("/journeys/new") ||
    pathname.includes("/log") ||
    pathname.includes("/compare") ||
    pathname.startsWith("/profile/passcode");

  if (hide) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute bottom-[100px] left-1/2 w-[min(400px,calc(100%-40px))] -translate-x-1/2 rounded-[28px] border border-gv-border bg-gv-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="gv-eyebrow mb-3 text-gv-accent-text">Quick actions</p>
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between rounded-[22px] bg-gv-muted px-4 py-4 text-left font-semibold"
              onClick={() => {
                setSheetOpen(false);
                router.push("/journeys/new");
              }}
            >
              New Journey
              <span className="text-gv-accent">→</span>
            </button>
            <button
              type="button"
              disabled={!hasJourneys}
              className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left font-semibold ${
                hasJourneys
                  ? "bg-gv-muted"
                  : "cursor-not-allowed bg-gv-muted/50 text-gv-text-muted"
              }`}
              onClick={() => {
                if (!hasJourneys) return;
                setSheetOpen(false);
                const primary =
                  snapshot.profile.primaryJourneyId ??
                  snapshot.journeys.find((j) => j.status === "active")?.id;
                if (primary) router.push(`/journeys/${primary}/log`);
              }}
            >
              <span>
                Log Evolution
                {!hasJourneys && (
                  <span className="mt-1 block text-xs font-normal text-gv-text-muted">
                    Start a journey first
                  </span>
                )}
              </span>
              <span className="text-gv-accent">→</span>
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-4 left-1/2 z-50 flex w-[min(420px,calc(100%-24px))] -translate-x-1/2 items-end justify-between rounded-[28px] border border-gv-border bg-[rgba(18,18,24,0.92)] px-2 pb-2 pt-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))" }}
        aria-label="Main"
      >
        {/* Left pair */}
        <div className="flex flex-1 justify-around">
          {TABS.slice(0, 2).map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1 ${
                  active ? "text-gv-accent" : "text-gv-text-muted"
                }`}
              >
                <Icon />
                <span className="text-[10px] font-semibold tracking-[0.06em]">
                  {label}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-gv-accent" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* FAB */}
        <div className="relative mx-1 flex w-16 justify-center">
          <button
            type="button"
            aria-label="Add"
            onClick={() => setSheetOpen(true)}
            className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-gv-accent text-white shadow-[0_8px_24px_rgba(159,132,255,0.45)]"
          >
            <PlusIcon />
          </button>
          <div className="h-10" />
        </div>

        {/* Right pair */}
        <div className="flex flex-1 justify-around">
          {TABS.slice(2).map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-1 ${
                  active ? "text-gv-accent" : "text-gv-text-muted"
                }`}
              >
                <span
                  className={
                    active && href === "/awards"
                      ? "rounded-[14px] bg-[rgba(159,132,255,0.15)] p-1"
                      : ""
                  }
                >
                  <Icon />
                </span>
                <span className="text-[10px] font-semibold tracking-[0.06em]">
                  {label}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-gv-accent" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
