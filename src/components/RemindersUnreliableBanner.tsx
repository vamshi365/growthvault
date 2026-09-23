"use client";

import Link from "next/link";
import { REMINDERS_UNRELIABLE_BANNER } from "@/lib/reminders";
import { anyReminderEnabled } from "@/lib/reminders";
import type { ReminderPrefs } from "@/lib/types";

type Props = {
  prefs: ReminderPrefs;
  onDismiss?: () => void;
  /** Always show on settings page even if dismissed on home. */
  force?: boolean;
};

export function RemindersUnreliableBanner({ prefs, onDismiss, force }: Props) {
  if (!prefs.remindersUnreliable) return null;
  if (!anyReminderEnabled(prefs) && !force) return null;
  if (!force && prefs.unreliableBannerDismissed) return null;

  return (
    <div
      className="gv-card flex items-start gap-3 border border-gv-accent/40 bg-[rgba(159,132,255,0.1)] p-3"
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gv-accent-text">
          {REMINDERS_UNRELIABLE_BANNER}
        </p>
        <p className="mt-1 text-xs text-gv-text-muted">
          Some Android skins pause alarms. A home widget is the reliable fallback.
        </p>
        <Link
          href="/settings/reminders"
          className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-gv-accent"
        >
          Reminder settings →
        </Link>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded-[12px] text-gv-text-muted"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          ✕
        </button>
      )}
    </div>
  );
}
