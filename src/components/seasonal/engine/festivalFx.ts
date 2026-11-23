/** Reusable festival effect primitives. Each returns a Scene that is composed into a festival in festivalScenes.ts. */
import { blit, reset, TAU, lerp, wind, type Layered, type Scene, type SceneOpts } from './scenes';
import { rng, type Sprite } from './sprites';
import { glow, flame as flameSprite, bat, pumpkin as pumpkinSprite, pumpkinFace, ghost as ghostSprite, spider as spiderSprite, diyaBowl } from './festivalSprites';

type Draw = Scene['draw'];
const make = (draw: Draw, setQ?: (q: number) => void): Scene => ({ draw, setQuality: setQ ?? (() => {}) });

/* ------------------------------ fireworks ------------------------------ */

export function fireworks(_w: number, h: number, o: SceneOpts, cfg: { palettes: string[]; every?: [number, number]; seed?: number }): Scene {
  const r = rng(cfg.seed ?? 7);
  interface Rocket { x: number; y: number; vx: number; vy: number; ty: number }
  interface Spark { x: number; y: number; vx: number; vy: number; age: number; life: number; rgb: string; s: number; g: number; drag: number }
  const rockets: Rocket[] = [];
  const sparks: Spark[] = [];
  const flashes: Array<{ x: number; y: number; age: number; rgb: string }> = [];
  let wait = 0.4;
  let q = 1;
  const [e0, e1] = cfg.every ?? [1.1, 2.4];
  const CAP = 560;

  const burst = (x: number, y: number) => {
    const kind = Math.floor(r() * 4);
    const rgb = cfg.palettes[Math.floor(r() * cfg.palettes.length)];
    const rgb2 = cfg.palettes[Math.floor(r() * cfg.palettes.length)];
    const base = kind === 1 ? 46 : kind === 3 ? 90 : 70;
    const n = Math.max(18, Math.round(base * o.count * q));
    const speed = (h < 500 ? 90 : 120) + r() * 110;
    flashes.push({ x, y, age: 0, rgb });
    for (let i = 0; i < n && sparks.length < CAP; i++) {
      const ang = (i / n) * TAU + (kind === 0 ? r() * 0.3 : 0);
      const two = kind === 3 && i % 2 === 0;
      const sp = kind === 1 ? speed : speed * (0.35 + r() * 0.65) * (two ? 0.55 : 1);
      sparks.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, age: 0,
        life: kind === 2 ? 2 + r() * 0.8 : 1 + r() * 0.9,
        rgb: two ? rgb2 : kind === 2 ? '255,200,90' : rgb,
        s: 7 + r() * 6, g: kind === 2 ? 70 : 110, drag: kind === 2 ? 0.5 : 0.9,
      });
    }
  };

  return make((ctx, cw, ch, dpr, dt) => {
    wait -= dt;
    if (wait <= 0 && rockets.length < 3) {
      const ty = ch * (0.16 + 0.3 * r());
      rockets.push({ x: cw * (0.12 + 0.76 * r()), y: ch + 10, vx: (r() - 0.5) * 40, vy: -(ch - ty) / 0.9, ty });
      wait = lerp(e0, e1, r()) / Math.max(0.5, o.count);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = rockets.length - 1; i >= 0; i--) {
      const k = rockets[i];
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      if (sparks.length < CAP) sparks.push({ x: k.x, y: k.y, vx: (r() - 0.5) * 16, vy: 24 + r() * 20, age: 0, life: 0.55, rgb: '255,214,150', s: 5, g: 0, drag: 0.3 });
      if (k.y <= k.ty) {
        burst(k.x, k.y);
        rockets.splice(i, 1);
        continue;
      }
      blit(ctx, glow('255,240,210'), k.x, k.y, 12, 0, 1, 1, dpr);
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.age += dt;
      if (f.age > 0.35) { flashes.splice(i, 1); continue; }
      blit(ctx, glow(f.rgb, 64), f.x, f.y, 160 * (0.5 + f.age * 2), 0, 1, (1 - f.age / 0.35) * 0.7, dpr);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age >= s.life) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
      const d = Math.pow(s.drag, dt);
      s.vx *= d;
      s.vy = s.vy * d + s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.age / s.life;
      const a = Math.pow(k, 0.8) * (0.75 + 0.25 * Math.sin(s.age * 40 + s.x));
      const g = glow(s.rgb);
      blit(ctx, g, s.x, s.y, s.s * (0.4 + 0.6 * k), 0, 1, a, dpr);
      blit(ctx, g, s.x - s.vx * 0.05, s.y - s.vy * 0.05, s.s * 0.6 * (0.4 + 0.6 * k), 0, 1, a * 0.5, dpr);
    }
  }, (v) => { q = v; });
}

/* ------------------------------ confetti / streamers ------------------------------ */

export function confetti(w: number, h: number, o: SceneOpts, cfg: { colors: string[]; ambient: number; burstEvery?: number; seed?: number }): Scene {
  const r = rng(cfg.seed ?? 13);
  interface Piece { x: number; y: number; vx: number; vy: number; rot: number; vr: number; cw: number; ch: number; ph: number; color: string; burst: boolean }
  const pick = () => cfg.colors[Math.floor(r() * cfg.colors.length)];
  const piece = (x: number, y: number, vx: number, vy: number, burst: boolean): Piece => ({
    x, y, vx, vy, rot: r() * TAU, vr: (r() - 0.5) * 9, cw: 5 + r() * 6, ch: 8 + r() * 8, ph: r() * TAU, color: pick(), burst,
  });
  const pieces: Piece[] = Array.from({ length: Math.round(cfg.ambient * o.count) }, () => piece(r() * w, r() * h, 0, 50 + r() * 50, false));
  let wait = cfg.burstEvery ? 1 + r() : Infinity;
  let q = 1;

  return make((ctx, cw, ch, dpr, dt, t) => {
    wait -= dt;
    if (wait <= 0) {
      const bx = cw * (0.15 + 0.7 * r());
      const by = ch * (0.55 + 0.3 * r());
      const n = Math.round(48 * o.count * q);
      for (let i = 0; i < n && pieces.length < 360; i++) {
        const a = -Math.PI / 2 + (r() - 0.5) * 2.4;
        const sp = 200 + r() * 360;
        pieces.push(piece(bx, by, Math.cos(a) * sp, Math.sin(a) * sp, true));
      }
      wait = (cfg.burstEvery ?? 3) * (0.7 + r() * 0.8);
    }
    const wv = wind(t);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.ph += dt * 7;
      p.rot += p.vr * dt;
      if (p.burst) {
        p.vx *= Math.pow(0.3, dt);
        p.vy += 520 * dt;
        if (p.vy > 120) p.vy = lerp(p.vy, 110, Math.min(1, dt * 4));
      }
      p.x += (p.vx + wv * 14 + Math.sin(p.ph * 0.4) * 22) * dt;
      p.y += p.vy * dt;
      if (p.y > ch + 20) {
        if (p.burst) { pieces[i] = pieces[pieces.length - 1]; pieces.pop(); continue; }
        p.y = -16;
        p.x = r() * cw;
      }
      const flip = Math.abs(Math.cos(p.ph));
      const c = Math.cos(p.rot) * dpr;
      const s = Math.sin(p.rot) * dpr;
      ctx.setTransform(c, s, -s * flip, c * flip, p.x * dpr, p.y * dpr);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.cw / 2, -p.ch / 2, p.cw, p.ch);
    }
  }, (v) => { q = v; });
}

export function streamers(w: number, h: number, o: SceneOpts, cfg: { colors: string[]; n: number; seed?: number }): Scene {
  const r = rng(cfg.seed ?? 21);
  const items = Array.from({ length: Math.round(cfg.n * Math.max(0.6, o.count)) }, (_, i) => ({
    x: ((i + 0.5) / Math.round(cfg.n * Math.max(0.6, o.count))) * w + (r() - 0.5) * 30,
    len: h * (0.12 + 0.2 * r()), wd: 5 + r() * 4, ph: r() * TAU, color: cfg.colors[Math.floor(r() * cfg.colors.length)],
  }));
  return make((ctx, _cw, _ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const wv = wind(t);
    for (const s of items) {
      ctx.beginPath();
      for (let y = -4; y <= s.len; y += 10) {
        const x = s.x + Math.sin(y * 0.045 - t * 2 + s.ph) * (6 + y * 0.06) + wv * y * 0.12;
        if (y === -4) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = s.wd;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

/* ------------------------------ fire & light ------------------------------ */

export function embers(w: number, h: number, o: SceneOpts, cfg: { n: number; rgb: string; speed?: [number, number]; size?: [number, number]; seed?: number }): Scene {
  const r = rng(cfg.seed ?? 31);
  const sp = cfg.speed ?? [30, 90];
  const sz = cfg.size ?? [6, 16];
  const items = Array.from({ length: Math.round(cfg.n * o.count) }, () => ({
    x: r() * w, y: r() * h, v: lerp(sp[0], sp[1], r()), s: lerp(sz[0], sz[1], r()), ph: r() * TAU, f: 1 + r() * 3,
  }));
  let q = 1;
  return make((ctx, cw, ch, dpr, dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    const wv = wind(t);
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const e = items[i];
      e.y -= e.v * dt;
      e.x += (Math.sin(t * e.f + e.ph) * 22 + wv * 18) * dt;
      if (e.y < -20) { e.y = ch + 10; e.x = r() * cw; }
      const fade = Math.min(1, e.y / (ch * 0.25) + 0.15);
      blit(ctx, glow(cfg.rgb), e.x, e.y, e.s * (0.7 + 0.3 * Math.sin(t * 9 + e.ph)), 0, 1, fade * 0.95, dpr);
    }
  }, (v) => { q = v; });
}

export function smoke(w: number, _h: number, o: SceneOpts, cfg: { n: number; rgb: string }): Scene {
  const r = rng(41);
  const items = Array.from({ length: Math.round(cfg.n * Math.max(0.6, o.count)) }, () => ({ x: r() * w, age: r() * 14, life: 12 + r() * 6, s: 120 + r() * 120 }));
  return make((ctx, cw, ch, dpr, dt) => {
    for (const s of items) {
      s.age += dt;
      if (s.age > s.life) { s.age = 0; s.x = r() * cw; }
      const u = s.age / s.life;
      blit(ctx, glow(cfg.rgb, 64), s.x + u * 60, ch * (1 - u * 0.75), s.s * (0.6 + u), 0, 1, Math.sin(u * Math.PI) * 0.16, dpr);
    }
  });
}

/** Drifting soft clouds of colour (Holi haze, etc.). */
export function colorHaze(w: number, h: number, _o: SceneOpts, cfg: { colors: string[]; alpha?: number }): Scene {
  const r = rng(51);
  const items = cfg.colors.map((rgb, i) => ({ rgb, x: r() * w, y: h * (0.2 + 0.6 * r()), s: Math.max(w, h) * (0.5 + 0.4 * r()), v: 6 + r() * 10, ph: i * 1.7 }));
  return make((ctx, cw, ch, dpr, dt, t) => {
    for (const p of items) {
      p.x += p.v * dt;
      if (p.x > cw + p.s) p.x = -p.s;
      blit(ctx, glow(p.rgb, 96), p.x, p.y + Math.sin(t * 0.3 + p.ph) * 30, p.s, 0, 1, (cfg.alpha ?? 0.22) * (0.8 + 0.2 * Math.sin(t * 0.5 + p.ph)), dpr);
    }
    void ch;
  });
}

export function powder(_w: number, _h: number, o: SceneOpts, cfg: { colors: string[] }): Scene {
  const r = rng(61);
  interface Puff { x: number; y: number; vx: number; vy: number; s0: number; age: number; life: number; rgb: string }
  const puffs: Puff[] = [];
  let wait = 0.3;
  let q = 1;
  return make((ctx, cw, ch, dpr, dt) => {
    wait -= dt;
    if (wait <= 0) {
      const fromSide = r() < 0.4;
      const ox = fromSide ? (r() < 0.5 ? cw * 0.05 : cw * 0.95) : cw * (0.15 + 0.7 * r());
      const oy = ch * (fromSide ? 0.4 + 0.3 * r() : 0.55 + 0.35 * r());
      const rgb = cfg.colors[Math.floor(r() * cfg.colors.length)];
      const rgb2 = cfg.colors[Math.floor(r() * cfg.colors.length)];
      const n = Math.round(34 * o.count * q);
      for (let i = 0; i < n && puffs.length < 280; i++) {
        const a = r() * TAU;
        const sp = 90 + r() * 330;
        const grain = r() < 0.5;
        puffs.push({ x: ox, y: oy, vx: Math.cos(a) * sp * (grain ? 1.5 : 1), vy: Math.sin(a) * sp * (grain ? 1.5 : 1) - 40, s0: grain ? 9 + r() * 9 : 40 + r() * 50, age: 0, life: grain ? 1.5 + r() * 0.8 : 2.2 + r() * 1.2, rgb: r() < 0.7 ? rgb : rgb2 });
      }
      wait = (0.9 + r() * 0.9) / Math.max(0.6, o.count);
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age >= p.life) { puffs[i] = puffs[puffs.length - 1]; puffs.pop(); continue; }
      const d = Math.pow(0.1, dt);
      p.vx *= d;
      p.vy = p.vy * d - 6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const u = p.age / p.life;
      blit(ctx, glow(p.rgb, 96), p.x, p.y, p.s0 + p.age * (p.s0 < 20 ? 8 : 55), 0, 1, (p.s0 < 20 ? 0.95 : 0.5) * Math.pow(1 - u, 1.4) * Math.min(1, p.age * 8), dpr);
    }
  }, (v) => { q = v; });
}

export function flames(_w: number, _h: number, o: SceneOpts, cfg: { n: number; size: number; baseRgb?: string }): Layered {
  const r = rng(71);
  const spr = flameSprite();
  const n = Math.max(1, Math.round(cfg.n * Math.max(0.7, o.count)));
  const items = Array.from({ length: n }, (_, i) => ({ x01: (i + 0.5) / n + (r() - 0.5) * 0.04, s: cfg.size * (0.7 + 0.6 * r()), ph: r() * TAU }));
  const back = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const f of items) {
      const fl = 0.85 + 0.15 * Math.sin(t * 11 + f.ph);
      blit(ctx, glow(cfg.baseRgb ?? '255,120,30', 64), f.x01 * cw, ch, f.s * 3.4, 0, 1, 0.5 * fl, dpr);
    }
  });
  const front = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const f of items) {
      const fl = 0.85 + 0.15 * Math.sin(t * 11 + f.ph) + 0.08 * Math.sin(t * 23 + f.ph * 2);
      for (const [k, a] of [[1, 0.9], [0.72, 0.9], [0.5, 1]] as const) {
        blit(ctx, spr, f.x01 * cw + Math.sin(t * 5 + f.ph + k * 3) * f.s * 0.07, ch - f.s * 0.42 * k, f.s * 0.55 * k * fl * 1.4, Math.sin(t * 6 + f.ph + k) * 0.08, 1, a, dpr);
      }
    }
  });
  return { back, front };
}

export function diyaRow(w: number, _h: number, o: SceneOpts, cfg: { n: number }): Layered {
  const bowl = diyaBowl();
  const spr = flameSprite();
  const r = rng(81);
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.7, o.count)));
  const size = Math.min(78, Math.max(46, w / (n + 2)));
  const items = Array.from({ length: n }, (_, i) => ({ x01: (i + 0.5) / n, ph: r() * TAU, dy: (r() - 0.5) * 8 }));
  const back = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const d of items) {
      const fl = 0.85 + 0.15 * Math.sin(t * 10 + d.ph) + 0.1 * Math.sin(t * 19 + d.ph);
      blit(ctx, glow('255,170,60', 64), d.x01 * cw, ch - size * 0.72 + d.dy, size * 3.2 * fl, 0, 1, 0.55, dpr);
    }
  });
  const front = make((ctx, cw, ch, dpr, _dt, t) => {
    for (const d of items) {
      const x = d.x01 * cw;
      const y = ch - size * 0.42 + d.dy;
      const fl = 0.85 + 0.15 * Math.sin(t * 10 + d.ph) + 0.1 * Math.sin(t * 19 + d.ph);
      ctx.globalCompositeOperation = 'source-over';
      blit(ctx, bowl, x, y, size, 0, 1, 1, dpr);
      ctx.globalCompositeOperation = 'lighter';
      blit(ctx, spr, x, y - size * 0.34, size * 0.42 * fl, Math.sin(t * 6 + d.ph) * 0.07, 1, 1, dpr);
    }
  });
  return { back, front };
}

/** Little flames drifting up (Día de los Muertos candles). Position is a pure function of time. */
export function candles(_w: number, _h: number, o: SceneOpts, cfg: { n: number }): Layered {
  const r = rng(91);
  const spr = flameSprite();
  const items = Array.from({ length: Math.round(cfg.n * o.count) }, () => ({ x01: r(), y01: r(), v: 10 + r() * 20, s: 18 + r() * 20, ph: r() * TAU }));
  let q = 1;
  const at = (c: (typeof items)[number], ch: number, cw: number, t: number) => {
    const per = ch + 60;
    const y = ((((c.y01 * per - c.v * t) % per) + per) % per) - 30;
    return { x: c.x01 * cw + Math.sin(t * 0.8 + c.ph) * 14, y, fade: Math.min(1, Math.max(0, y) / (ch * 0.3)) };
  };
  const back = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const c = items[i];
      const p = at(c, ch, cw, t);
      blit(ctx, glow('255,150,50', 64), p.x, p.y, c.s * 3, 0, 1, 0.4 * p.fade, dpr);
    }
  }, (v) => { q = v; });
  const front = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const c = items[i];
      const p = at(c, ch, cw, t);
      blit(ctx, spr, p.x, p.y, c.s * (0.85 + 0.15 * Math.sin(t * 9 + c.ph)), Math.sin(t * 5 + c.ph) * 0.1, 1, p.fade, dpr);
    }
  }, (v) => { q = v; });
  return { back, front };
}

/* ------------------------------ hanging things ------------------------------ */

export function hanging(w: number, _h: number, o: SceneOpts, cfg: {
  sprites: Sprite[]; n: number; len: [number, number]; size: [number, number]; glowRgb?: string; seed?: number; stringColor?: string; swing?: number;
}): Layered {
  const r = rng(cfg.seed ?? 101);
  const n = Math.max(2, Math.round(cfg.n * Math.max(0.7, Math.min(1.3, o.count))));
  const items = Array.from({ length: n }, (_, i) => ({
    x: ((i + 0.5 + (r() - 0.5) * 0.4) / n) * w, L: lerp(cfg.len[0], cfg.len[1], r()), size: lerp(cfg.size[0], cfg.size[1], r()),
    ph: r() * TAU, f: 0.6 + r() * 0.6, amp: (0.06 + r() * 0.08) * (cfg.swing ?? 1), spr: cfg.sprites[Math.floor(r() * cfg.sprites.length)],
  }));
  const posOf = (it: (typeof items)[number], t: number) => {
    const a = Math.sin(t * it.f + it.ph) * it.amp + wind(t) * 0.02;
    return { a, cx: it.x + Math.sin(a) * it.L, cy: Math.cos(a) * it.L };
  };
  const back: Scene = cfg.glowRgb
    ? make((ctx, _cw, _ch, dpr, _dt, t) => {
        ctx.globalCompositeOperation = 'lighter';
        for (const it of items) {
          const p = posOf(it, t);
          blit(ctx, glow(cfg.glowRgb as string, 64), p.cx, p.cy + it.size * 0.55, it.size * 2.4, 0, 1, 0.5 + 0.2 * Math.sin(t * 3 + it.ph), dpr);
        }
      })
    : make(() => {});
  const front = make((ctx, _cw, _ch, dpr, _dt, t) => {
    const pos = items.map((it) => posOf(it, t));
    reset(ctx, dpr);
    ctx.strokeStyle = cfg.stringColor ?? 'rgba(230,190,80,0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    items.forEach((it, i) => { ctx.moveTo(it.x, -2); ctx.lineTo(pos[i].cx, pos[i].cy); });
    ctx.stroke();
    items.forEach((it, i) => blit(ctx, it.spr, pos[i].cx, pos[i].cy + it.size * 0.6, it.size, -pos[i].a, 1, 1, dpr));
  });
  return { back, front };
}

/** A sagging wire across the top with flags/pennants swaying from it. */
export function flagRow(_w: number, _h: number, _o: SceneOpts, cfg: { sprites: Sprite[]; rows: number; per: number; size: [number, number]; sag: number; wire?: string }): Scene {
  const r = rng(111);
  const rows = Array.from({ length: cfg.rows }, (_, ri) => ({
    y0: ri * cfg.sag * 0.9 + 4,
    flags: Array.from({ length: cfg.per }, (_, i) => ({ u: (i + 0.5) / cfg.per, spr: cfg.sprites[(i + ri) % cfg.sprites.length], size: lerp(cfg.size[0], cfg.size[1], r()), ph: r() * TAU })),
  }));
  return make((ctx, cw, _ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    ctx.strokeStyle = cfg.wire ?? 'rgba(240,230,200,0.7)';
    ctx.lineWidth = 1.5;
    for (const row of rows) {
      ctx.beginPath();
      ctx.moveTo(-10, row.y0);
      ctx.quadraticCurveTo(cw / 2, row.y0 + cfg.sag * 2, cw + 10, row.y0);
      ctx.stroke();
    }
    for (const row of rows) {
      for (const f of row.flags) {
        const x = lerp(-10, cw + 10, f.u);
        const y = row.y0 + cfg.sag * 4 * f.u * (1 - f.u);
        const a = Math.sin(t * 1.5 + f.ph) * 0.2 + wind(t) * 0.04;
        blit(ctx, f.spr, x + Math.sin(a) * f.size * 0.4, y + Math.cos(a) * f.size * 0.4, f.size, -a, 1, 0.95, dpr);
      }
    }
  });
}

export function lights(w: number, _h: number, o: SceneOpts, cfg: { colors: string[]; rows: number }): Scene {
  const per = Math.max(8, Math.round(w / 46));
  const sag = 26;
  return make((ctx, cw, _ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    ctx.strokeStyle = 'rgba(20,50,30,0.9)';
    ctx.lineWidth = 2;
    for (let ri = 0; ri < cfg.rows; ri++) {
      const y0 = ri * 34 + 6;
      ctx.beginPath();
      ctx.moveTo(-10, y0);
      ctx.quadraticCurveTo(cw / 2, y0 + sag * 2, cw + 10, y0);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let ri = 0; ri < cfg.rows; ri++) {
      const y0 = ri * 34 + 6;
      for (let i = 0; i < per; i++) {
        const u = (i + 0.5) / per;
        const x = lerp(-10, cw + 10, u);
        const y = y0 + sag * 4 * u * (1 - u) + 6;
        const tw = 0.55 + 0.45 * Math.sin(t * (2 + (i % 3)) + i * 1.3 + ri);
        const rgb = cfg.colors[(i + ri) % cfg.colors.length];
        blit(ctx, glow(rgb, 48), x, y, 10 + 26 * tw * Math.max(0.7, o.count), 0, 1, 0.55 + 0.4 * tw, dpr);
        blit(ctx, glow('255,255,255', 32), x, y, 7, 0, 1, 0.5 + 0.5 * tw, dpr);
      }
    }
  });
}

/* ------------------------------ creatures & objects ------------------------------ */

export function bats(w: number, h: number, o: SceneOpts, cfg: { n: number }): Scene {
  const r = rng(121);
  const frames = [bat(0), bat(1), bat(2), bat(3)];
  const n = Math.max(2, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, () => ({
    x: r() * w, base: h * (0.1 + 0.5 * r()), amp: 20 + r() * 40, v: (r() < 0.5 ? -1 : 1) * (60 + r() * 90), size: 28 + r() * 40, ph: r() * TAU, fs: 9 + r() * 4,
  }));
  return make((ctx, cw, ch, dpr, dt, t) => {
    for (const b of items) {
      b.x += b.v * dt;
      if (b.x > cw + 80) { b.x = -80; b.base = ch * (0.1 + 0.5 * r()); }
      if (b.x < -80) { b.x = cw + 80; b.base = ch * (0.1 + 0.5 * r()); }
      const y = b.base + Math.sin(t * 0.9 + b.ph) * b.amp;
      const f = Math.floor((t * b.fs + b.ph) % 4);
      blit(ctx, frames[f], b.x, y, b.size, Math.sin(t * 1.3 + b.ph) * 0.15, 1, 0.95, dpr);
    }
  });
}

/**
 * Living jack-o-lanterns: the candle inside flickers (the carved face brightens and dims on its own), each one
 * breathes and wobbles, and every few seconds one gives a sudden creepy shake.
 */
export function pumpkins(w: number, _h: number, o: SceneOpts, cfg: { n: number }): Layered {
  const r = rng(131);
  const body = pumpkinSprite();
  const face = pumpkinFace();
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.7, o.count)));
  const items = Array.from({ length: n }, (_, i) => ({
    x: ((i + 0.5 + (r() - 0.5) * 0.5) / n) * w, size: 70 + r() * 50, ph: r() * TAU, f: 0.6 + r() * 0.5,
    nextShake: 2 + r() * 6, shakeT: -1,
  }));
  /** Per-pumpkin animated state at clock t. */
  const pose = (p: (typeof items)[number], t: number) => {
    if (t >= p.nextShake) { p.shakeT = t; p.nextShake = t + 5 + r() * 9; }
    const k = p.shakeT >= 0 ? t - p.shakeT : 9;
    const shake = k < 0.6 ? Math.sin(k * 55) * 0.1 * (1 - k / 0.6) : 0;
    const breath = 1 + Math.sin(t * 1.4 * p.f + p.ph) * 0.025 + (k < 0.6 ? 0.05 * (1 - k / 0.6) : 0);
    const flick = 0.62 + 0.2 * Math.sin(t * 9 + p.ph) + 0.12 * Math.sin(t * 17 + p.ph * 2) + 0.08 * Math.sin(t * 31 + p.ph * 3);
    const flare = k < 0.6 ? 0.5 * (1 - k / 0.6) : 0;
    return { rot: Math.sin(t * 0.9 * p.f + p.ph) * 0.03 + shake, scale: breath, glow: Math.min(1.4, flick + flare) };
  };
  const back = make(() => {});
  const front = make((ctx, _cw, ch, dpr, _dt, t) => {
    for (const p of items) {
      const s = pose(p, t);
      const y = ch - p.size * 0.32 + (1 - s.scale) * p.size * 0.6;
      ctx.globalCompositeOperation = 'source-over';
      blit(ctx, body, p.x, y, p.size * s.scale, s.rot, 1, 1, dpr);
      blit(ctx, face, p.x, y, p.size * s.scale, s.rot, 1, Math.min(1, 0.35 + s.glow * 0.65), dpr);
    }
  });
  return { back, front };
}

/**
 * Every pumpkin hops across the bottom of the screen at random, left to right or right to left: each one squashes,
 * springs up in an arc (tilting as it goes), lands with a squash, pauses, and hops again, then leaves the screen and
 * returns later from a random side with a random size and hop style.
 */
export function hoppingPumpkins(_w: number, _h: number, o: SceneOpts, cfg: { n: number; body?: Sprite; face?: Sprite | null; directional?: boolean; size?: [number, number] }): Layered {
  const r = rng(211);
  const body = cfg.body ?? pumpkinSprite();
  const face = cfg.face === undefined ? pumpkinFace() : cfg.face;
  const sizeRange = cfg.size ?? [56, 106];
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.6, Math.min(1.4, o.count))));
  interface Hopper { x: number; dir: 1 | -1; size: number; hopLen: number; hopH: number; hopDur: number; u: number; pause: number; wait: number; active: boolean; ph: number }
  const spawn = (hp: Hopper, cw: number, firstDelay?: number) => {
    hp.dir = r() < 0.5 ? 1 : -1;
    hp.size = sizeRange[0] + r() * (sizeRange[1] - sizeRange[0]);
    hp.hopLen = hp.size * (0.9 + r() * 1.3);
    hp.hopH = hp.size * (0.55 + r() * 0.9);
    hp.hopDur = 0.55 + r() * 0.35;
    hp.x = hp.dir === 1 ? -hp.size : cw + hp.size;
    hp.u = 0;
    hp.pause = 0.1 + r() * 0.3;
    hp.active = false;
    hp.wait = firstDelay ?? 1 + r() * 3.5;
    hp.ph = r() * TAU;
  };
  const hoppers: Hopper[] = Array.from({ length: n }, () => ({ x: 0, dir: 1, size: 60, hopLen: 100, hopH: 60, hopDur: 0.7, u: 0, pause: 0, wait: 0, active: false, ph: 0 }));
  let init = false;
  const lit = (hp: Hopper, i: number, cw: number) => {
    // Start already on screen, spread across the width, mid-rhythm, heading a random way.
    spawn(hp, cw, 0);
    hp.x = ((i + 0.5 + (r() - 0.5) * 0.6) / n) * cw;
    hp.active = true;
    hp.pause = r() * 0.8;
  };
  /** Advances one hopper and returns its pose (null while off-screen / waiting). */
  const step = (hp: Hopper, dt: number, cw: number) => {
    if (!hp.active) {
      hp.wait -= dt;
      if (hp.wait <= 0) hp.active = true;
      return null;
    }
    if (hp.pause > 0) {
      hp.pause -= dt;
    } else {
      const prev = hp.u;
      hp.u += dt / hp.hopDur;
      hp.x += (hp.dir * hp.hopLen * (hp.u - prev)) ;
      if (hp.u >= 1) {
        hp.u = 0;
        hp.pause = 0.12 + r() * 0.45;
        // sometimes change the next hop so the rhythm feels alive
        hp.hopLen = hp.size * (0.9 + r() * 1.3);
        hp.hopH = hp.size * (0.55 + r() * 0.9);
      }
    }
    if ((hp.dir === 1 && hp.x > cw + hp.size) || (hp.dir === -1 && hp.x < -hp.size)) {
      spawn(hp, cw);
      return null;
    }
    const air = hp.pause > 0 ? 0 : 4 * hp.u * (1 - hp.u);
    // squash right before take-off and right after landing
    const crouch = hp.pause > 0 ? Math.max(0, 1 - hp.pause / 0.12) * 0.12 + 0.1 * Math.max(0, 1 - (hp.pause - 0.0) / 0.25) : 0;
    const stretch = air * 0.14;
    return { lift: air * hp.hopH, sx: 1 + crouch - stretch * 0.6, sy: 1 - crouch + stretch, rot: hp.dir * (hp.u - 0.5) * 0.5 * (hp.pause > 0 ? 0 : 1) };
  };
  const poses: Array<ReturnType<typeof step>> = hoppers.map(() => null);
  // The hop is stepped in the front layer (drawn every frame). No glow/halo layer: only the pumpkin itself is drawn.
  const back = make(() => {});
  const front = make((ctx, cw, ch, dpr, dt, t) => {
    if (!init) { hoppers.forEach((hp, i) => lit(hp, i, cw)); init = true; }
    hoppers.forEach((hp, i) => {
      poses[i] = step(hp, dt, cw);
      const p = poses[i];
      if (!p) return;
      const y = ch - hp.size * 0.3 - p.lift + (1 - p.sy) * hp.size * 0.45;
      const fl = 0.75 + 0.25 * Math.sin(t * 13 + hp.ph);
      // squash/stretch by drawing with a scaled transform
      const k = (hp.size / body.width) * dpr;
      const c = Math.cos(p.rot) * k;
      const sn = Math.sin(p.rot) * k;
      ctx.globalCompositeOperation = 'source-over';
      const mirror = cfg.directional && hp.dir === -1 ? -1 : 1;
      for (const spr of face ? [body, face] : [body]) {
        ctx.setTransform(c * p.sx * mirror, sn * p.sx * mirror, -sn * p.sy, c * p.sy, hp.x * dpr, y * dpr);
        ctx.globalAlpha = spr === face ? Math.min(1, 0.4 + fl * 0.6) : 1;
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      }
      ctx.globalAlpha = 1;
    });
  });
  return { back, front };
}

/**
 * Diwali ground crackers, picked at random: anar (flowerpot fountain), chakri (spinning wheel), phooljhadi
 * (sparkler shower), sutli bomb (flash + shock ring + smoke) and ladi (a string of bangs). Sparks share one
 * capped pool so the scene stays cheap.
 */
export function crackers(w: number, h: number, o: SceneOpts, cfg: { kinds?: Array<'anar' | 'chakri' | 'sparkler' | 'bomb' | 'ladi'> } = {}): Scene {
  const r = rng(231);
  interface Spark { x: number; y: number; vx: number; vy: number; age: number; life: number; rgb: string; s: number; g: number; drag: number }
  interface Cracker {
    kind: 'anar' | 'chakri' | 'sparkler' | 'bomb' | 'ladi';
    x: number; y: number; age: number; dur: number; ang: number; vx: number; acc: number; rgb: string; hits: number;
  }
  const CAP = 280;
  const sparks: Spark[] = [];
  const active: Cracker[] = [];
  const rings: Array<{ x: number; y: number; age: number; rgb: string; max: number }> = [];
  const flashes: Array<{ x: number; y: number; age: number; size: number }> = [];
  const puffs: Array<{ x: number; y: number; age: number; size: number }> = [];
  let wait = 0.6;
  let q = 1;
  const GOLD = ['255,214,120', '255,170,60', '255,240,190', '255,130,40'];
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const add = (sp: Spark) => { if (sparks.length < CAP) sparks.push(sp); };
  const burst = (x: number, y: number, n: number, speed: number, rgbs: string[], life = 0.7) => {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU;
      const sp = speed * (0.3 + r() * 0.7);
      add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: life * (0.6 + r() * 0.6), rgb: pick(rgbs), s: 6 + r() * 6, g: 160, drag: 0.1 });
    }
  };

  const spawn = (cw: number, ch: number) => {
    const allowed = cfg.kinds ?? ['anar', 'chakri', 'sparkler', 'bomb', 'ladi'];
    const kind = allowed[Math.floor(r() * allowed.length)] as Cracker['kind'];
    const ground = ch - 10;
    const c: Cracker = { kind, x: cw * (0.08 + 0.84 * r()), y: ground, age: 0, dur: 3.5, ang: r() * TAU, vx: 0, acc: 0, rgb: pick(GOLD), hits: 0 };
    if (kind === 'anar') { c.dur = 3.2 + r() * 1.5; c.rgb = pick(['255,200,90', '255,255,255', '120,255,160', '255,120,200']); }
    if (kind === 'chakri') { c.dur = 3 + r() * 1.5; c.vx = (r() < 0.5 ? -1 : 1) * (30 + r() * 50); c.rgb = pick(['90,255,160', '255,90,90', '255,215,90', '120,190,255']); }
    if (kind === 'sparkler') { c.dur = 4 + r() * 2; c.y = ground - 70 - r() * 60; }
    if (kind === 'bomb') { c.dur = 0.6; c.y = ground - r() * 90; }
    if (kind === 'ladi') { c.dur = 1.6; c.vx = (r() < 0.5 ? -1 : 1) * (170 + r() * 90); c.x = c.vx > 0 ? cw * (0.05 + 0.3 * r()) : cw * (0.95 - 0.3 * r()); }
    active.push(c);
    if (kind === 'bomb') {
      // the bang itself: instant flash, shock ring, hot sparks, and a puff of smoke
      flashes.push({ x: c.x, y: c.y, age: 0, size: 240 });
      rings.push({ x: c.x, y: c.y, age: 0, rgb: '255,235,190', max: 130 });
      burst(c.x, c.y, Math.round(34 * q), 360, ['255,255,255', '255,214,120', '255,150,50'], 0.8);
      puffs.push({ x: c.x, y: c.y, age: 0, size: 150 });
    }
  };

  return make((ctx, cw, ch, dpr, dt, t) => {
    wait -= dt;
    if (wait <= 0 && active.length < 4) {
      spawn(cw, ch);
      wait = (0.7 + r() * 1.5) / Math.max(0.6, o.count);
    }
    const ground = ch - 10;

    for (let i = active.length - 1; i >= 0; i--) {
      const c = active[i];
      c.age += dt;
      if (c.age >= c.dur) { active.splice(i, 1); continue; }
      const k = 1 - c.age / c.dur;
      if (c.kind === 'anar') {
        c.acc += dt * 95 * o.count * q;
        while (c.acc >= 1) {
          c.acc -= 1;
          add({ x: c.x + (r() - 0.5) * 6, y: ground, vx: (r() - 0.5) * 120, vy: -(240 + r() * 220) * (0.6 + 0.4 * k), age: 0, life: 0.9 + r() * 0.8, rgb: c.rgb === '255,200,90' ? pick(GOLD) : c.rgb, s: 6 + r() * 6, g: 330, drag: 0.55 });
        }
      } else if (c.kind === 'chakri') {
        c.ang += dt * (14 + 8 * k);
        c.x += c.vx * dt;
        if (c.x < 20 || c.x > cw - 20) c.vx = -c.vx;
        c.acc += dt * 160 * o.count * q;
        while (c.acc >= 1) {
          c.acc -= 1;
          const a = c.ang + r() * 0.3;
          add({ x: c.x + Math.cos(a) * 16, y: ground - 14 + Math.sin(a) * 16, vx: Math.cos(a + 1.5) * 230 + Math.cos(a) * 60, vy: Math.sin(a + 1.5) * 230 + Math.sin(a) * 60 - 20, age: 0, life: 0.35 + r() * 0.3, rgb: c.rgb, s: 5 + r() * 4, g: 120, drag: 0.05 });
        }
      } else if (c.kind === 'sparkler') {
        c.acc += dt * 85 * o.count * q;
        while (c.acc >= 1) {
          c.acc -= 1;
          const a = r() * TAU;
          const sp = 60 + r() * 150;
          add({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.25 + r() * 0.35, rgb: r() < 0.7 ? '255,236,170' : '255,255,255', s: 4 + r() * 3, g: 220, drag: 0.04 });
        }
      } else if (c.kind === 'ladi') {
        c.x += c.vx * dt;
        c.acc += dt;
        while (c.acc >= 0.075) {
          c.acc -= 0.075;
          const bx = c.x;
          const by = ground - r() * 8;
          flashes.push({ x: bx, y: by, age: 0, size: 70 });
          rings.push({ x: bx, y: by, age: 0, rgb: '255,230,170', max: 36 });
          burst(bx, by, Math.round(9 * q), 190, ['255,255,255', '255,214,120'], 0.45);
        }
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.age += dt;
      if (sp.age >= sp.life) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
      const d = Math.pow(sp.drag, dt);
      sp.vx *= d;
      sp.vy = sp.vy * d + sp.g * dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      const u = 1 - sp.age / sp.life;
      const gl = glow(sp.rgb);
      blit(ctx, gl, sp.x, sp.y, sp.s * (0.4 + 0.6 * u), 0, 1, Math.pow(u, 0.7), dpr);
      if (sparks.length < 150) blit(ctx, gl, sp.x - sp.vx * 0.04, sp.y - sp.vy * 0.04, sp.s * 0.55 * (0.4 + 0.6 * u), 0, 1, u * 0.5, dpr);
    }
    // fountain / wheel / sparkler heads
    for (const c of active) {
      if (c.kind === 'anar') {
        const k = 1 - c.age / c.dur;
        blit(ctx, glow(c.rgb === '255,200,90' ? '255,190,90' : c.rgb, 64), c.x, ground - 12, 70 + 40 * k, 0, 1, 0.55 + 0.25 * Math.sin(t * 40), dpr);
      } else if (c.kind === 'chakri') {
        blit(ctx, glow(c.rgb, 64), c.x, ground - 14, 64, 0, 1, 0.55, dpr);
      } else if (c.kind === 'sparkler') {
        blit(ctx, glow('255,240,190', 64), c.x, c.y, 34, 0, 1, 0.85, dpr);
      } else if (c.kind === 'ladi') {
        blit(ctx, glow('255,230,160', 64), c.x, ground - 4, 46, 0, 1, 0.8, dpr);
      }
    }
    // bang flashes + smoke
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.age += dt;
      if (f.age > 0.28) { flashes.splice(i, 1); continue; }
      const u = 1 - f.age / 0.28;
      blit(ctx, glow('255,248,225', 64), f.x, f.y, f.size * (0.6 + 0.6 * (1 - u)), 0, 1, u * 0.95, dpr);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age > 2.2) { puffs.splice(i, 1); continue; }
      const u = p.age / 2.2;
      blit(ctx, glow('150,140,150', 64), p.x + u * 30, p.y - u * 50, p.size * (0.6 + u * 1.4), 0, 1, Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u) * 0.3, dpr);
    }
    // shock rings (stroked, so reset the transform first)
    reset(ctx, dpr);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = rings.length - 1; i >= 0; i--) {
      const rg = rings[i];
      rg.age += dt;
      if (rg.age > 0.45) { rings.splice(i, 1); continue; }
      const u = rg.age / 0.45;
      ctx.strokeStyle = 'rgba(' + rg.rgb + ',' + (1 - u) * 0.8 + ')';
      ctx.lineWidth = 3 * (1 - u) + 0.6;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.max * (0.12 + 0.88 * Math.sqrt(u)), 0, TAU);
      ctx.stroke();
    }
    reset(ctx, dpr);
    void w;
    void h;
  }, (v) => { q = v; });
}

/** Spiders that lower themselves on silk threads, pause, twitch, then haul back up. */
export function spiders(w: number, h: number, o: SceneOpts, cfg: { n: number }): Scene {
  const r = rng(171);
  const spr = spiderSprite();
  const n = Math.max(2, Math.round(cfg.n * Math.max(0.7, o.count)));
  const items = Array.from({ length: n }, (_, i) => ({
    x: ((i + 0.5 + (r() - 0.5) * 0.5) / n) * w, drop: h * (0.18 + 0.4 * r()), period: 9 + r() * 7, ph: r() * 20, size: 30 + r() * 24,
  }));
  return make((ctx, _cw, _ch, dpr, _dt, t) => {
    for (const s of items) {
      // blit() leaves the canvas in the previous sprite's transform, so reset before every thread (not just once).
      reset(ctx, dpr);
      const u = ((t + s.ph) % s.period) / s.period;
      // 0-.35 lower slowly, .35-.7 hang and twitch, .7-1 climb back
      const lower = u < 0.35 ? u / 0.35 : u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
      const ease = lower * lower * (3 - 2 * lower);
      const twitch = u >= 0.35 && u < 0.7 ? Math.sin(t * 14 + s.ph) * 5 * Math.max(0, Math.sin(t * 2 + s.ph)) : 0;
      const y = -10 + ease * s.drop + twitch;
      const x = s.x + Math.sin(t * 0.8 + s.ph) * 5 * ease;
      ctx.strokeStyle = 'rgba(225,225,235,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, -4);
      ctx.lineTo(x, y - s.size * 0.4);
      ctx.stroke();
      blit(ctx, spr, x, y, s.size * 1.6, Math.sin(t * 1.5 + s.ph) * 0.08, 1, 1, dpr);
    }
  });
}

/** Translucent ghosts drifting and swaying across the night. */
export function ghosts(w: number, h: number, o: SceneOpts, cfg: { n: number }): Scene {
  const r = rng(181);
  const spr = ghostSprite();
  const n = Math.max(2, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, () => ({
    x: r() * w, y: h * (0.15 + 0.5 * r()), v: (r() < 0.5 ? -1 : 1) * (14 + r() * 26), size: 70 + r() * 70, ph: r() * TAU, f: 0.5 + r() * 0.5,
  }));
  return make((ctx, cw, ch, dpr, dt, t) => {
    for (const g of items) {
      g.x += g.v * dt;
      if (g.x > cw + 120) { g.x = -120; g.y = ch * (0.15 + 0.5 * r()); }
      if (g.x < -120) { g.x = cw + 120; g.y = ch * (0.15 + 0.5 * r()); }
      const y = g.y + Math.sin(t * g.f + g.ph) * 22;
      // slowly fades in and out so they come and go like apparitions
      const a = 0.15 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.35 + g.ph));
      ctx.globalCompositeOperation = 'source-over';
      blit(ctx, spr, g.x, y, g.size, Math.sin(t * g.f * 1.3 + g.ph) * 0.12, 1, a, dpr);
    }
  });
}

/** Pairs of eyes that open in the dark, stare, blink and vanish. */
export function eyes(w: number, h: number, o: SceneOpts, cfg: { n: number }): Scene {
  const r = rng(191);
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, () => ({ x: r() * w, y: h * (0.25 + 0.65 * r()), gap: 8 + r() * 8, size: 6 + r() * 5, period: 8 + r() * 10, ph: r() * 30, hue: r() < 0.6 ? '255,60,40' : '255,200,60' }));
  return make((ctx, _cw, _ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const e of items) {
      const u = ((t + e.ph) % e.period) / e.period;
      if (u > 0.45) continue;
      const open = Math.min(1, u / 0.04) * Math.min(1, (0.45 - u) / 0.05);
      const blink = Math.abs(((u * e.period) % 3.1) - 1.5) < 0.08 ? 0.1 : 1;
      const a = open * blink;
      for (const sx of [-1, 1]) {
        blit(ctx, glow(e.hue, 32), e.x + sx * e.gap, e.y, e.size * 3.4, 0, 1, a * 0.45, dpr);
        ctx.setTransform(dpr, 0, 0, dpr, (e.x + sx * e.gap) * dpr, e.y * dpr);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgb(' + e.hue + ')';
        ctx.beginPath();
        ctx.ellipse(0, 0, e.size * 0.55, e.size * 0.28 * Math.max(0.2, blink), sx * 0.35, 0, TAU);
        ctx.fill();
      }
    }
    reset(ctx, dpr);
  });
}

export function skyLanterns(_w: number, _h: number, o: SceneOpts, cfg: { n: number; spr: Sprite }): Layered {
  const r = rng(141);
  const items = Array.from({ length: Math.round(cfg.n * o.count) }, () => ({ x01: r(), y01: r(), v: 16 + r() * 26, s: 26 + r() * 30, ph: r() * TAU }));
  let q = 1;
  const at = (l: (typeof items)[number], cw: number, ch: number, t: number) => {
    const per = ch + 120;
    const y = ((((l.y01 * per - l.v * t) % per) + per) % per) - 60;
    const a = Math.min(1, Math.max(0, (ch - y) / 80)) * Math.min(1, Math.max(0, (y + 40) / (ch * 0.2)));
    return { x: l.x01 * cw + Math.sin(t * 0.5 + l.ph) * 24 + wind(t) * 8, y, a };
  };
  const back = make((ctx, cw, ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const p = at(items[i], cw, ch, t);
      blit(ctx, glow('255,170,70', 64), p.x, p.y, items[i].s * 3.2, 0, 1, 0.5 * p.a, dpr);
    }
  }, (v) => { q = v; });
  const front = make((ctx, cw, ch, dpr, _dt, t) => {
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const l = items[i];
      const p = at(l, cw, ch, t);
      blit(ctx, cfg.spr, p.x, p.y, l.s, Math.sin(t * 0.7 + l.ph) * 0.08, 1, p.a, dpr);
    }
  }, (v) => { q = v; });
  return { back, front };
}

export function kites(w: number, h: number, o: SceneOpts, cfg: { n: number; sprites: Sprite[] }): Scene {
  const r = rng(151);
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, (_, i) => ({
    x0: ((i + 0.5 + (r() - 0.5) * 0.6) / n) * w, y0: h * (0.12 + 0.5 * r()), size: 46 + r() * 50, ph: r() * TAU, spr: cfg.sprites[i % cfg.sprites.length],
    tail: ['#ff3d6e', '#ffd23f', '#3fd1ff', '#7cff6b'][i % 4],
  }));
  return make((ctx, cw, ch, dpr, _dt, t) => {
    const wv = wind(t);
    const pos = items.map((k) => ({
      x: k.x0 + Math.sin(t * 0.3 + k.ph) * 42 + wv * 10,
      y: k.y0 + Math.sin(t * 0.5 + k.ph * 2) * 20,
      rot: Math.sin(t * 0.9 + k.ph) * 0.22 + wv * 0.06,
    }));
    reset(ctx, dpr);
    ctx.lineWidth = 1;
    items.forEach((k, i) => {
      const p = pos[i];
      const bx = p.x - Math.sin(p.rot) * -k.size * 0.5;
      const by = p.y + k.size * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo((bx + k.x0) / 2, (by + ch) / 2 + 30, k.x0 * 0.7 + cw * 0.15, ch + 20);
      ctx.stroke();
      ctx.strokeStyle = k.tail;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let s = 0; s <= 9; s++) {
        const tx = bx + Math.sin(t * 3 + s * 0.8 + k.ph) * (5 + s * 2) - wv * s * 2;
        const ty = by + s * k.size * 0.17;
        if (s) ctx.lineTo(tx, ty);
        else ctx.moveTo(bx, by);
        if (s % 2 === 1) { ctx.fillStyle = k.tail; ctx.fillRect(tx - 4, ty - 2, 8, 4); }
      }
      ctx.stroke();
      ctx.lineWidth = 1;
    });
    items.forEach((k, i) => blit(ctx, k.spr, pos[i].x, pos[i].y, k.size, pos[i].rot, 1, 1, dpr));
  });
}

function drawCarp(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, hgt: number, t: number, ph: number, body: string, belly: string) {
  const N = 14;
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const cx = x + u * len;
    const cy = y + Math.sin(t * 3 + u * 5 + ph) * (hgt * 0.22 * u) + u * u * hgt * 0.15;
    const ry = (hgt / 2) * (0.95 - 0.72 * u);
    ctx.fillStyle = i % 2 ? body : belly;
    ctx.beginPath();
    ctx.ellipse(cx, cy, (len / N) * 0.9, ry, 0, 0, TAU);
    ctx.fill();
  }
  const ex = x + len;
  const ey = y + Math.sin(t * 3 + 5 + ph) * (hgt * 0.22) + hgt * 0.15;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(ex - 4, ey);
  ctx.lineTo(ex + len * 0.2, ey - hgt * 0.32 + Math.sin(t * 4 + ph) * 4);
  ctx.lineTo(ex + len * 0.1, ey);
  ctx.lineTo(ex + len * 0.2, ey + hgt * 0.32 + Math.sin(t * 4 + ph) * 4);
  ctx.closePath();
  ctx.fill();
  const hy = y + Math.sin(t * 3 + ph) * 0;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + len * 0.09, hy - hgt * 0.08, hgt * 0.11, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x + len * 0.095, hy - hgt * 0.08, hgt * 0.055, 0, TAU);
  ctx.fill();
}

export function koinobori(w: number, h: number, _o: SceneOpts, cfg: { poles: number[] }): Scene {
  const cols: Array<[string, string]> = [['#1b1b1f', '#44444c'], ['#e2332b', '#f26a5c'], ['#2f7fe0', '#6aa8f2'], ['#27a560', '#5cd18c'], ['#ec5fa0', '#f59cc4']];
  return make((ctx, cw, ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    const unit = Math.min(cw, ch * 1.4);
    for (const [pi, px0] of cfg.poles.entries()) {
      const px = px0 * cw;
      ctx.strokeStyle = '#6b4a2c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, ch * 0.7);
      ctx.stroke();
      ctx.fillStyle = '#e3b341';
      ctx.beginPath();
      ctx.arc(px, 6, 7, 0, TAU);
      ctx.fill();
      for (let c = 0; c < 3; c++) {
        const col = cols[(c + pi * 2) % cols.length];
        const len = unit * (0.2 - c * 0.025);
        drawCarp(ctx, px + 4, ch * (0.14 + c * 0.14), len, len * 0.34, t, c * 1.3 + pi, col[0], col[1]);
      }
    }
    void h;
    void w;
  });
}

export function dragon(w: number, _h: number, _o: SceneOpts, cfg: { y?: number } = {}): Scene {
  const N = 36;
  const sc = Math.min(1.1, Math.max(0.55, w / 1300));
  const sp = 26 * sc;
  return make((ctx, cw, ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    const period = cw + N * sp + 500;
    const headX = ((t * 110 * sc) % period) - 120;
    const path = (x: number) => ch * (cfg.y ?? 0.3) + Math.sin(x * 0.0055 + 0.8) * ch * 0.13;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < N; i++) {
      const x = headX - i * sp;
      pts.push({ x, y: path(x) + Math.sin(t * 2.2 - i * 0.45) * 7 * sc });
    }
    if (pts[N - 1].x > cw + 60 || pts[0].x < -60) return;
    ctx.lineJoin = 'round';
    for (let i = N - 1; i >= 0; i--) {
      const p = pts[i];
      const q = pts[Math.max(0, i - 1)];
      const ang = Math.atan2(q.y - p.y, q.x - p.x || 1);
      const rad = 19 * sc * (1 - (i / N) * 0.55) * (i === 0 ? 1.35 : 1);
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      if (i % 2 === 0 && i > 0) {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.moveTo(p.x + nx * rad * 0.95 - Math.cos(ang) * 4, p.y + ny * rad * 0.95 - Math.sin(ang) * 4);
        ctx.lineTo(p.x + nx * rad * 1.7 + Math.cos(ang) * 2, p.y + ny * rad * 1.7 + Math.sin(ang) * 2);
        ctx.lineTo(p.x + nx * rad * 0.95 + Math.cos(ang) * 8, p.y + ny * rad * 0.95 + Math.sin(ang) * 8);
        ctx.closePath();
        ctx.fill();
      }
      const grad = ctx.createRadialGradient(p.x - nx * rad * 0.3, p.y - ny * rad * 0.3, 1, p.x, p.y, rad);
      grad.addColorStop(0, '#ff5a3c');
      grad.addColorStop(1, '#b3151a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f5d27a';
      ctx.beginPath();
      ctx.arc(p.x - nx * rad * 0.45, p.y - ny * rad * 0.45, rad * 0.55, 0, TAU);
      ctx.fill();
      if (i % 3 === 0) {
        ctx.strokeStyle = 'rgba(255,214,120,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 0.7, ang - 1, ang + 1);
        ctx.stroke();
      }
    }
    const hp = pts[0];
    const hq = pts[1];
    const ha = Math.atan2(hp.y - hq.y, hp.x - hq.x);
    ctx.save();
    ctx.translate(hp.x, hp.y);
    ctx.rotate(ha);
    const hs = sc * 1.1;
    ctx.scale(hs, hs);
    ctx.fillStyle = '#ffae2b';
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(-10 - k * 6, -16);
      ctx.quadraticCurveTo(-20 - k * 10, -34 - Math.sin(t * 6 + k) * 4, -34 - k * 10, -22);
      ctx.quadraticCurveTo(-18 - k * 8, -18, -10 - k * 6, -16);
      ctx.fill();
    }
    const hg = ctx.createRadialGradient(0, -4, 2, 0, 0, 34);
    hg.addColorStop(0, '#ff6a45');
    hg.addColorStop(1, '#b3151a');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(6, 0, 30, 22, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(36, 6, 18, 11, 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(12, -9, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(13.5, -9, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.moveTo(40, 14); ctx.lineTo(46, 22); ctx.lineTo(36, 17); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 3.2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, -18);
      ctx.quadraticCurveTo(24, -42 * (s === 1 ? 1 : 0.8), 40, -30 + Math.sin(t * 5) * 3);
      ctx.stroke();
      break;
    }
    ctx.strokeStyle = 'rgba(255,230,150,0.85)';
    ctx.lineWidth = 1.8;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(48, 6 + s * 3);
      ctx.bezierCurveTo(70, 6 + s * 16 + Math.sin(t * 4) * 6, 90, 6 + s * 4, 110, 6 + s * 22 + Math.sin(t * 5 + s) * 8);
      ctx.stroke();
    }
    ctx.restore();
  });
}

export function waves(w: number, h: number, _o: SceneOpts, cfg: { rgb: string[] }): Scene {
  return make((ctx, cw, ch, _dpr, _dt, t) => {
    for (let b = 0; b < cfg.rgb.length; b++) {
      const base = ch * (0.72 + b * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, ch);
      for (let x = 0; x <= cw + 16; x += 16) ctx.lineTo(x, base + Math.sin(x * 0.012 + t * (1 + b * 0.25) + b * 2) * (8 + b * 3) + Math.sin(x * 0.03 - t * 0.8) * 3);
      ctx.lineTo(cw + 16, ch);
      ctx.closePath();
      ctx.fillStyle = `rgba(${cfg.rgb[b]},${0.32 + b * 0.08})`;
      ctx.fill();
    }
    void w;
    void h;
  });
}

export function dragonBoats(w: number, h: number, o: SceneOpts): Scene {
  const n = Math.max(1, Math.round(2 * Math.max(0.7, o.count)));
  const sc = Math.min(1.1, Math.max(0.55, w / 1300));
  const boats = Array.from({ length: n }, (_, i) => ({ x: (i / n) * (w + 400) - 100, v: 46 + i * 14, row: i, ph: i * 1.9 }));
  return make((ctx, cw, ch, dpr, dt, t) => {
    reset(ctx, dpr);
    for (const b of boats) {
      b.x += b.v * dt;
      if (b.x > cw + 240 * sc) b.x = -260 * sc;
      const y = ch * (0.8 + b.row * 0.035) + Math.sin(b.x * 0.012 + t * 1.2) * 8;
      ctx.save();
      ctx.translate(b.x, y);
      ctx.rotate(Math.cos(b.x * 0.012 + t * 1.2) * 0.05);
      ctx.scale(sc, sc);
      // hull
      const hg = ctx.createLinearGradient(0, -14, 0, 14);
      hg.addColorStop(0, '#d9261c');
      hg.addColorStop(1, '#7a0f10');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(-100, -4);
      ctx.quadraticCurveTo(-60, 22, 0, 22);
      ctx.quadraticCurveTo(80, 22, 112, -10);
      ctx.lineTo(112, -14);
      ctx.lineTo(-100, -14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(-98, -14, 210, 4);
      // dragon prow
      ctx.fillStyle = '#e63a22';
      ctx.beginPath();
      ctx.moveTo(104, -12);
      ctx.quadraticCurveTo(122, -34, 118, -48);
      ctx.quadraticCurveTo(138, -50, 146, -42);
      ctx.quadraticCurveTo(132, -38, 128, -28);
      ctx.quadraticCurveTo(128, -16, 116, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(126, -45, 4, 4);
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.moveTo(118, -48); ctx.lineTo(112, -62); ctx.lineTo(124, -52);
      ctx.fill();
      // stern tail
      ctx.fillStyle = '#e63a22';
      ctx.beginPath();
      ctx.moveTo(-96, -10); ctx.quadraticCurveTo(-120, -26, -112, -44); ctx.lineTo(-100, -26); ctx.closePath();
      ctx.fill();
      // rowers + paddles
      for (let i = 0; i < 9; i++) {
        const rx = -80 + i * 19;
        ctx.fillStyle = i % 2 ? '#ffd23f' : '#fff';
        ctx.beginPath();
        ctx.arc(rx, -22, 5.5, 0, TAU);
        ctx.fill();
        ctx.fillRect(rx - 4, -17, 8, 7);
        const a = Math.sin(t * 4 + i * 0.35 + b.ph) * 0.45;
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(rx, -14);
        ctx.lineTo(rx - 10 - a * 24, 20 + a * 8);
        ctx.stroke();
      }
      // drum
      ctx.fillStyle = '#c2191b';
      ctx.fillRect(40, -34, 16, 14);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(40, -34, 16, 3);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - 120 * sc, y + 14);
      ctx.lineTo(b.x - 240 * sc, y + 20 + Math.sin(t * 3) * 2);
      ctx.stroke();
    }
    void h;
  });
}

export function celestial(w: number, h: number, _o: SceneOpts, cfg: { spr: Sprite; x: number; y: number; size: number; glowRgb: string; halo?: boolean }): Scene {
  return make((ctx, cw, ch, dpr, _dt, t) => {
    const x = cfg.x * cw;
    const y = cfg.y * ch;
    const s = cfg.size * Math.min(cw, ch * 1.3);
    ctx.globalCompositeOperation = 'lighter';
    if (cfg.halo !== false) blit(ctx, glow(cfg.glowRgb, 96), x, y, s * 3, 0, 1, 0.55 + 0.1 * Math.sin(t * 0.6), dpr);
    ctx.globalCompositeOperation = 'source-over';
    blit(ctx, cfg.spr, x, y, s, 0, 1, 0.97, dpr);
    void w;
    void h;
  });
}

export function twinkle(w: number, h: number, o: SceneOpts, cfg: { n: number; spr: Sprite; region?: [number, number]; size?: [number, number]; seed?: number }): Scene {
  const r = rng(cfg.seed ?? 161);
  const reg = cfg.region ?? [0, 1];
  const sz = cfg.size ?? [10, 24];
  const items = Array.from({ length: Math.round(cfg.n * o.count) }, () => ({ x: r() * w, y: h * lerp(reg[0], reg[1], r()), s: lerp(sz[0], sz[1], r()), ph: r() * TAU, v: 0.6 + r() * 1.4 }));
  return make((ctx, _cw, _ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of items) {
      const a = Math.pow(Math.max(0, Math.sin(t * s.v + s.ph)), 3);
      if (a > 0.03) blit(ctx, cfg.spr, s.x, s.y, s.s * (0.5 + a * 0.6), Math.PI / 4 * a, 1, a * 0.9, dpr);
    }
  });
}
