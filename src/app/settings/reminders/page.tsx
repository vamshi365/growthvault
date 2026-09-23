"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { BackIcon } from "@/components/icons";
import { RemindersUnreliableBanner } from "@/components/RemindersUnreliableBanner";
import {
  REMINDER_BODY,
  upsertReminder,
} from "@/lib/reminders";
import type { Reminder } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function RemindersSettingsPage() {
  const { ready, snapshot, updateReminderPrefs } = useStore();
  const prefs = snapshot.reminderPrefs;
  const active = snapshot.journeys.filter((j) => j.status === "active");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const primaryId =
    snapshot.profile.primaryJourneyId ?? active[0]?.id ?? null;

  const current: Reminder = useMemo(() => {
    const existing = prefs.reminders.find((r) => r.journeyId === primaryId);
    return (
      existing ?? {
        journeyId: primaryId ?? "none",
        hour: 19,
        minute: 0,
        enabled: false,
      }
    );
  }, [prefs.reminders, primaryId]);

  const [hour, setHour] = useState(current.hour);
  const [minute, setMinute] = useState(current.minute);
  const [enabled, setEnabled] = useState(current.enabled);
  const [quietEnabled, setQuietEnabled] = useState(prefs.quietHours.enabled);
  const [qStart, setQStart] = useState(
    `${pad(prefs.quietHours.startHour)}:${pad(prefs.quietHours.startMinute)}`
  );
  const [qEnd, setQEnd] = useState(
    `${pad(prefs.quietHours.endHour)}:${pad(prefs.quietHours.endMinute)}`
  );

  if (!ready) {
    return <div className="gv-page text-gv-text-muted">Loading…</div>;
  }

  async function save() {
    if (!primaryId) {
      setMsg("Start a journey first.");
      return;
    }
    setSaving(true);
    try {
      const [sh, sm] = qStart.split(":").map(Number);
      const [eh, em] = qEnd.split(":").map(Number);
      const next = upsertReminder(
        {
          ...prefs,
          quietHours: {
            enabled: quietEnabled,
            startHour: sh || 0,
            startMinute: sm || 0,
            endHour: eh || 0,
            endMinute: em || 0,
          },
        },
        { journeyId: primaryId, hour, minute, enabled }
      );
      await updateReminderPrefs(next);
      setMsg(
        enabled
          ? "Reminder saved. Delivery is best-effort on Android."
          : "Reminders off."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gv-page space-y-4">
      <header className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-gv-border bg-gv-muted"
        >
          <BackIcon />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Reminders</h1>
          <p className="text-xs text-gv-text-muted">
            Quiet schedule · best-effort delivery
          </p>
        </div>
      </header>

      <RemindersUnreliableBanner prefs={prefs} force />

      <div className="gv-card space-y-4 p-4">
        <p className="text-sm text-gv-text-muted">
          Copy: “{REMINDER_BODY}” — never guilt.
        </p>

        {!primaryId ? (
          <p className="text-sm text-gv-text-muted">
            No active journey yet.{" "}
            <Link href="/journeys/new" className="text-gv-accent">
              Begin one
            </Link>
          </p>
        ) : (
          <>
            <label className="flex min-h-[44px] items-center justify-between gap-3">
              <span className="font-semibold">Daily reminder</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 accent-[#9F84FF]"
              />
            </label>
            <label className="block space-y-2">
              <span className="gv-eyebrow text-gv-accent-text">Time</span>
              <input
                type="time"
                value={`${pad(hour)}:${pad(minute)}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setHour(h || 0);
                  setMinute(m || 0);
                }}
                className="w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none focus:border-gv-accent"
              />
            </label>
            <p className="text-xs text-gv-text-muted">
              Journey:{" "}
              {active.find((j) => j.id === primaryId)?.title ?? "Primary"}
            </p>
          </>
        )}
      </div>

      <div className="gv-card space-y-4 p-4">
        <label className="flex min-h-[44px] items-center justify-between gap-3">
          <span className="font-semibold">Quiet hours</span>
          <input
            type="checkbox"
            checked={quietEnabled}
            onChange={(e) => setQuietEnabled(e.target.checked)}
            className="h-5 w-5 accent-[#9F84FF]"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="gv-eyebrow text-gv-accent-text">Start</span>
            <input
              type="time"
              value={qStart}
              onChange={(e) => setQStart(e.target.value)}
              className="w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none focus:border-gv-accent"
            />
          </label>
          <label className="block space-y-2">
            <span className="gv-eyebrow text-gv-accent-text">End</span>
            <input
              type="time"
              value={qEnd}
              onChange={(e) => setQEnd(e.target.value)}
              className="w-full rounded-[22px] border border-gv-border bg-gv-muted px-4 py-3 outline-none focus:border-gv-accent"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        className="gv-cta w-full py-3 text-sm disabled:opacity-50"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save reminders"}
      </button>

      {msg && <p className="text-sm text-gv-accent-text">{msg}</p>}

      <p className="text-center text-xs leading-relaxed text-gv-text-muted">
        Local notifications only. If your phone pauses alarms, add the
        GrowthVault home widget for a reliable streak glance.
      </p>
    </div>
  );
}
