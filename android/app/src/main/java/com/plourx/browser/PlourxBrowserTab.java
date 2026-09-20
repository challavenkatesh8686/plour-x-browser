package com.plourx.browser;

import android.graphics.Bitmap;
import android.webkit.WebView;

/** Per-tab state the plugin tracks. `webView` is null while the tab is suspended. */
class PlourxBrowserTab {
    final String tabId;
    WebView webView;
    String lastUrl = "";
    boolean crashed = false;
    boolean desktopMode = false;
    Bitmap thumbnail;
    long lastActiveAt = System.currentTimeMillis();

    PlourxBrowserTab(String tabId) {
        this.tabId = tabId;
    }
}
