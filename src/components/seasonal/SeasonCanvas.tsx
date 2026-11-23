import { useEffect, useRef } from 'react';
import type { Layered, SceneOpts } from './engine/scenes';
import { INTENSITY_FACTOR, type Intensity } from '../../design/seasons';
import styles from './SeasonalLayer.module.css';

export type SceneBuilder = (w: number, h: number, o: SceneOpts) => Layered;

interface SeasonCanvasProps {
  /** Changes whenever the scene should be rebuilt (season id, festival id…). */
  sceneKey: string;
  build: SceneBuilder;
  /** Festival canvases stack above the seasonal ones so both can run together. */
  tier?: 'season' | 'festival';
  intensity: Intensity;
  speed: number;
  /** Fill the positioned parent (admin previews) instead of the viewport. */
  contained?: boolean;
}

const MAX_DT = 0.05;
/** Soft atmosphere (clouds, fog, rays) is rendered at half resolution and half frame-rate, then upscaled by the browser. */
const BACK_SCALE = 0.5;

/**
 * One Canvas 2D renderer per visible season. Time-based (smooth at any refresh rate), pauses when the tab/app is
 * hidden or the canvas is scrolled off-screen, and trims particles automatically if frames get expensive.
 */
export default function SeasonCanvas({ sceneKey, build, tier = 'season', intensity, speed, contained = false }: SeasonCanvasProps) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const backCanvas = backRef.current;
    const canvas = frontRef.current;
    const backCtx = backCanvas?.getContext('2d', { alpha: true });
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!backCanvas || !canvas || !backCtx || !ctx) return;

    const small = window.matchMedia('(max-width: 640px)').matches || contained;
    const maxDpr = small ? 1.5 : 2;
    const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

    let w = 0;
    let h = 0;
    let dpr = 1;
    let builtW = 0;
    let builtH = 0;
    let scene: Layered | null = null;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let quality = 1;
    let costEma = 0;
    let frameNo = 0;
    let backDt = 0;
    let visible = true;
    let light = isLight();
    let tile = false;

    const measure = () => {
      let scale = 1;
      if (contained) {
        // Previews are a miniature of the REAL page: the scene is built at this device's actual screen size (so sprite
        // sizes, counts and layout match what visitors see) and the whole frame is scaled down to fit the preview box.
        const box = canvas.parentElement?.getBoundingClientRect();
        const refW = Math.min(1600, Math.max(360, window.innerWidth));
        const vh = Math.min(1000, Math.max(400, window.innerHeight));
        // Real width (so sprite sizes match), but the box's own shape where the screen's height allows, so big previews have no empty margins.
        const refH = box && box.width > 0 ? Math.round(Math.min(vh, Math.max(200, (refW * box.height) / box.width))) : vh;
        scale = box && box.width > 0 && box.height > 0 ? Math.min(box.width / refW, box.height / refH) : 0.3;
        w = refW;
        h = refH;
        tile = !!box && box.width < 420;
        for (const c of [canvas, backCanvas]) {
          c.style.inset = 'auto';
          c.style.left = '50%';
          c.style.top = '50%';
          c.style.transform = 'translate(-50%, -50%)';
          c.style.width = `${refW * scale}px`;
          c.style.height = `${refH * scale}px`;
        }
      } else {
        const rect = canvas.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width));
        h = Math.max(1, Math.round(rect.height));
      }
      // Effective pixels-per-logical-unit: device pixel ratio, times the preview scale-down when contained.
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * scale;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      backCanvas.width = Math.max(1, Math.round(w * dpr * BACK_SCALE));
      backCanvas.height = Math.max(1, Math.round(h * dpr * BACK_SCALE));
    };

    const rebuild = () => {
      scene = build(w, h, { count: INTENSITY_FACTOR[intensity] * (small ? 0.7 : 1) * (tile ? 0.6 : 1), light });
      scene.back.setQuality(quality);
      scene.front.setQuality(quality);
      builtW = w;
      builtH = h;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!scene) return;
      const dt = Math.min(MAX_DT, (now - last) / 1000);
      last = now;
      clock += dt * speed;
      const t0 = performance.now();
      backDt += dt * speed;
      if (++frameNo % 2 === 0) {
        const bs = dpr * BACK_SCALE;
        backCtx.setTransform(bs, 0, 0, bs, 0, 0);
        backCtx.clearRect(0, 0, w, h);
        scene.back.draw(backCtx, w, h, bs, backDt, clock);
        backDt = 0;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      scene.front.draw(ctx, w, h, dpr, dt * speed, clock);
      // Adaptive quality: if drawing eats >9ms on average, shed particles; recover when there is headroom.
      costEma = costEma * 0.92 + (performance.now() - t0) * 0.08;
      if (costEma > 9 && quality > 0.35) { quality = Math.max(0.35, quality - 0.05); scene.back.setQuality(quality); scene.front.setQuality(quality); }
      else if (costEma < 4 && quality < 1) { quality = Math.min(1, quality + 0.01); scene.back.setQuality(quality); scene.front.setQuality(quality); }
    };

    const play = () => {
      cancelAnimationFrame(raf);
      if (document.hidden || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      measure();
      // Rebuild only on a real size change — mobile URL-bar show/hide resizes must not respawn every particle.
      if (Math.abs(w - builtW) > builtW * 0.2 || Math.abs(h - builtH) > builtH * 0.35) rebuild();
    };

    measure();
    rebuild();
    play();

    const ro = new ResizeObserver(onResize);
    // Previews follow their box; the real layer follows the viewport-sized canvas.
    ro.observe(contained && canvas.parentElement ? canvas.parentElement : canvas);
    const onVisibility = () => play();
    document.addEventListener('visibilitychange', onVisibility);

    // Light/dark switch → rebuild with the matching palette.
    const mo = new MutationObserver(() => {
      const next = isLight();
      if (next !== light) { light = next; rebuild(); }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Previews far down the page shouldn't burn frames.
    let io: IntersectionObserver | null = null;
    if (contained && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        play();
      });
      io.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    }, [sceneKey, build, intensity, speed, contained]);

  return (
    <>
      <canvas ref={backRef} className={contained ? styles.canvasContained : tier === 'festival' ? styles.festivalBack : styles.canvasBack} aria-hidden="true" />
      <canvas ref={frontRef} className={contained ? styles.canvasContained : tier === 'festival' ? styles.festivalFront : styles.canvasFixed} aria-hidden="true" />
    </>
  );
}
