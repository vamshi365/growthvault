package com.growthvault.app.widget;

import android.content.Context;
import android.content.SharedPreferences;

public final class WidgetPrefs {
    public static final String PREFS = "growthvault_widget";
    public static final String KEY_STREAK = "streak";
    public static final String KEY_TITLE = "journeyTitle";
    public static final String KEY_DAY = "dayLabel";

    private WidgetPrefs() {}

    public static SharedPreferences get(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void write(Context ctx, int streak, String title, String dayLabel) {
        get(ctx).edit()
            .putInt(KEY_STREAK, streak)
            .putString(KEY_TITLE, title != null ? title : "GrowthVault")
            .putString(KEY_DAY, dayLabel != null ? dayLabel : "Open to log")
            .apply();
    }
}
