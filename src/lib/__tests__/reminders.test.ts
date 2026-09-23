import { describe, expect, it } from "vitest";
import {
  DEFAULT_REMINDER_PREFS,
  isInQuietHours,
  notificationIdForJourney,
  upsertReminder,
} from "@/lib/reminders";

describe("quiet hours", () => {
  it("detects wrap-midnight window", () => {
    const quiet = {
      enabled: true,
      startHour: 22,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
    };
    expect(isInQuietHours(quiet, new Date(2026, 8, 20, 23, 0))).toBe(true);
    expect(isInQuietHours(quiet, new Date(2026, 8, 20, 6, 59))).toBe(true);
    expect(isInQuietHours(quiet, new Date(2026, 8, 20, 12, 0))).toBe(false);
  });

  it("disabled quiet hours never suppress", () => {
    const quiet = { ...DEFAULT_REMINDER_PREFS.quietHours, enabled: false };
    expect(isInQuietHours(quiet, new Date(2026, 8, 20, 23, 0))).toBe(false);
  });
});

describe("upsertReminder", () => {
  it("replaces same journey id", () => {
    const prefs = upsertReminder(DEFAULT_REMINDER_PREFS, {
      journeyId: "j1",
      hour: 19,
      minute: 0,
      enabled: true,
    });
    const again = upsertReminder(prefs, {
      journeyId: "j1",
      hour: 8,
      minute: 30,
      enabled: true,
    });
    expect(again.reminders).toHaveLength(1);
    expect(again.reminders[0].hour).toBe(8);
  });
});

describe("notificationIdForJourney", () => {
  it("stays in 42000–51999 band", () => {
    const id = notificationIdForJourney("journey_abc");
    expect(id).toBeGreaterThanOrEqual(42000);
    expect(id).toBeLessThan(52000);
  });
});
