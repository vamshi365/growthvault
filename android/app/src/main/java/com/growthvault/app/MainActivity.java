package com.growthvault.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.growthvault.app.widget.WidgetDataPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetDataPlugin.class);
        super.onCreate(savedInstanceState);
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || bridge == null) return;
        Uri data = intent.getData();
        String path = intent.getStringExtra("growthvault_deep_link");
        if (path == null && data != null) {
            String host = data.getHost();
            if (host != null && !host.isEmpty()) {
                path = "/" + host;
            } else if (data.getPath() != null && !data.getPath().isEmpty()) {
                path = data.getPath();
            }
        }
        if (path != null && bridge.getWebView() != null) {
            final String target = path.startsWith("/") ? path : "/" + path;
            bridge.getWebView().post(() ->
                bridge.getWebView().evaluateJavascript(
                    "window.location.hash='';window.location.pathname='" + target + "';",
                    null
                )
            );
        }
    }
}
