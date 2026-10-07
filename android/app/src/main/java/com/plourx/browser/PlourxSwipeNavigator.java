package com.plourx.browser;

import android.annotation.SuppressLint;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.View;
import android.view.ViewConfiguration;
import android.webkit.WebView;
import android.view.animation.DecelerateInterpolator;

/**
 * Edge-swipe history navigation for a tab's WebView: drag in from the left
 * edge to go back, from the right edge to go forward. The page follows the
 * finger (with a fade), then either slides out and navigates on release past
 * the threshold / with a fling, or springs back to rest.
 *
 * Only gestures that START in the edge zone are claimed, so horizontal
 * scrolling inside page content (carousels, maps, code blocks) is untouched.
 * Uses translationX, which is independent of the setX() bounds the plugin
 * applies in setViewportBounds.
 */
final class PlourxSwipeNavigator implements View.OnTouchListener {
    private static final float EDGE_DP = 28f;
    private static final float COMMIT_FRACTION = 0.33f;
    private static final float COMMIT_VELOCITY_DP = 900f;
    private static final long ANIM_MS = 180;

    private final float edgePx;
    private final float commitVelocityPx;
    private final int touchSlop;

    /** -1 = back (drag right from left edge), +1 = forward (drag left from right edge), 0 = idle. */
    private int direction = 0;
    private boolean dragging = false;
    private boolean animating = false;
    private float downX;
    private float downY;
    private VelocityTracker velocity;

    PlourxSwipeNavigator(WebView webView) {
        float density = webView.getResources().getDisplayMetrics().density;
        edgePx = EDGE_DP * density;
        commitVelocityPx = COMMIT_VELOCITY_DP * density;
        touchSlop = ViewConfiguration.get(webView.getContext()).getScaledTouchSlop();
    }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouch(View v, MotionEvent event) {
        WebView webView = (WebView) v;
        if (animating) return true;

        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                reset();
                if (event.getX() <= edgePx && webView.canGoBack()) direction = -1;
                else if (event.getX() >= webView.getWidth() - edgePx && webView.canGoForward()) direction = 1;
                if (direction != 0) {
                    downX = event.getX();
                    downY = event.getY();
                    velocity = VelocityTracker.obtain();
                    velocity.addMovement(event);
                }
                return false;

            case MotionEvent.ACTION_MOVE: {
                if (direction == 0) return false;
                velocity.addMovement(event);
                float dx = event.getX() - downX;
                float dy = event.getY() - downY;
                if (!dragging) {
                    // Wrong way or mostly vertical: give the touch back to the page.
                    if (Math.abs(dy) > touchSlop && Math.abs(dy) > Math.abs(dx)) {
                        reset();
                        return false;
                    }
                    if (dx * -direction < touchSlop) return false; // not yet moving inward
                    dragging = true;
                    // Cancel the page's own handling so it doesn't also scroll/click.
                    MotionEvent cancel = MotionEvent.obtain(event);
                    cancel.setAction(MotionEvent.ACTION_CANCEL);
                    webView.onTouchEvent(cancel);
                    cancel.recycle();
                    webView.getParent().requestDisallowInterceptTouchEvent(true);
                }
                float travel = Math.max(0f, dx * -direction);
                float width = webView.getWidth();
                // Light rubber-band so the page never leaves the screen under the finger.
                float eased = travel > width ? width : travel;
                webView.setTranslationX(-direction * eased);
                webView.setAlpha(1f - 0.35f * (eased / width));
                return true;
            }

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL: {
                if (!dragging) {
                    reset();
                    return false;
                }
                velocity.addMovement(event);
                velocity.computeCurrentVelocity(1000);
                float vx = velocity.getXVelocity() * -direction;
                float travel = Math.abs(webView.getTranslationX());
                boolean commit = event.getActionMasked() == MotionEvent.ACTION_UP
                    && (travel > webView.getWidth() * COMMIT_FRACTION || vx > commitVelocityPx);
                finish(webView, commit);
                return true;
            }
            default:
                return dragging;
        }
    }

    private void finish(final WebView webView, boolean commit) {
        final int dir = direction;
        animating = true;
        if (commit) {
            webView.animate()
                .translationX(-dir * webView.getWidth() * 0.6f)
                .alpha(0f)
                .setDuration(ANIM_MS)
                .setInterpolator(new DecelerateInterpolator())
                .withEndAction(() -> {
                    if (dir < 0) webView.goBack();
                    else webView.goForward();
                    // New page fades up from the opposite side so it feels like a stack pop.
                    webView.setTranslationX(dir * webView.getWidth() * 0.15f);
                    webView.animate()
                        .translationX(0f)
                        .alpha(1f)
                        .setDuration(ANIM_MS)
                        .setInterpolator(new DecelerateInterpolator())
                        .withEndAction(() -> animating = false)
                        .start();
                })
                .start();
        } else {
            webView.animate()
                .translationX(0f)
                .alpha(1f)
                .setDuration(ANIM_MS)
                .setInterpolator(new DecelerateInterpolator())
                .withEndAction(() -> animating = false)
                .start();
        }
        reset();
    }

    private void reset() {
        direction = 0;
        dragging = false;
        if (velocity != null) {
            velocity.recycle();
            velocity = null;
        }
    }
}
