import type { SeasonId } from '../../../design/seasons';
import {
  blossom, cloud, crystal, fogBank, glint, mapleLeaf, oakLeaf, ovateLeaf, petal, rng, soft, sunRays,
  type Sprite,
} from './sprites';

export interface SceneOpts {
  /** Particle-count multiplier from the admin intensity setting. */
  count: number;
  /** Light theme: use darker/saturated tints so effects stay visible on pale pages. */
  light: boolean;
}

export interface Scene {
  /** ctx already has a dpr base transform on entry; w/h are CSS pixels. `t` is the scene clock in seconds. */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, dt: number, t: number): void;
  /** 0.3–1: the adaptive-quality governor trims active particles without rebuilding. */
  setQuality(q: number): void;
}

export const TAU = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth, gusty wind in roughly [-1, 2.2] — shared by every season so the whole scene breathes together. */
export function wind(t: number): number {
  const gust = Math.pow(Math.max(0, Math.sin(t * 0.13 + 2)), 6) * 1.2;
  return 0.3 + Math.sin(t * 0.23) * 0.55 + Math.sin(t * 0.61 + 1.7) * 0.3 + Math.sin(t * 0.07 + 4) * 0.35 + gust;
}

export function blit(ctx: CanvasRenderingContext2D, spr: Sprite, x: number, y: number, size: number, rot: number, flip: number, alpha: number, dpr: number) {
  const k = (size / spr.width) * dpr;
  const c = Math.cos(rot) * k;
  const s = Math.sin(rot) * k;
  ctx.setTransform(c, s, -s * flip, c * flip, x * dpr, y * dpr);
  ctx.globalAlpha = alpha;
  ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
}

export function reset(ctx: CanvasRenderingContext2D, dpr: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function compose(...scenes: Scene[]): Scene {
  return {
    draw(ctx, w, h, dpr, dt, t) {
      for (const s of scenes) {
        s.draw(ctx, w, h, dpr, dt, t);
        reset(ctx, dpr);
      }
    },
    setQuality(q) {
      for (const s of scenes) s.setQuality(q);
    },
  };
}

/** Atmosphere (clouds, fog, rays, vignette) is drawn behind the page; particles in front of it. */
export interface Layered { back: Scene; front: Scene }
export function layered(back: Scene[], front: Scene[]): Layered {
  return { back: compose(...back), front: compose(...front) };
}

/* ======================================================================
   Generic three-depth falling scene (petals, leaves, snow)
   ====================================================================== */

export interface FallCfg {
  sprites: [Sprite[], Sprite[], Sprite[]];
  counts: [number, number, number];
  size: [[number, number], [number, number], [number, number]];
  vy: [[number, number], [number, number], [number, number]];
  alpha: [number, number, number];
  windGain: number;
  sway: number;
  swayFreq: [number, number];
  rot: number;
  tumble: boolean;
}

interface P {
  x: number; y: number; vy: number; size: number; rot: number; vr: number;
  ph: number; vph: number; spr: Sprite; a: number;
}

const DEPTH_SPEED = [0.6, 1, 1.35];

export function falling(cfg: FallCfg, w: number, h: number, o: SceneOpts, seed: number): Scene {
  const r = rng(seed);
  let q = 1;
  const make = (d: number, anywhere: boolean): P => {
    const pool = cfg.sprites[d];
    const size = lerp(cfg.size[d][0], cfg.size[d][1], r());
    return {
      x: r() * (w + 160) - 80,
      y: anywhere ? r() * (h + 80) - 40 : -size - r() * 120,
      vy: lerp(cfg.vy[d][0], cfg.vy[d][1], r()),
      size,
      rot: r() * TAU,
      vr: (r() - 0.5) * 2 * cfg.rot,
      ph: r() * TAU,
      vph: lerp(cfg.swayFreq[0], cfg.swayFreq[1], r()),
      spr: pool[Math.floor(r() * pool.length)],
      a: cfg.alpha[d] * lerp(0.85, 1, r()),
    };
  };
  const layers: P[][] = [0, 1, 2].map((d) =>
    cfg.sprites[d].length ? Array.from({ length: Math.round(cfg.counts[d] * o.count) }, () => make(d, true)) : [],
  );

  return {
    setQuality(v) { q = v; },
    draw(ctx, cw, ch, dpr, dt, t) {
      const wv = wind(t);
      for (let d = 0; d < 3; d++) {
        const arr = layers[d];
        const n = Math.floor(arr.length * q);
        const ds = DEPTH_SPEED[d];
        for (let i = 0; i < n; i++) {
          const p = arr[i];
          p.ph += p.vph * dt;
          p.x += (wv * cfg.windGain * ds + Math.sin(p.ph) * cfg.sway * ds) * dt;
          p.y += p.vy * dt;
          p.rot += (p.vr + wv * 0.25) * dt;
          if (p.y > ch + p.size) { arr[i] = make(d, false); arr[i].x = r() * (cw + 160) - 80; continue; }
          if (p.x > cw + p.size * 2) p.x = -p.size * 2;
          else if (p.x < -p.size * 2) p.x = cw + p.size * 2;
          const flip = cfg.tumble ? 0.3 + 0.7 * Math.abs(Math.cos(p.ph * 0.8)) : 1;
          blit(ctx, p.spr, p.x, p.y, p.size, p.rot, flip, p.a, dpr);
        }
      }
    },
  };
}

/* ======================================================================
   SPRING — cherry blossom
   ====================================================================== */

function spring(w: number, h: number, o: SceneOpts): Layered {
  const petals = [
    petal('#ffe3ee', '#ffb3cf'), petal('#fff2f7', '#ffc6da'), petal('#ffd0e1', '#ff97bd'),
    petal('#ffffff', '#ffd2e2'), petal('#ffc2d8', '#f58cb4'),
  ];
  const blossoms = [blossom('#ffc9dc', '#fff4f8'), blossom('#ffb6d0', '#ffe9f1')];
  const green = [ovateLeaf('#c6ecb8', '#7cc47f', '#3f7d45'), ovateLeaf('#d9f2c4', '#93cf88', '#4a8a50')];
  const fall = falling({
    sprites: [[...petals, ...green], [...petals, ...blossoms], [...petals, ...blossoms]],
    counts: [26, 26, 12],
    size: [[14, 22], [26, 40], [46, 68]],
    vy: [[26, 48], [44, 78], [70, 112]],
    alpha: [0.6, 0.92, 1],
    windGain: 80, sway: 30, swayFreq: [0.8, 2], rot: 2.4, tumble: true,
  }, w, h, o, 21);
  // No background glow shapes: the pink tint comes from the page wash, and the canvas draws only petals, blossoms and leaves.
  return layered([], [fall]);
}

/* ======================================================================
   SUMMER — sun rays, heat shimmer, reflections
   ====================================================================== */

function summer(_w: number, _h: number, o: SceneOpts): Layered {
  const rays1 = sunRays(3, 'rgba(255,226,140,0.6)');
  const rays2 = sunRays(9, 'rgba(255,196,100,0.5)');
  const glow = soft('rgba(255,240,180,1)', 'rgba(255,200,80,0)', 128);
  const flareA = soft('rgba(255,215,140,0.55)', 'rgba(255,215,140,0)', 64);
  const flareB = soft('rgba(160,215,255,0.45)', 'rgba(160,215,255,0)', 64);
  const flareC = soft('rgba(255,170,130,0.45)', 'rgba(255,170,130,0)', 64);
  const bokehSpr = soft('rgba(255,236,170,0.5)', 'rgba(255,236,170,0)', 64);
  const mote = soft('rgba(255,244,200,0.95)', 'rgba(255,220,120,0)', 32);
  const r = rng(5);
  const bokeh = Array.from({ length: Math.round(14 * o.count) }, () => ({ x: r(), y: r(), s: 24 + r() * 70, ph: r() * TAU, v: 0.004 + r() * 0.01 }));
  const motes = Array.from({ length: Math.round(34 * o.count) }, () => ({ x: r(), y: r(), s: 3 + r() * 6, ph: r() * TAU, v: 6 + r() * 16 }));
  let q = 1;
  const k = o.light ? 0.6 : 1;

  const back: Scene = {
    setQuality(v) { q = v; },
    draw(ctx, cw, ch, dpr, _dt, t) {
      const sx = cw * (cw < 640 ? 0.78 : 0.84);
      const sy = ch * 0.06;
      const big = Math.max(cw, ch);
      ctx.globalCompositeOperation = 'lighter';

      blit(ctx, rays1, sx, sy, big * 1.9, t * 0.035, 1, (0.62 + 0.16 * Math.sin(t * 0.6)) * k, dpr);
      blit(ctx, rays2, sx, sy, big * 1.5, -t * 0.024, 1, (0.5 + 0.16 * Math.sin(t * 0.45 + 2)) * k, dpr);
      blit(ctx, glow, sx, sy, Math.min(cw, ch) * 0.75 * (1 + 0.04 * Math.sin(t * 0.8)), 0, 1, 0.9 * k, dpr);

      // lens-flare ghosts slide along the sun → centre axis as the light shifts
      const cx = cw / 2;
      const cy = ch / 2;
      const shift = Math.sin(t * 0.22) * 0.05;
      const ghosts: Array<[Sprite, number, number]> = [[flareA, 0.28, 90], [flareB, 0.46, 60], [flareC, 0.62, 130], [flareA, 0.84, 50], [flareB, 1.08, 110]];
      for (const [spr, f, size] of ghosts) {
        const x = lerp(sx, cx, f + shift);
        const y = lerp(sy, cy, f + shift);
        blit(ctx, spr, x, y, size * (big / 1200 + 0.5), 0, 1, (0.5 + 0.2 * Math.sin(t * 0.7 + f * 9)) * k, dpr);
      }

      // drifting light reflections (soft bokeh)
      const nb = Math.floor(bokeh.length * q);
      for (let i = 0; i < nb; i++) {
        const b = bokeh[i];
        const x = ((b.x + t * b.v) % 1) * cw;
        const y = (b.y + Math.sin(t * 0.15 + b.ph) * 0.03) * ch;
        blit(ctx, bokehSpr, x, y, b.s, 0, 1, (0.35 + 0.35 * Math.sin(t * 0.8 + b.ph)) * k, dpr);
      }

      reset(ctx, dpr);
      // heat shimmer: layered wavy bands that ripple upward from the ground
      ctx.globalCompositeOperation = o.light ? 'source-over' : 'lighter';
      const step = 14;
      const bands = 8;
      for (let b = 0; b < bands; b++) {
        const base = ch * (0.6 + 0.045 * b);
        const amp = 3 + b * 1.6;
        const thick = 14 + b * 3;
        ctx.beginPath();
        for (let x = 0; x <= cw + step; x += step) {
          const y = base + Math.sin(x * 0.011 + t * (1.0 + b * 0.08) + b * 1.7) * amp + Math.sin(x * 0.029 - t * 0.7 + b) * (amp * 0.45);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = cw + step; x >= 0; x -= step) {
          const y = base + thick + Math.sin(x * 0.013 + t * 0.9 + b * 2.1) * amp * 0.8;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 232, 175, ${(0.035 + b * 0.006) * (o.light ? 1.5 : 1)})`;
        ctx.fill();
      }
      const haze = ctx.createLinearGradient(0, ch * 0.55, 0, ch);
      haze.addColorStop(0, 'rgba(255,200,110,0)');
      haze.addColorStop(1, `rgba(255,190,100,${0.16 + 0.04 * Math.sin(t * 0.5)})`);
      ctx.fillStyle = haze;
      ctx.fillRect(0, ch * 0.55, cw, ch * 0.45);
    },
  };

  // warm pollen / dust rising on thermals, in front of the page
  const front: Scene = {
    setQuality(v) { q = v; },
    draw(ctx, cw, ch, dpr, _dt, t) {
      ctx.globalCompositeOperation = 'lighter';
      const nm = Math.floor(motes.length * q);
      for (let i = 0; i < nm; i++) {
        const m = motes[i];
        const y = (((m.y * ch - t * m.v) % ch) + ch) % ch;
        const x = m.x * cw + Math.sin(t * 0.7 + m.ph) * 18 + wind(t) * 6;
        blit(ctx, mote, x, y, m.s * 1.4, 0, 1, (0.5 + 0.5 * Math.sin(t * 1.3 + m.ph)) * k, dpr);
      }
    },
  };
  return { back, front };
}

/* ======================================================================
   MONSOON — rain, dark clouds, lightning, splashes
   ====================================================================== */

interface Drop { x: number; y: number; len: number; v: number; gy: number }
interface Splash { x: number; y: number; age: number; s: number }
interface Bolt { pts: Array<[number, number]>; branch: Array<[number, number]>; born: number }

function jag(x0: number, y0: number, x1: number, y1: number, disp: number, r: () => number): Array<[number, number]> {
  let pts: Array<[number, number]> = [[x0, y0], [x1, y1]];
  let d = disp;
  for (let pass = 0; pass < 6; pass++) {
    const next: Array<[number, number]> = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      next.push([(ax + bx) / 2 + (r() - 0.5) * d, (ay + by) / 2], pts[i]);
    }
    pts = next;
    d /= 1.9;
  }
  return pts;
}

function monsoon(w: number, h: number, o: SceneOpts): Layered {
  const r = rng(31);
  let q = 1;
  const core = o.light ? '#6f7f98' : '#2b3446';
  const core2 = o.light ? '#8796ad' : '#445068';
  const clouds = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    spr: cloud(40 + i, i % 2 ? core2 : core, 'rgba(40,50,70,0)'),
    x: r() * w,
    y: -h * 0.06 + r() * h * 0.2,
    cw: w * (0.5 + r() * 0.45),
    v: 5 + r() * 14,
    a: 0.55 + r() * 0.3,
  }));
  const layerDef = [
    { n: 110, len: [10, 18], v: [720, 920], wd: 1, a: 0.4, ground: false },
    { n: 80, len: [16, 28], v: [950, 1200], wd: 1.5, a: 0.55, ground: true },
    { n: 46, len: [26, 44], v: [1250, 1650], wd: 2.3, a: 0.75, ground: true },
  ];
  const mkDrop = (L: (typeof layerDef)[number], anywhere: boolean): Drop => ({
    x: r() * (w + 200) - 60,
    y: anywhere ? r() * h : -50 - r() * 200,
    len: lerp(L.len[0], L.len[1], r()),
    v: lerp(L.v[0], L.v[1], r()),
    gy: L.ground ? h * (0.8 + r() * 0.2) : h + 40,
  });
  const drops = layerDef.map((L) => Array.from({ length: Math.round(L.n * o.count) }, () => mkDrop(L, true)));
  const splashes: Splash[] = [];
  let bolt: Bolt | null = null;
  let nextStrike = 3 + r() * 3;
  const rain = o.light ? '60,100,160' : '205,224,248';

  // dark clouds drift behind the page
  const back: Scene = {
    setQuality() {},
    draw(ctx, cw, _ch, dpr, dt, t) {
      for (const c of clouds) {
        c.x += c.v * dt * (1 + wind(t) * 0.25);
        const bw = c.cw;
        if (c.x > cw + bw / 2) c.x = -bw / 2;
        blit(ctx, c.spr, c.x, c.y + bw / 4, bw, 0, 1, c.a, dpr);
      }
    },
  };

  // lightning, rain and splashes in front
  const front: Scene = {
    setQuality(v) { q = v; },
    draw(ctx, cw, ch, _dpr, dt, t) {

      // lightning: schedule, build bolt, and flicker
      if (t >= nextStrike) {
        const x0 = cw * (0.15 + r() * 0.7);
        const gy = ch * (0.5 + r() * 0.3);
        const pts = jag(x0, ch * 0.05, x0 + (r() - 0.5) * cw * 0.25, gy, cw * 0.14, r);
        const bi = Math.floor(pts.length * (0.3 + r() * 0.3));
        const [bx, by] = pts[bi];
        bolt = { pts, branch: jag(bx, by, bx + (r() < 0.5 ? -1 : 1) * cw * (0.06 + r() * 0.1), by + ch * (0.12 + r() * 0.12), cw * 0.06, r), born: t };
        nextStrike = t + 5 + r() * 8;
      }
      let flash = 0;
      if (bolt) {
        const age = t - bolt.born;
        flash = Math.max(Math.exp(-age * 7), age > 0.17 ? 0.75 * Math.exp(-(age - 0.17) * 6) : 0);
        if (age > 0.9) bolt = null;
      }
      if (bolt && flash > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(170,190,255,${flash * (o.light ? 0.14 : 0.2)})`;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineJoin = 'round';
        const draw = (pts: Array<[number, number]>, scale: number) => {
          ctx.beginPath();
          pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.strokeStyle = `rgba(150,175,255,${flash * 0.28})`;
          ctx.lineWidth = 9 * scale;
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, flash * 1.2)})`;
          ctx.lineWidth = 2.2 * scale;
          ctx.stroke();
        };
        draw(bolt.pts, 1);
        draw(bolt.branch, 0.6);
      }

      // rain, three depths
      const slant = Math.min(0.35, Math.max(0.05, 0.12 + wind(t) * 0.06));
      ctx.lineCap = 'round';
      for (let li = 0; li < 3; li++) {
        const L = layerDef[li];
        const arr = drops[li];
        const n = Math.floor(arr.length * q);
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const d = arr[i];
          d.y += d.v * dt;
          d.x += d.v * slant * dt;
          if (d.y >= d.gy) {
            if (L.ground && splashes.length < 90) splashes.push({ x: d.x, y: d.gy, age: 0, s: li === 2 ? 1.4 : 1 });
            arr[i] = mkDrop(L, false);
            continue;
          }
          if (d.x > cw + 80) d.x -= cw + 160;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - slant * d.len, d.y - d.len);
        }
        ctx.strokeStyle = `rgba(${rain},${L.a})`;
        ctx.lineWidth = L.wd;
        ctx.stroke();
      }

      // splashes: expanding ring + little droplets thrown upward
      ctx.lineWidth = 1;
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.age += dt;
        const u = s.age / 0.42;
        if (u >= 1) { splashes.splice(i, 1); continue; }
        const rx = (3 + u * 13) * s.s;
        ctx.strokeStyle = `rgba(${rain},${(1 - u) * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, rx, rx * 0.34, 0, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = `rgba(${rain},${(1 - u) * 0.7})`;
        for (let k = -2; k <= 2; k++) {
          const px = s.x + k * 3.2 * s.s * (0.4 + u);
          const py = s.y - (46 * u - 90 * u * u) * s.s * (1 - Math.abs(k) * 0.18);
          ctx.fillRect(px, py, 1.4, 1.4);
        }
      }
    },
  };
  return { back, front };
}

/* ======================================================================
   AUTUMN — tumbling leaves
   ====================================================================== */

function autumn(w: number, h: number, o: SceneOpts): Layered {
  const pal: Array<[string, string, string]> = [
    ['#f7b538', '#e07a1f', '#8a3d0c'], ['#f2d04a', '#d9a21b', '#7a5a0c'], ['#e4572e', '#a3321a', '#5a160a'],
    ['#b8651f', '#7a4220', '#40210e'], ['#e98a2b', '#c25a14', '#6e300a'], ['#d6a23a', '#9a6a1c', '#503408'],
  ];
  const leaves: Sprite[] = [];
  for (const [a, b, e] of pal) leaves.push(mapleLeaf(a, b, e), oakLeaf(a, b, e), ovateLeaf(a, b, e));
  const sun = soft('rgba(255,210,120,0.5)', 'rgba(255,210,120,0)', 128);
  return layered([
    {
      setQuality() {},
      draw(ctx, cw, ch, dpr, _dt, t) {
        ctx.globalCompositeOperation = o.light ? 'source-over' : 'lighter';
        blit(ctx, sun, cw * 0.2, ch * 0.04, Math.max(cw, ch) * 0.8, 0, 1, 0.45 + 0.1 * Math.sin(t * 0.4), dpr);
      },
    },
  ], [
    falling({
      sprites: [leaves, leaves, leaves],
      counts: [20, 22, 10],
      size: [[18, 28], [32, 48], [56, 80]],
      vy: [[34, 58], [54, 92], [84, 128]],
      alpha: [0.62, 0.95, 1],
      windGain: 100, sway: 40, swayFreq: [0.7, 1.8], rot: 2.8, tumble: true,
    }, w, h, o, 41),
  ]);
}

/* ======================================================================
   PRE-WINTER — fog, breeze, frost
   ====================================================================== */

function prewinter(w: number, h: number, o: SceneOpts): Layered {
  const r = rng(51);
  let q = 1;
  const fogColor = o.light ? 'rgba(120,140,170,0.55)' : 'rgba(228,236,248,0.6)';
  const banks = Array.from({ length: 7 }, (_, i) => ({
    spr: fogBank(60 + i, fogColor),
    x: r() * w,
    y: h * (0.3 + r() * 0.65),
    bw: w * (0.9 + r() * 0.8),
    v: 7 + r() * 22,
    a: 0.2 + r() * 0.22,
    front: false,
  }));
  const frostCol = o.light ? '#7ea6d8' : '#f2f8ff';
  const flakes = [crystal(0, frostCol, 'rgba(190,220,255,0.9)'), crystal(1, frostCol, 'rgba(190,220,255,0.9)'), soft(o.light ? 'rgba(120,160,215,0.9)' : 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)', 32)];
  const glints = glint(o.light ? 'rgba(110,150,210,1)' : 'rgba(235,246,255,1)');
  const frost = Array.from({ length: Math.round(55 * o.count) }, () => ({ x: r() * w, y: r() * h, s: 5 + r() * 9, d: 0.5 + r() * 1, ph: r() * TAU, spr: flakes[Math.floor(r() * 3)] }));
  const sparks = Array.from({ length: Math.round(22 * o.count) }, () => ({ x: r() * w, y: r() * h, s: 10 + r() * 16, ph: r() * TAU, v: 0.6 + r() * 1.2 }));
  const leafSet = [mapleLeaf('#d8742b', '#a8461a', '#5e220a'), mapleLeaf('#b5502a', '#7a2c14', '#401408'), oakLeaf('#a8742e', '#6c4520', '#3a220c')];
  const leaves = falling({
    sprites: [[], leafSet, leafSet],
    counts: [0, 5, 3],
    size: [[0, 0], [26, 38], [44, 60]],
    vy: [[0, 0], [22, 40], [34, 56]],
    alpha: [0, 0.9, 1],
    windGain: 170, sway: 24, swayFreq: [0.8, 1.6], rot: 2, tumble: true,
  }, w, h, o, 61);

  const drawBanks = (ctx: CanvasRenderingContext2D, cw: number, dpr: number, dt: number, t: number, front: boolean) => {
    for (const b of banks) {
      if (b.front !== front) continue;
      b.x += b.v * dt * (0.6 + wind(t) * 0.5);
      if (b.x > cw + b.bw / 2) b.x = -b.bw / 2;
      blit(ctx, b.spr, b.x, b.y, b.bw, 0, 1, b.a * (front ? 0.4 : 1), dpr);
    }
  };

  return layered([
    { setQuality() {}, draw(ctx, cw, _ch, dpr, dt, t) { drawBanks(ctx, cw, dpr, dt, t, false); } },
    {
      setQuality() {},
      draw(ctx, cw, ch) {
        // cold vignette at the screen edges
        const v = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.4, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
        v.addColorStop(0, 'rgba(210,228,250,0)');
        v.addColorStop(1, o.light ? 'rgba(130,165,210,0.26)' : 'rgba(210,228,250,0.22)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, cw, ch);
      },
    },
  ], [
    {
      setQuality(v) { q = v; },
      draw(ctx, cw, ch, dpr, dt, t) {
        const wv = wind(t);
        // floating frost crystals
        const nf = Math.floor(frost.length * q);
        for (let i = 0; i < nf; i++) {
          const f = frost[i];
          f.ph += dt * 0.9;
          f.x += (24 + wv * 55) * f.d * dt;
          f.y += (Math.sin(f.ph) * 9 + 5) * dt;
          if (f.x > cw + 20) f.x = -20;
          if (f.y > ch + 20) f.y = -20;
          blit(ctx, f.spr, f.x, f.y, f.s * f.d * 1.2, f.ph * 0.3, 1, 0.55 + 0.4 * Math.sin(f.ph * 1.7), dpr);
        }
        // sparkle glints
        const ng = Math.floor(sparks.length * q);
        for (let i = 0; i < ng; i++) {
          const s = sparks[i];
          const a = Math.pow(Math.max(0, Math.sin(t * s.v + s.ph)), 3);
          if (a > 0.02) blit(ctx, glints, s.x, s.y, s.s * (0.5 + a * 0.7), Math.PI / 4 * a, 1, a * 0.9, dpr);
        }
      },
    },
    leaves,
  ]);
}

/* ======================================================================
   WINTER — wind-driven snowfall
   ====================================================================== */

function winter(w: number, h: number, o: SceneOpts): Layered {
  const col = o.light ? '#82aee0' : '#ffffff';
  const glow = o.light ? 'rgba(255,255,255,0.95)' : 'rgba(170,210,255,0.95)';
  const crystals = [crystal(0, col, glow), crystal(1, col, glow), crystal(2, col, glow)];
  const dot = soft(o.light ? 'rgba(120,165,220,0.95)' : 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)', 48);
  const blurDot = soft(o.light ? 'rgba(130,170,225,0.7)' : 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)', 64);
  const snow = falling({
    sprites: [[dot], [...crystals, dot, dot], [...crystals, blurDot]],
    counts: [90, 56, 18],
    size: [[3, 7], [12, 22], [26, 46]],
    vy: [[24, 46], [44, 82], [78, 132]],
    alpha: [0.6, 0.88, 0.95],
    windGain: 60, sway: 16, swayFreq: [0.6, 1.7], rot: 0.9, tumble: false,
  }, w, h, o, 71);
  const glints = glint(o.light ? 'rgba(110,150,210,1)' : 'rgba(235,246,255,1)');
  const r = rng(72);
  const sparks = Array.from({ length: Math.round(12 * o.count) }, () => ({ x: r() * w, y: r() * h, s: 10 + r() * 14, ph: r() * TAU, v: 0.5 + r(), }));
  return layered([
    {
      setQuality() {},
      draw(ctx, cw, ch, _dpr, _dt, t) {
        // frosty atmosphere: icy edge vignette + a slow pulse of cold light
        const v = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.78);
        v.addColorStop(0, 'rgba(220,238,255,0)');
        v.addColorStop(1, o.light ? 'rgba(140,175,220,0.3)' : `rgba(220,238,255,${0.24 + 0.04 * Math.sin(t * 0.5)})`);
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, cw, ch);
      },
    },
  ], [
    snow,
    {
      setQuality() {},
      draw(ctx, _cw, _ch, dpr, _dt, t) {
        for (const s of sparks) {
          const a = Math.pow(Math.max(0, Math.sin(t * s.v + s.ph)), 4);
          if (a > 0.02) blit(ctx, glints, s.x, s.y, s.s * (0.5 + a * 0.6), 0, 1, a * 0.85, dpr);
        }
      },
    },
  ]);
}

export function createScene(season: SeasonId, w: number, h: number, o: SceneOpts): Layered {
  switch (season) {
    case 'spring': return spring(w, h, o);
    case 'summer': return summer(w, h, o);
    case 'monsoon': return monsoon(w, h, o);
    case 'autumn': return autumn(w, h, o);
    case 'prewinter': return prewinter(w, h, o);
    case 'winter': return winter(w, h, o);
  }
}
