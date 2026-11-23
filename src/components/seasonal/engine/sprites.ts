/**
 * Procedural sprite factory. Every petal, leaf, snowflake, cloud and fog bank is drawn once into a small
 * offscreen canvas (vector paths with gradients, veins and highlights) and then blitted thousands of times —
 * real shapes with zero network downloads, so it works the same in browsers and the Capacitor Android WebView.
 */

export type Sprite = HTMLCanvasElement;

const TAU = Math.PI * 2;

function mk(w: number, h: number): [Sprite, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

/** Deterministic PRNG so sprites (and therefore the look) are identical on every device. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const S = 96;

/* ------------------------------ spring ------------------------------ */

function petalPath(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.moveTo(0, 40);
  g.bezierCurveTo(30, 22, 36, -16, 17, -33);
  g.quadraticCurveTo(8, -41, 0, -27); // the notch every cherry-blossom petal has
  g.quadraticCurveTo(-8, -41, -17, -33);
  g.bezierCurveTo(-36, -16, -30, 22, 0, 40);
  g.closePath();
}

export function petal(top: string, bottom: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2);
  petalPath(g);
  const grad = g.createLinearGradient(0, -34, 0, 40);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.lineWidth = 1.6;
  g.stroke();
  g.strokeStyle = 'rgba(190,70,110,0.28)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -22);
  g.quadraticCurveTo(2, 4, 0, 32);
  g.stroke();
  return c;
}

export function blossom(petalColor: string, edge: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2);
  for (let i = 0; i < 5; i++) {
    g.save();
    g.rotate((i * TAU) / 5);
    g.translate(0, -15);
    g.scale(0.5, 0.5);
    petalPath(g);
    const grad = g.createRadialGradient(0, 30, 2, 0, 0, 46);
    grad.addColorStop(0, edge);
    grad.addColorStop(1, petalColor);
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 2.4;
    g.stroke();
    g.restore();
  }
  g.fillStyle = '#e0507f';
  g.beginPath();
  g.arc(0, 0, 4, 0, TAU);
  g.fill();
  g.strokeStyle = '#f7d46a';
  g.lineWidth = 1.4;
  for (let i = 0; i < 9; i++) {
    const a = (i * TAU) / 9;
    g.beginPath();
    g.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
    g.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
    g.stroke();
    g.fillStyle = '#f7d46a';
    g.beginPath();
    g.arc(Math.cos(a) * 11.5, Math.sin(a) * 11.5, 1.5, 0, TAU);
    g.fill();
  }
  return c;
}

/* ------------------------------ autumn ------------------------------ */

function leafFill(g: CanvasRenderingContext2D, a: string, b: string, edge: string) {
  const grad = g.createLinearGradient(-30, -36, 30, 36);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  g.fillStyle = grad;
  g.fill();
  g.lineJoin = 'round';
  g.strokeStyle = edge;
  g.lineWidth = 1.6;
  g.stroke();
}

export function mapleLeaf(a: string, b: string, edge: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2 + 4);
  const tips = [-90, -20, 50, 130, 200].map((d) => (d * Math.PI) / 180);
  const reach = [40, 33, 22, 22, 33];
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const t = tips[i];
    const nt = tips[(i + 1) % 5] + (i === 4 ? TAU : 0);
    const valley = (t + nt) / 2;
    // each lobe: a pointed tip flanked by two small teeth
    for (const [da, r] of [[-0.28, reach[i] * 0.62], [-0.1, reach[i] * 0.78], [0, reach[i]], [0.1, reach[i] * 0.78], [0.28, reach[i] * 0.62]] as const) {
      const ang = t + da;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0 && da === -0.28) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.lineTo(Math.cos(valley) * 10, Math.sin(valley) * 10);
  }
  g.closePath();
  leafFill(g, a, b, edge);
  g.strokeStyle = 'rgba(70,30,10,0.45)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(0, 2);
    g.lineTo(Math.cos(tips[i]) * reach[i] * 0.85, Math.sin(tips[i]) * reach[i] * 0.85);
    g.stroke();
  }
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(0, 2);
  g.lineTo(2, 44);
  g.stroke();
  return c;
}

export function oakLeaf(a: string, b: string, edge: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2);
  const N = 22;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const w = Math.pow(Math.sin(Math.PI * t), 0.75) * (15 + 5.5 * Math.sin(t * Math.PI * 7));
    const y = -38 + t * 76;
    if (i === 0) g.moveTo(w, y);
    else g.lineTo(w, y);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    const w = Math.pow(Math.sin(Math.PI * t), 0.75) * (15 + 5.5 * Math.sin(t * Math.PI * 7));
    g.lineTo(-w, -38 + t * 76);
  }
  g.closePath();
  leafFill(g, a, b, edge);
  g.strokeStyle = 'rgba(70,35,10,0.45)';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(0, -36);
  g.lineTo(0, 42);
  for (let i = 1; i < 6; i++) {
    const y = -30 + i * 11;
    g.moveTo(0, y);
    g.lineTo(13, y - 7);
    g.moveTo(0, y);
    g.lineTo(-13, y - 7);
  }
  g.stroke();
  return c;
}

export function ovateLeaf(a: string, b: string, edge: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2);
  const N = 26;
  const half = (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.9) * (23 - 6 * t) + Math.sin(t * 70) * 0.9;
  g.beginPath();
  for (let i = 0; i <= N; i++) g.lineTo(half(i / N), -40 + (i / N) * 80);
  for (let i = N; i >= 0; i--) g.lineTo(-half(i / N), -40 + (i / N) * 80);
  g.closePath();
  leafFill(g, a, b, edge);
  g.strokeStyle = 'rgba(80,40,10,0.4)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, -38);
  g.lineTo(0, 44);
  for (let i = 1; i < 7; i++) {
    const y = -34 + i * 10;
    g.moveTo(0, y + 4);
    g.lineTo(14, y - 6);
    g.moveTo(0, y + 4);
    g.lineTo(-14, y - 6);
  }
  g.stroke();
  return c;
}

/* ------------------------------ winter / frost ------------------------------ */

export function crystal(kind: 0 | 1 | 2, color: string, glow: string): Sprite {
  const [c, g] = mk(S, S);
  g.translate(S / 2, S / 2);
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineCap = 'round';
  g.shadowColor = glow;
  g.shadowBlur = 8;
  const R = 38;
  if (kind === 2) {
    g.lineWidth = 2.6;
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      g.lineTo(Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62);
    }
    g.closePath();
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    g.save();
    g.rotate((i * TAU) / 6);
    g.lineWidth = kind === 1 ? 3.4 : 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -R);
    g.stroke();
    g.lineWidth = 2.2;
    const branches: Array<[number, number]> = kind === 0 ? [[0.45, 0.3], [0.72, 0.22]] : kind === 1 ? [[0.55, 0.34]] : [[0.3, 0.2]];
    for (const [at, len] of branches) {
      g.beginPath();
      g.moveTo(0, -R * at);
      g.lineTo(Math.sin(Math.PI / 3) * R * len, -R * at - Math.cos(Math.PI / 3) * R * len);
      g.moveTo(0, -R * at);
      g.lineTo(-Math.sin(Math.PI / 3) * R * len, -R * at - Math.cos(Math.PI / 3) * R * len);
      g.stroke();
    }
    if (kind === 1) {
      g.beginPath();
      g.moveTo(0, -R);
      g.lineTo(4, -R + 8);
      g.lineTo(0, -R + 14);
      g.lineTo(-4, -R + 8);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  return c;
}

/** Soft radial dot — far snow, bokeh, pollen, frost haze. */
export function soft(color: string, edge = 'rgba(255,255,255,0)', size = 64): Sprite {
  const [c, g] = mk(size, size);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.45, color);
  grad.addColorStop(1, edge);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/** Four-point glint for frost sparkle. */
export function glint(color: string): Sprite {
  const [c, g] = mk(64, 64);
  g.translate(32, 32);
  g.fillStyle = color;
  g.shadowColor = color;
  g.shadowBlur = 10;
  g.beginPath();
  g.moveTo(0, -28);
  g.quadraticCurveTo(2, -2, 28, 0);
  g.quadraticCurveTo(2, 2, 0, 28);
  g.quadraticCurveTo(-2, 2, -28, 0);
  g.quadraticCurveTo(-2, -2, 0, -28);
  g.fill();
  return c;
}

/* ------------------------------ atmosphere ------------------------------ */

/** Billowing cloud built from many overlapping soft puffs. */
export function cloud(seed: number, core: string, rim: string): Sprite {
  const W = 400;
  const H = 200;
  const [c, g] = mk(W, H);
  const r = rng(seed);
  const puffs = 24;
  g.globalAlpha = 0.5;
  for (let i = 0; i < puffs; i++) {
    const t = i / (puffs - 1);
    const rad = 34 + r() * 30 + Math.sin(t * Math.PI) * 26;
    const x = rad + 4 + t * (W - 2 * rad - 8);
    const y = Math.min(H - rad - 4, Math.max(rad + 4, H * 0.58 + (r() - 0.5) * 40 - Math.sin(t * Math.PI) * 30));
    const grad = g.createRadialGradient(x, y - rad * 0.2, rad * 0.1, x, y, rad);
    grad.addColorStop(0, core);
    grad.addColorStop(1, rim);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, rad, 0, TAU);
    g.fill();
  }
  return c;
}

/** Wide, low fog bank. */
export function fogBank(seed: number, color: string): Sprite {
  const W = 640;
  const H = 240;
  const [c, g] = mk(W, H);
  const r = rng(seed);
  for (let i = 0; i < 14; i++) {
    const x = 80 + r() * (W - 160);
    const y = H * 0.5 + (r() - 0.5) * 50;
    const ry = 30 + r() * 34;
    const rx = Math.min(80 + r() * 120, x - 2, W - x - 2);
    g.save();
    g.translate(x, y);
    g.scale(1, ry / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, rx, 0, TAU);
    g.fill();
    g.restore();
  }
  return c;
}

/** Fan of sun rays radiating from the centre; rotated and scaled at draw time. */
export function sunRays(seed: number, warm: string): Sprite {
  const N = 512;
  const [c, g] = mk(N, N);
  const r = rng(seed);
  g.translate(N / 2, N / 2);
  const fade = g.createRadialGradient(0, 0, 10, 0, 0, N / 2);
  fade.addColorStop(0, warm);
  fade.addColorStop(1, 'rgba(255,230,150,0)');
  g.fillStyle = fade;
  const count = 26;
  g.globalAlpha = 0.34;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + (r() - 0.5) * 0.12;
    const w0 = 0.01 + r() * 0.03;
    for (const k of [1.9, 1.3, 0.8, 0.4]) {
      const w = w0 * k;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a - w) * N, Math.sin(a - w) * N);
      g.lineTo(Math.cos(a + w) * N, Math.sin(a + w) * N);
      g.closePath();
      g.fill();
    }
  }
  return c;
}
