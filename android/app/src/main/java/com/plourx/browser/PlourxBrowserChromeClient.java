package com.plourx.browser;

import android.graphics.Bitmap;
import android.os.Message;
import android.util.Base64;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.io.ByteArrayOutputStream;

/** Bridges progress/title/favicon/new-window/permission callbacks for one tab's WebView back to JS. */
class PlourxBrowserChromeClient extends WebChromeClient {
    private final PlourxBrowserEnginePlugin plugin;
    private final String tabId;

    PlourxBrowserChromeClient(PlourxBrowserEnginePlugin plugin, String tabId) {
        this.plugin = plugin;
        this.tabId = tabId;
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("progress", newProgress);
        plugin.emit("progressChanged", data);
    }

    @Override
    public void onReceivedTitle(WebView view, String title) {
        super.onReceivedTitle(view, title);
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("title", title != null ? title : "");
        plugin.emit("titleChanged", data);
    }

    @Override
    public void onReceivedIcon(WebView view, Bitmap icon) {
        super.onReceivedIcon(view, icon);
        if (icon == null) return;
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        icon.compress(Bitmap.CompressFormat.PNG, 90, stream);
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("faviconBase64Png", Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP));
        plugin.emit("faviconChanged", data);
    }

    /**
     * Handles target="_blank"/window.open. A WebView doesn't expose the
     * target URL directly here -- the standard technique is to attach a
     * throwaway transport WebView, read the URL from its first navigation
     * attempt, then let JS decide (new tab vs. current tab) via the
     * newWindowRequested event instead of ever actually showing this
     * transport view.
     */
    @Override
    public boolean onCreateWindow(final WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
        final WebView transport = new WebView(view.getContext());
        transport.setWebViewClient(
            new android.webkit.WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView child, String url) {
                    JSObject data = new JSObject();
                    data.put("tabId", tabId);
                    data.put("url", url);
                    plugin.emit("newWindowRequested", data);
                    transport.destroy();
                    return true;
                }
            }
        );
        WebView.WebViewTransport t = (WebView.WebViewTransport) resultMsg.obj;
        t.setWebView(transport);
        resultMsg.sendToTarget();
        return true;
    }

    /**
     * Site permissions (camera/mic/etc.) aren't supported yet -- deny by
     * default so a page's getUserMedia() promise rejects cleanly instead of
     * hanging forever, and still tell JS so it can inform the user rather
     * than leaving the request silently unanswered.
     */
    @Override
    public void onPermissionRequest(PermissionRequest request) {
        request.deny();
        JSArray resources = new JSArray();
        for (String resource : request.getResources()) {
            resources.put(resource);
        }
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("resources", resources);
        plugin.emit("permissionRequested", data);
    }
}
