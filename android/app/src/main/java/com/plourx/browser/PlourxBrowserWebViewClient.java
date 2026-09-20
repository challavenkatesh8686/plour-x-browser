package com.plourx.browser;

import android.graphics.Bitmap;
import android.os.Build;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import com.getcapacitor.JSObject;

/** Bridges page-load/navigation/error/crash callbacks for one tab's WebView back to JS via the plugin's notifyListeners. */
class PlourxBrowserWebViewClient extends WebViewClient {
    private final PlourxBrowserEnginePlugin plugin;
    private final String tabId;

    PlourxBrowserWebViewClient(PlourxBrowserEnginePlugin plugin, String tabId) {
        this.plugin = plugin;
        this.tabId = tabId;
    }

    private JSObject navigationState(WebView view, String url) {
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("url", url);
        data.put("title", view.getTitle() != null ? view.getTitle() : "");
        data.put("canGoBack", view.canGoBack());
        data.put("canGoForward", view.canGoForward());
        return data;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        plugin.emit("pageStarted", navigationState(view, url));
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        plugin.setTabLastUrl(tabId, url);
        plugin.emit("pageFinished", navigationState(view, url));
    }

    @RequiresApi(Build.VERSION_CODES.M)
    @Override
    public void onReceivedError(@NonNull WebView view, @NonNull WebResourceRequest request, @NonNull WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (!request.isForMainFrame()) return;
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("errorCode", error.getErrorCode());
        data.put("description", String.valueOf(error.getDescription()));
        data.put("failingUrl", request.getUrl().toString());
        plugin.emit("errorReceived", data);
    }

    @Override
    public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
        // Let the WebView handle ordinary http(s) navigation itself so its
        // own back/forward history stays correct. Only intercept schemes it
        // can't render (tel:, mailto:, intent:, market:, etc.), handing them
        // to the system instead of failing with a blank page.
        String scheme = request.getUrl().getScheme();
        if (scheme == null || scheme.equals("http") || scheme.equals("https")) {
            return false;
        }
        plugin.openExternalIntent(request.getUrl());
        return true;
    }

    @RequiresApi(Build.VERSION_CODES.O)
    @Override
    public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
        plugin.markTabCrashed(tabId);
        // Returning true tells Android we handled the dead renderer (removed the WebView) so the host app doesn't crash too.
        return true;
    }
}
