package com.plourx.browser;

import android.Manifest;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Message;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

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
     * Maps a WebView PermissionRequest resource to the real Android runtime
     * permission it needs, requests it if not already granted (showing the
     * genuine system dialog), and grants/denies the WebView request based on
     * the outcome -- replacing the previous unconditional deny.
     */
    @Override
    public void onPermissionRequest(PermissionRequest request) {
        JSArray resources = new JSArray();
        for (String resource : request.getResources()) {
            resources.put(resource);
        }
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("resources", resources);
        plugin.emit("permissionRequested", data);

        List<String> androidPermissions = new ArrayList<>();
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) androidPermissions.add(Manifest.permission.CAMERA);
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) androidPermissions.add(Manifest.permission.RECORD_AUDIO);
        }
        if (androidPermissions.isEmpty()) {
            // Unsupported resource kind (e.g. protected media id) -- nothing we can grant.
            request.deny();
            return;
        }
        plugin.requestAndroidPermissions(
            androidPermissions.toArray(new String[0]),
            granted -> {
                boolean allGranted = true;
                for (String permission : androidPermissions) {
                    if (!Boolean.TRUE.equals(granted.get(permission))) {
                        allGranted = false;
                        break;
                    }
                }
                if (allGranted) {
                    request.grant(request.getResources());
                } else {
                    request.deny();
                }
            }
        );
    }

    /** Real geolocation support: gated behind the actual Android location permission dialog, not an automatic grant. */
    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        plugin.requestAndroidPermissions(
            new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            granted -> {
                boolean allowed =
                    Boolean.TRUE.equals(granted.get(Manifest.permission.ACCESS_FINE_LOCATION)) ||
                    Boolean.TRUE.equals(granted.get(Manifest.permission.ACCESS_COARSE_LOCATION));
                callback.invoke(origin, allowed, false);
            }
        );
    }

    /** Real file chooser support for `<input type=file>` -- launches the system picker (gallery/camera/documents per the page's accept/capture attributes). */
    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
        return plugin.showFileChooser(filePathCallback, fileChooserParams);
    }
}
