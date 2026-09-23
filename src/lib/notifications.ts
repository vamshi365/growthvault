"use client";

import { Capacitor } from "@capacitor/core";
import type { ReminderPrefs } from "./types";
import {
  REMINDER_BODY,
  REMINDER_TITLE,
  anyReminderEnabled,
  isInQuietHours,
  notificationIdForJourney,
} from "./reminders";

type ScheduleResult = {
  ok: boolean;
  unreliable: boolean;
  error?: string;
};

/**
 * Best-effort local notification schedule.
 * OEMs may kill exact alarms — callers must surface unreliable banner.
 */
export async function syncLocalReminders(
  prefs: ReminderPrefs,
  journeyTitles: Record<string, string>
): Promise<ScheduleResult> {
  if (!Capacitor.isNativePlatform()) {
    return { ok: true, unreliable: false };
  }

  try {
    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );

    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") {
      return {
        ok: false,
        unreliable: true,
        error: "Notification permission not granted",
      };
    }

    // Cancel previously scheduled vault reminders in our id band
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(
      (n) => typeof n.id === "number" && n.id >= 42000 && n.id < 52000
    );
    if (ours.length) {
      await LocalNotifications.cancel({ notifications: ours });
    }

    if (!anyReminderEnabled(prefs)) {
      return { ok: true, unreliable: prefs.remindersUnreliable };
    }

    // If currently in quiet hours we still schedule — delivery time is the reminder clock;
    // quiet hours are enforced by shifting next fire when schedule time falls inside quiet window.
    const notifications = prefs.reminders
      .filter((r) => r.enabled)
      .map((r) => {
        const { hour, minute } = adjustForQuietHours(
          r.hour,
          r.minute,
          prefs.quietHours
        );
        const title = journeyTitles[r.journeyId]
          ? `${REMINDER_TITLE} · ${journeyTitles[r.journeyId]}`
          : REMINDER_TITLE;
        return {
          id: notificationIdForJourney(r.journeyId),
          title,
          body: REMINDER_BODY,
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true,
          },
          extra: { journeyId: r.journeyId, deepLink: "/home" },
        };
      });

    if (notifications.length) {
      await LocalNotifications.schedule({ notifications });
    }

    return { ok: true, unreliable: prefs.remindersUnreliable };
  } catch (e) {
    return {
      ok: false,
      unreliable: true,
      error: e instanceof Error ? e.message : "schedule failed",
    };
  }
}

/** If scheduled clock falls in quiet hours, fire at quiet-hours end instead. */
function adjustForQuietHours(
  hour: number,
  minute: number,
  quiet: ReminderPrefs["quietHours"]
): { hour: number; minute: number } {
  const probe = new Date();
  probe.setHours(hour, minute, 0, 0);
  if (isInQuietHours(quiet, probe)) {
    return { hour: quiet.endHour, minute: quiet.endMinute };
  }
  return { hour, minute };
}

/** Mark OEM-unreliable after a failed schedule or user report. */
export function withUnreliableFlag(
  prefs: ReminderPrefs,
  unreliable: boolean
): ReminderPrefs {
  return {
    ...prefs,
    remindersUnreliable: unreliable,
    unreliableBannerDismissed: unreliable
      ? false
      : prefs.unreliableBannerDismissed,
  };
}
