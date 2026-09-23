import type { QuietHours, Reminder, ReminderPrefs } from "./types";

export const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  startHour: 22,
  startMinute: 0,
  endHour: 7,
  endMinute: 0,
};

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  reminders: [],
  quietHours: { ...DEFAULT_QUIET_HOURS },
  remindersUnreliable: false,
  unreliableBannerDismissed: false,
};

/** Gentle copy only — never guilt. */
export const REMINDER_TITLE = "GrowthVault";
export const REMINDER_BODY = "Log today’s evolution?";
export const REMINDERS_UNRELIABLE_BANNER =
  "Reminders unreliable — add widget";

export function isInQuietHours(
  quiet: QuietHours,
  now = new Date()
): boolean {
  if (!quiet.enabled) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = quiet.startHour * 60 + quiet.startMinute;
  const end = quiet.endHour * 60 + quiet.endMinute;
  if (start === end) return true;
  if (start < end) return mins >= start && mins < end;
  // Wraps midnight
  return mins >= start || mins < end;
}

export function reminderForJourney(
  prefs: ReminderPrefs,
  journeyId: string
): Reminder | undefined {
  return prefs.reminders.find((r) => r.journeyId === journeyId);
}

export function upsertReminder(
  prefs: ReminderPrefs,
  reminder: Reminder
): ReminderPrefs {
  const others = prefs.reminders.filter((r) => r.journeyId !== reminder.journeyId);
  return { ...prefs, reminders: [...others, reminder] };
}

export function anyReminderEnabled(prefs: ReminderPrefs): boolean {
  return prefs.reminders.some((r) => r.enabled);
}

/** Notification id namespace — one id per journey. */
export function notificationIdForJourney(journeyId: string): number {
  let h = 0;
  for (let i = 0; i < journeyId.length; i++) {
    h = (h * 31 + journeyId.charCodeAt(i)) | 0;
  }
  const n = Math.abs(h) % 10000;
  return 42000 + n;
}
