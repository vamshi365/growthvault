"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

type WidgetDataPlugin = {
  update(options: {
    streak: number;
    journeyTitle: string;
    dayLabel: string;
  }): Promise<void>;
};

const WidgetData = registerPlugin<WidgetDataPlugin>("WidgetData");

/**
 * Push live streak/journey into Android App Widget SharedPreferences.
 * No-op on web. Failures are silent (widget shows last known / placeholder).
 */
export async function pushWidgetData(input: {
  streak: number;
  journeyTitle?: string | null;
  dayLabel?: string | null;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await WidgetData.update({
      streak: input.streak,
      journeyTitle: input.journeyTitle?.trim() || "GrowthVault",
      dayLabel: input.dayLabel?.trim() || "Open to log",
    });
  } catch {
    /* best-effort */
  }
}
