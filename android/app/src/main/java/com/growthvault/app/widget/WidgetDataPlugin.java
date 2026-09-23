package com.growthvault.app.widget;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        Integer streak = call.getInt("streak", 0);
        String title = call.getString("journeyTitle", "GrowthVault");
        String day = call.getString("dayLabel", "Open to log");
        WidgetPrefs.write(getContext(), streak != null ? streak : 0, title, day);
        StreakWidgetProvider.refreshAll(getContext());
        JourneyWidgetProvider.refreshAll(getContext());
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }
}
