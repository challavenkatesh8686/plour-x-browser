package com.plourx.browser;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.net.Uri;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;

/**
 * Real page rendering for PlourX Browser. Capacitor's own WebView renders
 * the React chrome and fills the whole Activity; this plugin adds one
 * android.webkit.WebView PER TAB as an additional sibling view in that same
 * root CoordinatorLayout (confirmed by inspecting activity_main.xml -- the
 * Capacitor WebView is a plain child of it, nothing fancier). Only the
 * active tab's WebView is ever visible, positioned to exactly the on-screen
 * rect JS reports for the content area below the toolbar / above the bottom
 * nav (see setViewportBounds) -- so it receives touch input completely
 * natively, with no transparent-WebView/touch-forwarding hack.
 *
 * At most MAX_ALIVE_ENGINES WebViews exist at once; least-recently-used
 * background tabs are suspended (destroyed, keeping only a thumbnail) to
 * bound memory, the same tradeoff every mobile browser makes.
 */
@CapacitorPlugin(name = "PlourxBrowserEngine")
public class PlourxBrowserEnginePlugin extends Plugin {
    private static final int MAX_ALIVE_ENGINES = 4;
    private static final String DESKTOP_USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    /** Access-ordered so the least-recently-used live tab is always first. */
    private final Map<String, PlourxBrowserTab> tabs = new LinkedHashMap<>(16, 0.75f, true);
    private CoordinatorLayout root;
    /** Tracks whichever tab is currently shown, so a system-triggered trim (see MainActivity.onTrimMemory) knows what NOT to suspend without JS having to tell it. */
    private String visibleTabId;

    private CoordinatorLayout getRoot() {
        if (root == null) {
            root = (CoordinatorLayout) getBridge().getWebView().getParent();
        }
        return root;
    }

    private PlourxBrowserTab requireTab(PluginCall call) {
        String tabId = call.getString("tabId");
        PlourxBrowserTab tab = tabId != null ? tabs.get(tabId) : null;
        if (tab == null) {
            call.reject("Unknown tabId: " + tabId);
        }
        return tab;
    }

    /**
     * Same lookup as requireTab but resolves as a harmless no-op instead of
     * rejecting when the tab is unknown, for calls where that's an expected,
     * recoverable race rather than a real error -- e.g. setVisible/
     * setViewportBounds can legitimately arrive for a tab whose
     * switchToTab-triggered lazy creation (see switchToTab) is still in
     * flight after a process restart. Anything that reads as a genuine user
     * command (loadUrl, goBack, closeTab, ...) should keep using
     * requireTab/reject instead.
     */
    private PlourxBrowserTab findTabOrResolve(PluginCall call) {
        String tabId = call.getString("tabId");
        PlourxBrowserTab tab = tabId != null ? tabs.get(tabId) : null;
        if (tab == null) call.resolve();
        return tab;
    }

    @PluginMethod
    public void createTab(PluginCall call) {
        String tabId = call.getString("tabId");
        if (tabId == null) {
            call.reject("tabId is required");
            return;
        }
        getActivity().runOnUiThread(() -> {
            PlourxBrowserTab tab = tabs.get(tabId);
            if (tab == null) {
                tab = new PlourxBrowserTab(tabId);
                tabs.put(tabId, tab);
            }
            attachWebView(tab);
            call.resolve();
        });
    }

    private void attachWebView(PlourxBrowserTab tab) {
        if (tab.webView != null) return;
        WebView webView = new WebView(getActivity());
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // NEVER_ALLOW is already the platform default for our targetSdk (21+), stated explicitly
        // here so a future edit doesn't accidentally loosen it back to COMPATIBILITY_MODE, which
        // lets an HTTPS page silently load active HTTP subresources -- a real security regression.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // No addJavascriptInterface() is ever registered on these content WebViews (grep-verified) --
        // there is no JS-to-Java bridge a malicious page could reach. Nor can page JS reach the
        // Capacitor chrome WebView's own origin/localStorage (where the Supabase session lives):
        // they are separate WebView instances with no shared JS context.
        // File/content access is disabled: no browsing feature needs a page to read file:// or
        // content:// URIs directly, and leaving it enabled is a known WebView local-file-disclosure
        // vector for a compromised or malicious page.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        if (tab.desktopMode) settings.setUserAgentString(DESKTOP_USER_AGENT);

        webView.setWebViewClient(new PlourxBrowserWebViewClient(this, tab.tabId));
        webView.setWebChromeClient(new PlourxBrowserChromeClient(this, tab.tabId));
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            JSObject data = new JSObject();
            data.put("tabId", tab.tabId);
            data.put("url", url);
            data.put("mimeType", mimeType != null ? mimeType : "");
            data.put("contentDisposition", contentDisposition != null ? contentDisposition : "");
            data.put("contentLength", contentLength);
            notifyListeners("downloadRequested", data);
        });

        CoordinatorLayout.LayoutParams params = new CoordinatorLayout.LayoutParams(0, 0);
        webView.setLayoutParams(params);
        webView.setVisibility(View.GONE);
        getRoot().addView(webView);
        tab.webView = webView;
        tab.crashed = false;

        if (!tab.lastUrl.isEmpty()) {
            webView.loadUrl(tab.lastUrl);
        }
    }

    @PluginMethod
    public void loadUrl(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        String url = call.getString("url");
        getActivity().runOnUiThread(() -> {
            attachWebView(tab);
            tab.lastUrl = url;
            tab.webView.loadUrl(url);
        });
        call.resolve();
    }

    @PluginMethod
    public void goBack(PluginCall call) {
        withWebView(call, WebView::goBack);
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        withWebView(call, WebView::goForward);
    }

    @PluginMethod
    public void reload(PluginCall call) {
        withWebView(call, WebView::reload);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        withWebView(call, WebView::stopLoading);
    }

    private interface WebViewAction {
        void run(WebView webView);
    }

    private void withWebView(PluginCall call, WebViewAction action) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        getActivity().runOnUiThread(() -> {
            if (tab.webView != null) action.run(tab.webView);
        });
        call.resolve();
    }

    @PluginMethod
    public void setViewportBounds(PluginCall call) {
        PlourxBrowserTab tab = findTabOrResolve(call);
        if (tab == null) return;
        double top = call.getDouble("top", 0.0);
        double left = call.getDouble("left", 0.0);
        double right = call.getDouble("right", 0.0);
        double bottom = call.getDouble("bottom", 0.0);

        getActivity().runOnUiThread(() -> {
            if (tab.webView == null) return;
            DisplayMetrics metrics = getActivity().getResources().getDisplayMetrics();
            float density = metrics.density;
            int rootWidth = getRoot().getWidth();
            int rootHeight = getRoot().getHeight();
            int topPx = (int) Math.round(top * density);
            int leftPx = (int) Math.round(left * density);
            int rightPx = (int) Math.round(right * density);
            int bottomPx = (int) Math.round(bottom * density);
            int width = Math.max(0, rootWidth - leftPx - rightPx);
            int height = Math.max(0, rootHeight - topPx - bottomPx);

            ViewGroup.LayoutParams params = tab.webView.getLayoutParams();
            params.width = width;
            params.height = height;
            tab.webView.setLayoutParams(params);
            tab.webView.setX(leftPx);
            tab.webView.setY(topPx);
        });
        call.resolve();
    }

    @PluginMethod
    public void setVisible(PluginCall call) {
        PlourxBrowserTab tab = findTabOrResolve(call);
        if (tab == null) return;
        boolean visible = call.getBoolean("visible", false);
        getActivity().runOnUiThread(() -> {
            if (tab.webView != null) tab.webView.setVisibility(visible ? View.VISIBLE : View.GONE);
            if (visible) visibleTabId = tab.tabId;
        });
        call.resolve();
    }

    @PluginMethod
    public void switchToTab(PluginCall call) {
        String tabId = call.getString("tabId");
        if (tabId == null) {
            call.reject("tabId is required");
            return;
        }
        // Lazily create the tab entry if this plugin instance has never seen
        // it -- the most common cause is Android killing the whole app
        // process while backgrounded (routine under memory pressure, not a
        // crash): JS restores its tab list from localStorage and still
        // thinks this tab exists, but a fresh plugin instance's `tabs` map
        // is empty. Rejecting here (as every other method still correctly
        // does for genuinely-unknown ids) would leave the browser on a
        // blank page with no way to recover short of closing the tab.
        // `url` is an optional hint the JS side sends for exactly this case.
        PlourxBrowserTab tab = tabs.get(tabId);
        if (tab == null) {
            tab = new PlourxBrowserTab(tabId);
            String urlHint = call.getString("url");
            if (urlHint != null) tab.lastUrl = urlHint;
            tabs.put(tabId, tab);
        }
        final PlourxBrowserTab finalTab = tab;
        getActivity().runOnUiThread(() -> {
            for (PlourxBrowserTab other : tabs.values()) {
                if (other != finalTab && other.webView != null) other.webView.setVisibility(View.GONE);
            }
            attachWebView(finalTab);
            finalTab.webView.setVisibility(View.VISIBLE);
            finalTab.lastActiveAt = System.currentTimeMillis();
            visibleTabId = finalTab.tabId;
            enforceEnginePoolLimit(finalTab.tabId);
        });
        call.resolve();
    }

    /** Suspends the least-recently-used live tabs beyond MAX_ALIVE_ENGINES, never the active one. */
    private void enforceEnginePoolLimit(String activeTabId) {
        List<PlourxBrowserTab> live = new ArrayList<>();
        for (PlourxBrowserTab tab : tabs.values()) {
            if (tab.webView != null) live.add(tab);
        }
        int excess = live.size() - MAX_ALIVE_ENGINES;
        for (int i = 0; i < live.size() && excess > 0; i++) {
            PlourxBrowserTab candidate = live.get(i);
            if (candidate.tabId.equals(activeTabId)) continue;
            suspendInternal(candidate);
            excess--;
        }
    }

    @PluginMethod
    public void closeTab(PluginCall call) {
        String tabId = call.getString("tabId");
        PlourxBrowserTab tab = tabId != null ? tabs.get(tabId) : null;
        if (tab == null) {
            call.resolve();
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (tab.webView != null) {
                tab.webView.stopLoading();
                getRoot().removeView(tab.webView);
                tab.webView.destroy();
            }
            tabs.remove(tabId);
        });
        call.resolve();
    }

    private Bitmap captureThumbnail(WebView webView) {
        if (webView.getWidth() == 0 || webView.getHeight() == 0) return null;
        Bitmap bitmap = Bitmap.createBitmap(webView.getWidth(), webView.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        webView.draw(canvas);
        return bitmap;
    }

    /** org.json.JSONObject.put(key, null) REMOVES the key instead of storing null, so nullable fields need this explicit sentinel to reach JS as `null` rather than `undefined`. */
    private void putNullable(JSObject obj, String key, String value) {
        obj.put(key, value != null ? value : JSONObject.NULL);
    }

    private String bitmapToBase64(Bitmap bitmap) {
        if (bitmap == null) return null;
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 80, stream);
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
    }

    private void suspendInternal(PlourxBrowserTab tab) {
        if (tab.webView == null) return;
        tab.thumbnail = captureThumbnail(tab.webView);
        getRoot().removeView(tab.webView);
        tab.webView.destroy();
        tab.webView = null;
    }

    @PluginMethod
    public void suspendTab(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        getActivity().runOnUiThread(() -> {
            suspendInternal(tab);
            JSObject result = new JSObject();
            putNullable(result, "thumbnailBase64", bitmapToBase64(tab.thumbnail));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void resumeTab(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        String url = call.getString("url", tab.lastUrl);
        getActivity().runOnUiThread(() -> {
            attachWebView(tab);
            tab.lastUrl = url;
            tab.webView.loadUrl(url);
            call.resolve();
        });
    }

    @PluginMethod
    public void getTabSnapshot(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        getActivity().runOnUiThread(() -> {
            Bitmap bitmap = tab.webView != null ? captureThumbnail(tab.webView) : tab.thumbnail;
            JSObject result = new JSObject();
            putNullable(result, "thumbnailBase64", bitmapToBase64(bitmap));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void evaluateJavascript(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        String script = call.getString("script", "");
        getActivity().runOnUiThread(() -> {
            if (tab.webView == null) {
                JSObject empty = new JSObject();
                putNullable(empty, "result", null);
                call.resolve(empty);
                return;
            }
            tab.webView.evaluateJavascript(script, value -> {
                JSObject result = new JSObject();
                putNullable(result, "result", value);
                call.resolve(result);
            });
        });
    }

    @PluginMethod
    public void openInSystemBrowser(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("url is required");
            return;
        }
        openExternalIntent(Uri.parse(url));
        call.resolve();
    }

    @PluginMethod
    public void shareUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("url is required");
            return;
        }
        String title = call.getString("title", "");
        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType("text/plain");
        sendIntent.putExtra(Intent.EXTRA_TEXT, url);
        if (!title.isEmpty()) sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
        Intent chooser = Intent.createChooser(sendIntent, null);
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(chooser);
        call.resolve();
    }

    /**
     * "Desktop site" is implemented the only way a stock WebView actually
     * supports: swapping the User-Agent string sites use to decide which
     * layout to serve, then reloading. It does NOT change the WebView's
     * rendering engine, viewport metrics beyond what a page's own responsive
     * CSS reacts to, or touch/pointer emulation -- a page that gates its
     * desktop layout on window width rather than UA sniffing may not change
     * at all. This is the same real-world caveat every mobile-WebView-based
     * browser has, not a shortcut specific to this app.
     */
    @PluginMethod
    public void setDesktopMode(PluginCall call) {
        PlourxBrowserTab tab = requireTab(call);
        if (tab == null) return;
        boolean desktop = call.getBoolean("desktop", false);
        getActivity().runOnUiThread(() -> {
            tab.desktopMode = desktop;
            if (tab.webView != null) {
                WebSettings settings = tab.webView.getSettings();
                if (desktop) {
                    settings.setUserAgentString(DESKTOP_USER_AGENT);
                } else {
                    settings.setUserAgentString(null); // null restores the WebView's real default UA
                }
                tab.webView.reload();
            }
        });
        call.resolve();
    }

    /**
     * notifyListeners is protected on com.getcapacitor.Plugin -- accessible
     * from within this subclass's own code, but NOT from the WebViewClient/
     * WebChromeClient helper classes even though they live in this same
     * package (protected access follows the ACCESSING class's relationship
     * to the declaring class, not its package-mates). This plain wrapper is
     * what those classes call instead.
     */
    void emit(String eventName, JSObject data) {
        notifyListeners(eventName, data);
    }

    /** Used both by the explicit "open in system browser" download fallback and by shouldOverrideUrlLoading for non-web schemes. */
    void openExternalIntent(Uri uri) {
        try {
            getActivity().startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            // No app on the device can handle this URI -- nothing more we can do.
        }
    }

    void setTabLastUrl(String tabId, String url) {
        PlourxBrowserTab tab = tabs.get(tabId);
        if (tab != null && url != null) tab.lastUrl = url;
    }

    void markTabCrashed(String tabId) {
        PlourxBrowserTab tab = tabs.get(tabId);
        if (tab == null) return;
        getActivity().runOnUiThread(() -> {
            if (tab.webView != null) {
                getRoot().removeView(tab.webView);
                tab.webView.destroy();
                tab.webView = null;
            }
            tab.crashed = true;
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            notifyListeners("tabCrashed", data);
        });
    }

    /** Called from MainActivity.onTrimMemory to proactively free background tab engines under memory pressure. */
    void trimMemory() {
        getActivity().runOnUiThread(() -> {
            for (PlourxBrowserTab tab : new ArrayList<>(tabs.values())) {
                if (!tab.tabId.equals(visibleTabId)) suspendInternal(tab);
            }
        });
    }
}
