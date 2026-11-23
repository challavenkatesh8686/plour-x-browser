/** More festival effect primitives (flying, floating, light and water effects). Composed in festivalScenes.ts. */
import { blit, reset, TAU, lerp, wind, type Scene, type SceneOpts } from './scenes';
import { rng, type Sprite } from './sprites';
import { glow } from './festivalSprites';

const make = (draw: Scene['draw'], setQ?: (q: number) => void): Scene => ({ draw, setQuality: setQ ?? (() => {}) });
const pickFrom = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

/* ------------------------------ birds ------------------------------ */

/** V-formation flocks gliding across the sky, wings flapping. */
export function birds(w: number, h: number, o: SceneOpts, cfg: { flocks: number; color?: string }): Scene {
  const r = rng(301);
  const n = Math.max(1, Math.round(cfg.flocks * Math.max(0.6, Math.min(1.3, o.count))));
  const flocks = Array.from({ length: n }, (_, i) => ({
    x: r() * (w + 400) - 200, y: h * (0.1 + 0.3 * r()), v: (r() < 0.5 ? -1 : 1) * (40 + r() * 40), size: 0.7 + r() * 0.8, birds: 5 + Math.floor(r() * 4), ph: r() * TAU + i,
  }));
  return make((ctx, cw, ch, dpr, dt, t) => {
    reset(ctx, dpr);
    ctx.strokeStyle = cfg.color ?? 'rgba(25,20,45,0.6)';
    ctx.lineCap = 'round';
    for (const f of flocks) {
      f.x += f.v * dt;
      if (f.x > cw + 220) { f.x = -220; f.y = ch * (0.1 + 0.3 * r()); }
      if (f.x < -220) { f.x = cw + 220; f.y = ch * (0.1 + 0.3 * r()); }
      const by = f.y + Math.sin(t * 0.3 + f.ph) * 16;
      ctx.lineWidth = 1.6 * f.size;
      ctx.beginPath();
      for (let i = 0; i < f.birds; i++) {
        const k = Math.ceil(i / 2);
        const side = i % 2 ? 1 : -1;
        const bx = f.x - Math.sign(f.v) * k * 20 * f.size;
        const bYo = by + side * k * 9 * f.size;
        const flap = Math.sin(t * 7 + f.ph + i * 0.7);
        const span = 9 * f.size;
        ctx.moveTo(bx - span, bYo - flap * 5 * f.size);
        ctx.quadraticCurveTo(bx - span * 0.4, bYo - 5 * f.size - flap * 3, bx, bYo);
        ctx.quadraticCurveTo(bx + span * 0.4, bYo - 5 * f.size - flap * 3, bx + span, bYo - flap * 5 * f.size);
      }
      ctx.stroke();
    }
  });
}

/* ------------------------------ butterflies ------------------------------ */

export function butterflies(w: number, h: number, o: SceneOpts, cfg: { n: number; colors: Array<[string, string]> }): Scene {
  const r = rng(311);
  const n = Math.max(2, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, () => ({
    x: r() * w, y: h * (0.25 + 0.6 * r()), vx: 24 + r() * 30, ph: r() * TAU, size: 14 + r() * 12, col: pickFrom(r, cfg.colors), dir: r() < 0.5 ? -1 : 1, f: 10 + r() * 6,
  }));
  return make((ctx, cw, _ch, dpr, dt, t) => {
    for (const b of items) {
      b.x += b.dir * b.vx * dt + Math.sin(t * 0.7 + b.ph) * 40 * dt;
      if (b.x > cw + 40) b.x = -40;
      if (b.x < -40) b.x = cw + 40;
      const y = b.y + Math.sin(t * 1.3 + b.ph) * 34 + Math.sin(t * 3.1 + b.ph) * 8;
      const flap = 0.25 + 0.75 * Math.abs(Math.cos(t * b.f + b.ph));
      reset(ctx, dpr);
      ctx.save();
      ctx.translate(b.x, y);
      ctx.rotate(Math.sin(t * 1.1 + b.ph) * 0.35 + (b.dir > 0 ? 0.1 : -0.1));
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.scale(sx * flap, 1);
        ctx.fillStyle = b.col[0];
        ctx.beginPath();
        ctx.ellipse(b.size * 0.55, -b.size * 0.4, b.size * 0.6, b.size * 0.8, -0.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = b.col[1];
        ctx.beginPath();
        ctx.ellipse(b.size * 0.4, b.size * 0.4, b.size * 0.4, b.size * 0.5, 0.4, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#2b2336';
      ctx.fillRect(-1.3, -b.size * 0.5, 2.6, b.size * 1.1);
      ctx.restore();
    }
  });
}

/* ------------------------------ balloons ------------------------------ */

export function balloons(_w: number, _h: number, o: SceneOpts, cfg: { n: number; colors: string[] }): Scene {
  const r = rng(321);
  const n = Math.max(3, Math.round(cfg.n * Math.max(0.6, o.count)));
  const items = Array.from({ length: n }, () => ({
    x01: r(), y01: r(), v: 24 + r() * 30, size: 30 + r() * 26, col: pickFrom(r, cfg.colors), ph: r() * TAU,
  }));
  return make((ctx, cw, ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    const per = ch + 220;
    for (const b of items) {
      const y = ch + 110 - ((((1 - b.y01) * per + b.v * t) % per) + per) % per;
      const x = b.x01 * cw + Math.sin(t * 0.7 + b.ph) * 22;
      const s = b.size;
      ctx.strokeStyle = 'rgba(235,235,245,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 1.2);
      ctx.quadraticCurveTo(x + Math.sin(t * 1.4 + b.ph) * 8, y + s * 2, x + Math.sin(t * 0.9 + b.ph) * 4, y + s * 2.9);
      ctx.stroke();
      const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.35, s * 0.1, x, y, s * 1.2);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.25, b.col);
      g.addColorStop(1, b.col);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, s * 0.82, s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + s * 1.12);
      ctx.lineTo(x + 4, y + s * 1.12);
      ctx.lineTo(x, y + s * 0.98);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(x - s * 0.3, y - s * 0.4, s * 0.14, s * 0.26, -0.5, 0, TAU);
      ctx.fill();
    }
  });
}

/* ------------------------------ fireflies ------------------------------ */

export function fireflies(w: number, h: number, o: SceneOpts, cfg: { n: number; rgb?: string; region?: [number, number] }): Scene {
  const r = rng(331);
  const reg = cfg.region ?? [0.3, 1];
  const items = Array.from({ length: Math.round(cfg.n * o.count) }, () => ({
    x: r() * w, y: h * lerp(reg[0], reg[1], r()), ph: r() * TAU, s: 8 + r() * 10, a: 20 + r() * 40, f: 0.2 + r() * 0.4, p: 1.5 + r() * 2.5,
  }));
  let q = 1;
  return make((ctx, _cw, _ch, dpr, _dt, t) => {
    ctx.globalCompositeOperation = 'lighter';
    const n = Math.floor(items.length * q);
    for (let i = 0; i < n; i++) {
      const f = items[i];
      const x = f.x + Math.sin(t * f.f + f.ph) * f.a + Math.sin(t * f.f * 2.3 + f.ph * 2) * f.a * 0.4;
      const y = f.y + Math.cos(t * f.f * 0.8 + f.ph) * f.a * 0.7;
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * f.p + f.ph), 2);
      blit(ctx, glow(cfg.rgb ?? '210,255,120', 48), x, y, f.s * (1.4 + pulse), 0, 1, 0.25 + 0.7 * pulse, dpr);
      blit(ctx, glow('255,255,230', 32), x, y, f.s * 0.35, 0, 1, 0.4 + 0.6 * pulse, dpr);
    }
  }, (v) => { q = v; });
}

/* ------------------------------ shooting stars ------------------------------ */

export function shootingStars(w: number, h: number, _o: SceneOpts, cfg: { every?: [number, number] } = {}): Scene {
  const r = rng(341);
  const [e0, e1] = cfg.every ?? [2.5, 6];
  const stars: Array<{ x: number; y: number; vx: number; vy: number; age: number; life: number; len: number }> = [];
  let wait = 1.2;
  return make((ctx, cw, ch, dpr, dt) => {
    wait -= dt;
    if (wait <= 0) {
      const ang = 0.35 + r() * 0.4;
      const sp = 700 + r() * 500;
      stars.push({ x: cw * (0.1 + 0.8 * r()), y: ch * (0.02 + 0.3 * r()), vx: Math.cos(ang) * sp * (r() < 0.5 ? 1 : -1), vy: Math.sin(ang) * sp, age: 0, life: 0.7 + r() * 0.5, len: 0.12 + r() * 0.08 });
      wait = lerp(e0, e1, r());
    }
    reset(ctx, dpr);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.age += dt;
      if (s.age > s.life) { stars.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const u = 1 - s.age / s.life;
      const tx = s.x - s.vx * s.len;
      const ty = s.y - s.vy * s.len;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,' + u + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      blit(ctx, glow('255,255,255', 32), s.x, s.y, 16, 0, 1, u, dpr);
      reset(ctx, dpr);
      ctx.globalCompositeOperation = 'lighter';
    }
    void w;
    void h;
  });
}

/* ------------------------------ spotlights ------------------------------ */

/** Sweeping coloured stage beams from the bottom of the screen. */
export function spotlights(w: number, h: number, _o: SceneOpts, cfg: { colors: string[]; n?: number }): Scene {
  const n = cfg.n ?? 4;
  return make((ctx, cw, ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const sx = ((i + 0.5) / n) * cw;
      const ang = Math.sin(t * (0.5 + i * 0.11) + i * 1.9) * 0.55 + (i % 2 ? 0.12 : -0.12);
      const len = ch * 1.15;
      const half = 0.11 + 0.03 * Math.sin(t * 0.9 + i);
      const tipL = { x: sx + Math.sin(ang - half) * len, y: ch - Math.cos(ang - half) * len };
      const tipR = { x: sx + Math.sin(ang + half) * len, y: ch - Math.cos(ang + half) * len };
      const g = ctx.createLinearGradient(sx, ch, sx + Math.sin(ang) * len, ch - Math.cos(ang) * len);
      const rgb = cfg.colors[i % cfg.colors.length];
      g.addColorStop(0, 'rgba(' + rgb + ',0.38)');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, ch + 6);
      ctx.lineTo(tipL.x, tipL.y);
      ctx.lineTo(tipR.x, tipR.y);
      ctx.closePath();
      ctx.fill();
    }
    void w;
    void h;
  });
}

/* ------------------------------ holi colour jets ------------------------------ */

/** Pichkari-style jets of colour arcing in from the sides, plus bursts of splashing droplets. */
export function colorJets(_w: number, _h: number, o: SceneOpts, cfg: { colors: string[] }): Scene {
  const r = rng(351);
  interface Drop { x: number; y: number; vx: number; vy: number; age: number; life: number; rgb: string; s: number }
  const drops: Drop[] = [];
  const jets: Array<{ x: number; dir: 1 | -1; rgb: string; age: number; dur: number; acc: number }> = [];
  let wait = 0.5;
  let q = 1;
  return make((ctx, cw, ch, dpr, dt) => {
    wait -= dt;
    if (wait <= 0 && jets.length < 3) {
      const dir = r() < 0.5 ? 1 : -1;
      jets.push({ x: dir === 1 ? -10 : cw + 10, dir, rgb: pickFrom(r, cfg.colors), age: 0, dur: 1 + r() * 0.9, acc: 0 });
      wait = (0.9 + r() * 1.4) / Math.max(0.6, o.count);
    }
    for (let i = jets.length - 1; i >= 0; i--) {
      const j = jets[i];
      j.age += dt;
      if (j.age > j.dur) { jets.splice(i, 1); continue; }
      j.acc += dt * 120 * o.count * q;
      const baseY = ch * 0.78;
      while (j.acc >= 1) {
        j.acc -= 1;
        const ang = (0.55 + r() * 0.22) * Math.PI * 0.5;
        const sp = 620 + r() * 260;
        if (drops.length < 360) drops.push({ x: j.x, y: baseY, vx: j.dir * Math.cos(ang) * sp, vy: -Math.sin(ang) * sp, age: 0, life: 1 + r() * 0.5, rgb: j.rgb, s: 10 + r() * 12 });
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age += dt;
      if (d.age >= d.life || d.y > ch + 20) {
        // a landing splash blooms where the droplet fell
        if (d.y > ch * 0.55 && d.age < d.life && drops.length < 340) {
          for (let k = 0; k < 3; k++) drops.push({ x: d.x, y: Math.min(d.y, ch), vx: (r() - 0.5) * 160, vy: -60 - r() * 140, age: 0, life: 0.5, rgb: d.rgb, s: 8 + r() * 8 });
        }
        drops[i] = drops[drops.length - 1];
        drops.pop();
        continue;
      }
      d.vy += 720 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const u = 1 - d.age / d.life;
      blit(ctx, glow(d.rgb, 48), d.x, d.y, d.s * (0.6 + 0.6 * u), 0, 1, Math.min(0.85, u * 1.2), dpr);
    }
  }, (v) => { q = v; });
}

/* ------------------------------ santa's sleigh ------------------------------ */

/** Santa's sleigh and reindeer crossing the sky on a gentle arc, trailing sparkles. */
export function sleigh(w: number, h: number, o: SceneOpts): Scene {
  const r = rng(361);
  const sparks: Array<{ x: number; y: number; vx: number; vy: number; age: number; life: number; s: number }> = [];
  const sc = Math.min(1.3, Math.max(0.78, w / 1100));
  const PERIOD = 16;

  const antler = (ctx: CanvasRenderingContext2D, x: number, y: number, flip: number) => {
    ctx.strokeStyle = '#d9b983';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + flip * 4, y - 14, x + flip * 2, y - 26);
    ctx.moveTo(x + flip * 3, y - 12);
    ctx.lineTo(x + flip * 11, y - 18);
    ctx.moveTo(x + flip * 2, y - 22);
    ctx.lineTo(x - flip * 5, y - 30);
    ctx.moveTo(x + flip * 2, y - 26);
    ctx.lineTo(x + flip * 9, y - 32);
    ctx.stroke();
  };

  /** One galloping reindeer facing right, centred on (x, y) = middle of the body. */
  const deer = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, ph: number, rudolph: boolean) => {
    const g = t * 9 + ph;
    ctx.save();
    ctx.translate(x, y + Math.sin(g) * 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // legs: thigh + shin with a gallop swing; far legs darker
    const leg = (hx: number, phase: number, far: boolean) => {
      const a = Math.sin(g + phase);
      const knee = { x: hx + a * 9 + 3, y: 15 };
      const hoof = { x: hx + a * 14 - Math.max(0, -a) * 4, y: 29 - Math.max(0, a) * 7 };
      ctx.strokeStyle = far ? '#4e2c14' : '#6e4220';
      ctx.lineWidth = far ? 4 : 4.6;
      ctx.beginPath();
      ctx.moveTo(hx, 6);
      ctx.lineTo(knee.x, knee.y);
      ctx.lineTo(hoof.x, hoof.y);
      ctx.stroke();
      ctx.fillStyle = '#25140a';
      ctx.beginPath();
      ctx.ellipse(hoof.x + 1, hoof.y + 1, 3.6, 2.4, 0, 0, TAU);
      ctx.fill();
    };
    leg(-15, 0, true);
    leg(15, Math.PI * 0.9, true);
    // tail
    ctx.fillStyle = '#fbf3e6';
    ctx.beginPath();
    ctx.ellipse(-25, -3, 5, 4, -0.5, 0, TAU);
    ctx.fill();
    // body with a pale belly
    const body = ctx.createLinearGradient(0, -12, 0, 14);
    body.addColorStop(0, '#8b5428');
    body.addColorStop(0.65, '#744520');
    body.addColorStop(1, '#d9bd96');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 1, 26, 12, 0, 0, TAU);
    ctx.fill();
    // neck, head, muzzle
    ctx.fillStyle = '#7d4a24';
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.quadraticCurveTo(24, -22, 34, -26);
    ctx.lineTo(40, -17);
    ctx.quadraticCurveTo(28, -8, 20, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(38, -24, 9, 6.5, 0.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8cfa8';
    ctx.beginPath();
    ctx.ellipse(46, -21, 5, 4, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rudolph ? '#ff2d20' : '#1e1410';
    ctx.beginPath();
    ctx.arc(50, -21, rudolph ? 3.6 : 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1e1410';
    ctx.beginPath();
    ctx.arc(39, -26, 1.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#6a3d1c';
    ctx.beginPath();
    ctx.ellipse(31, -31, 3, 6, -0.5, 0, TAU);
    ctx.fill();
    antler(ctx, 35, -30, 1);
    antler(ctx, 31, -30, -1);
    if (rudolph) {
      const gl = ctx.createRadialGradient(50, -21, 0, 50, -21, 16);
      gl.addColorStop(0, 'rgba(255,70,50,0.85)');
      gl.addColorStop(1, 'rgba(255,70,50,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(50, -21, 16, 0, TAU);
      ctx.fill();
    }
    // harness
    ctx.strokeStyle = '#b8201f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(18, 8);
    ctx.stroke();
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.arc(14, -1, 2.6, 0, TAU);
    ctx.fill();
    leg(-9, Math.PI, false);
    leg(21, Math.PI * 0.1, false);
    ctx.restore();
  };

  const gift = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, box: string, ribbon: string) => {
    ctx.fillStyle = box;
    ctx.fillRect(x, y, s, s * 0.9);
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, y + s * 0.62, s, s * 0.28);
    ctx.fillStyle = ribbon;
    ctx.fillRect(x + s * 0.43, y, s * 0.14, s * 0.9);
    ctx.fillRect(x, y + s * 0.36, s, s * 0.14);
    ctx.beginPath();
    ctx.ellipse(x + s * 0.36, y - 2, s * 0.17, s * 0.1, -0.5, 0, TAU);
    ctx.ellipse(x + s * 0.64, y - 2, s * 0.17, s * 0.1, 0.5, 0, TAU);
    ctx.fill();
  };

  const santa = (ctx: CanvasRenderingContext2D, t: number) => {
    const bob = Math.sin(t * 3) * 1.2;
    ctx.save();
    ctx.translate(0, bob);
    // coat
    const coat = ctx.createLinearGradient(-130, -52, -94, -4);
    coat.addColorStop(0, '#ee2b34');
    coat.addColorStop(1, '#b0161f');
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.moveTo(-134, -2);
    ctx.quadraticCurveTo(-138, -40, -118, -52);
    ctx.quadraticCurveTo(-96, -56, -90, -34);
    ctx.lineTo(-90, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-115, -50, 6, 46);
    ctx.fillStyle = '#17110f';
    ctx.fillRect(-136, -22, 46, 8);
    ctx.fillStyle = '#f5c542';
    ctx.fillRect(-117, -23, 11, 10);
    ctx.fillStyle = '#17110f';
    ctx.fillRect(-114, -20, 5, 4);
    // arm holding the reins
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d3222b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-98, -42);
    ctx.quadraticCurveTo(-84, -36, -72, -30);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-76, -31, 6, 7.5, 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#17110f';
    ctx.beginPath();
    ctx.arc(-70, -29, 5.5, 0, TAU);
    ctx.fill();
    // head
    ctx.fillStyle = '#f5c7a0';
    ctx.beginPath();
    ctx.arc(-112, -66, 12.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,120,120,0.55)';
    ctx.beginPath();
    ctx.arc(-106, -62, 3.6, 0, TAU);
    ctx.arc(-118, -62, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1b1620';
    ctx.beginPath();
    ctx.arc(-107, -69, 1.6, 0, TAU);
    ctx.arc(-117, -69, 1.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e99a8a';
    ctx.beginPath();
    ctx.ellipse(-112, -64, 3, 2.6, 0, 0, TAU);
    ctx.fill();
    // beard, moustache and brows
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-124, -64);
    ctx.quadraticCurveTo(-130, -40, -112, -34);
    ctx.quadraticCurveTo(-94, -40, -100, -64);
    ctx.quadraticCurveTo(-106, -56, -112, -56);
    ctx.quadraticCurveTo(-118, -56, -124, -64);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-116, -60, 5.5, 3, 0.25, 0, TAU);
    ctx.ellipse(-108, -60, 5.5, 3, -0.25, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-117, -73, 4, 1.8, 0.2, 0, TAU);
    ctx.ellipse(-107, -73, 4, 1.8, -0.2, 0, TAU);
    ctx.fill();
    // hat with fur brim and a swinging pompom
    ctx.fillStyle = '#d3222b';
    ctx.beginPath();
    ctx.moveTo(-125, -74);
    ctx.quadraticCurveTo(-122, -96, -100, -97);
    ctx.quadraticCurveTo(-90 + Math.sin(t * 5) * 3, -96, -86 + Math.sin(t * 5) * 4, -84);
    ctx.quadraticCurveTo(-98, -90, -99, -75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-112, -75, 15, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-86 + Math.sin(t * 5) * 4, -84, 5, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  return make((ctx, cw, ch, dpr, dt, t) => {
    const u = (t % PERIOD) / PERIOD;
    // crosses during the first 55% of each cycle, then rests off-screen
    const run = u / 0.55;
    if (run <= 1) {
      const x = lerp(-300 * sc, cw + 300 * sc, run);
      const y = Math.max(ch * 0.3, 125 * sc) - Math.sin(run * Math.PI) * ch * 0.08 + Math.sin(t * 2) * 5;
      const tilt = -0.16 * Math.cos(run * Math.PI) + Math.sin(t * 2) * 0.02;
      if (sparks.length < 150) for (let i = 0; i < Math.ceil(2 * o.count); i++) sparks.push({ x: x - 210 * sc + r() * 40, y: y + 10 + r() * 24, vx: -20 - r() * 30, vy: 10 + r() * 30, age: 0, life: 1 + r() * 0.8, s: 8 + r() * 10 });
      reset(ctx, dpr);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.scale(sc, sc);
      // reins from Santa's hand to each reindeer
      ctx.strokeStyle = 'rgba(255,215,120,0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-70, -29);
      ctx.quadraticCurveTo(0, -16, 38, -8);
      ctx.moveTo(-70, -29);
      ctx.quadraticCurveTo(40, -10, 96, -6);
      ctx.moveTo(-70, -29);
      ctx.quadraticCurveTo(70, -8, 152, -4);
      ctx.stroke();
      deer(ctx, 164, 8, t, 0, true);
      deer(ctx, 108, 12, t, 1.3, false);
      deer(ctx, 52, 16, t, 2.6, false);
      // gifts and sack heaped behind Santa
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.ellipse(-176, -34, 20, 24, -0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#6b4220';
      ctx.fillRect(-184, -58, 14, 6);
      gift(ctx, -194, -22, 22, '#2f9e5a', '#f5c542');
      gift(ctx, -170, -26, 18, '#3b6fe0', '#ffffff');
      gift(ctx, -152, -22, 20, '#a24ad1', '#f5c542');
      santa(ctx, t);
      // sleigh body (in front of Santa's lap) with gold scroll trim
      const bodyG = ctx.createLinearGradient(0, -14, 0, 24);
      bodyG.addColorStop(0, '#d3222b');
      bodyG.addColorStop(1, '#8e1018');
      ctx.fillStyle = bodyG;
      ctx.beginPath();
      ctx.moveTo(-204, -12);
      ctx.lineTo(-66, -12);
      ctx.bezierCurveTo(-44, -12, -36, -30, -50, -40);
      ctx.bezierCurveTo(-56, -26, -62, -22, -70, 2);
      ctx.bezierCurveTo(-90, 24, -178, 28, -200, 6);
      ctx.bezierCurveTo(-206, -2, -208, -8, -204, -12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f5c542';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(-204, -12);
      ctx.lineTo(-66, -12);
      ctx.bezierCurveTo(-44, -12, -36, -30, -50, -40);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-190, 4);
      ctx.bezierCurveTo(-160, 14, -110, 14, -78, 0);
      ctx.stroke();
      ctx.beginPath();
      for (let k = 0; k < 5; k++) { ctx.moveTo(-176 + k * 24, 0); ctx.arc(-170 + k * 24, 0, 5, Math.PI, 0); }
      ctx.stroke();
      // runners
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-214, 30);
      ctx.bezierCurveTo(-212, 38, -60, 44, -46, 30);
      ctx.bezierCurveTo(-32, 16, -30, 6, -40, -2);
      ctx.stroke();
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-176, 26); ctx.lineTo(-176, 40);
      ctx.moveTo(-104, 28); ctx.lineTo(-104, 42);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt;
      if (s.age > s.life) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = 1 - s.age / s.life;
      blit(ctx, glow(i % 2 ? '255,236,170' : '190,220,255', 32), s.x, s.y, s.s * (0.5 + k), 0, 1, k * 0.9, dpr);
    }
    void h;
  });
}

/* ------------------------------ river lanterns ------------------------------ */

/** Lotus lanterns drifting along a gently rolling river at the bottom of the screen. */
export function riverLanterns(_w: number, h: number, o: SceneOpts, cfg: { n: number; spr: Sprite }): Scene {
  const r = rng(371);
  const n = Math.max(4, Math.round(cfg.n * Math.max(0.7, o.count)));
  const items = Array.from({ length: n }, (_, i) => ({ x01: (i + r() * 0.8) / n, row: Math.floor(r() * 3), v: 0.012 + r() * 0.012, size: 36 + r() * 26, ph: r() * TAU }));
  return make((ctx, cw, ch, dpr, _dt, t) => {
    reset(ctx, dpr);
    for (let b = 0; b < 3; b++) {
      const base = ch * (0.8 + b * 0.07);
      ctx.beginPath();
      ctx.moveTo(0, ch);
      for (let x = 0; x <= cw + 16; x += 16) ctx.lineTo(x, base + Math.sin(x * 0.012 + t * (0.8 + b * 0.2) + b * 2) * (5 + b * 2));
      ctx.lineTo(cw + 16, ch);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + (b === 0 ? '60,20,70' : b === 1 ? '45,15,60' : '30,10,45') + ',' + (0.45 + b * 0.12) + ')';
      ctx.fill();
    }
    for (const l of items) {
      const x = (((l.x01 + l.v * t) % 1.2) - 0.1) * cw;
      const y = ch * (0.8 + l.row * 0.07) + Math.sin(x * 0.012 + t * (0.8 + l.row * 0.2) + l.row * 2) * (5 + l.row * 2) - l.size * 0.25;
      ctx.globalCompositeOperation = 'lighter';
      blit(ctx, glow('255,150,170', 48), x, y, l.size * 2, 0, 1, 0.4 + 0.12 * Math.sin(t * 2 + l.ph), dpr);
      ctx.globalCompositeOperation = 'source-over';
      blit(ctx, cfg.spr, x, y, l.size, Math.sin(t * 1.2 + l.ph) * 0.08, 1, 1, dpr);
      reset(ctx, dpr);
      ctx.fillStyle = 'rgba(255,170,190,0.18)';
      ctx.beginPath();
      ctx.ellipse(x, y + l.size * 0.45, l.size * 0.7, l.size * 0.1, 0, 0, TAU);
      ctx.fill();
    }
    void h;
  });
}

/** Gentle wind-tossed drift used to nudge things like cut kites. */
export const gust = wind;
