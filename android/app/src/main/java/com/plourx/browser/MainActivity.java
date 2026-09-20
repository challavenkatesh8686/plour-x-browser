package com.plourx.browser;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PlourxBrowserEnginePlugin.class);
        super.onCreate(savedInstanceState);
        // Chrome DevTools remote debugging is off by default (a real security
        // consideration per the spec's WebView-security review) and should
        // stay off in release; only turn it on for debug builds where it's a
        // genuine developer convenience.
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        if (level >= android.content.ComponentCallbacks2.TRIM_MEMORY_MODERATE) {
            PlourxBrowserEnginePlugin plugin = (PlourxBrowserEnginePlugin) getBridge().getPlugin("PlourxBrowserEngine").getInstance();
            if (plugin != null) plugin.trimMemory();
        }
    }
}
