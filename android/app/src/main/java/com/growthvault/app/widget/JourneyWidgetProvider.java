package com.growthvault.app.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import com.growthvault.app.R;

public class JourneyWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = WidgetPrefs.get(context);
        int streak = prefs.getInt(WidgetPrefs.KEY_STREAK, -1);
        String title = prefs.getString(WidgetPrefs.KEY_TITLE, "GrowthVault");
        String day = prefs.getString(WidgetPrefs.KEY_DAY, "Open to log");
        String streakLine = streak < 0 ? "Streak —" : ("Streak " + streak);

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_journey);
            views.setTextViewText(R.id.widget_journey_title, title);
            views.setTextViewText(R.id.widget_journey_day, day);
            views.setTextViewText(R.id.widget_journey_streak, streakLine);
            views.setOnClickPendingIntent(R.id.widget_journey_root, StreakWidgetProvider.deepLink(context));
            manager.updateAppWidget(id, views);
        }
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, JourneyWidgetProvider.class));
        if (ids != null && ids.length > 0) {
            new JourneyWidgetProvider().onUpdate(context, manager, ids);
        }
    }
}
