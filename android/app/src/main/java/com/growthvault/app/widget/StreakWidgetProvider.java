package com.growthvault.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.growthvault.app.MainActivity;
import com.growthvault.app.R;

public class StreakWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = WidgetPrefs.get(context);
        int streak = prefs.getInt(WidgetPrefs.KEY_STREAK, -1);
        String title = prefs.getString(WidgetPrefs.KEY_TITLE, "Open app to sync");
        String streakText = streak < 0 ? "—" : String.valueOf(streak);

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
            views.setTextViewText(R.id.widget_streak, streakText);
            views.setTextViewText(R.id.widget_journey, title);
            views.setOnClickPendingIntent(R.id.widget_root, deepLink(context));
            manager.updateAppWidget(id, views);
        }
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, StreakWidgetProvider.class));
        if (ids != null && ids.length > 0) {
            new StreakWidgetProvider().onUpdate(context, manager, ids);
        }
    }

    static PendingIntent deepLink(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("growthvault://home"));
        intent.putExtra("growthvault_deep_link", "/home");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= 23) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getActivity(context, 1001, intent, flags);
    }
}
