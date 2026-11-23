/** Procedural sprites for the festival scenes (drawn once, blitted many times — no downloads). */
import { soft, type Sprite } from './sprites';

const TAU = Math.PI * 2;

function mk(w: number, h: number): [Sprite, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

/** Rounded-rect path that works on every WebView (CanvasRenderingContext2D.roundRect needs Chrome 99+). */
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const glowCache = new Map<string, Sprite>();
/** Cached soft additive glow in an "r,g,b" colour. */
export function glow(rgb: string, size = 48): Sprite {
  const key = `${rgb}|${size}`;
  let s = glowCache.get(key);
  if (!s) {
    s = soft(`rgba(${rgb},1)`, `rgba(${rgb},0)`, size);
    glowCache.set(key, s);
  }
  return s;
}

/** Hanging pennant flag. */
export function pennant(color: string, edge = 'rgba(255,255,255,0.35)'): Sprite {
  const [c, g] = mk(96, 96);
  g.beginPath();
  g.moveTo(8, 6);
  g.lineTo(88, 6);
  g.lineTo(48, 90);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = edge;
  g.lineWidth = 3;
  g.stroke();
  return c;
}

/** Papel picado: a paper banner with a zig-zag edge and punched-out patterns. */
export function papel(color: string): Sprite {
  const [c, g] = mk(96, 80);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(6, 4);
  g.lineTo(90, 4);
  g.lineTo(90, 62);
  for (let i = 0; i < 6; i++) {
    g.lineTo(90 - i * 14 - 7, 76);
    g.lineTo(90 - (i + 1) * 14, 62);
  }
  g.closePath();
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 16 + i * 16;
      const y = 22 + row * 20;
      g.beginPath();
      g.moveTo(x, y - 7);
      g.lineTo(x + 6, y);
      g.lineTo(x, y + 7);
      g.lineTo(x - 6, y);
      g.closePath();
      g.fill();
    }
  }
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.arc(12 + i * 10.5, 10, 2.2, 0, TAU);
    g.fill();
  }
  return c;
}

/** Chinese paper lantern (or an Eid fanous when `fanous`). */
export function lantern(body: string, glowCol: string, fanous = false): Sprite {
  const [c, g] = mk(96, 128);
  g.translate(48, 0);
  g.fillStyle = '#e3b341';
  if (!fanous) {
    g.fillRect(-18, 6, 36, 10);
    const grad = g.createRadialGradient(0, 62, 6, 0, 62, 46);
    grad.addColorStop(0, glowCol);
    grad.addColorStop(1, body);
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(0, 64, 40, 44, 0, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(120,10,10,0.45)';
    g.lineWidth = 1.6;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.ellipse(0, 64, Math.abs(k) * 13.3 + 0.1, 44, 0, 0, TAU);
      g.stroke();
    }
    g.fillStyle = '#e3b341';
    g.fillRect(-18, 106, 36, 10);
    g.strokeStyle = '#e3b341';
    g.lineWidth = 2.4;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(k * 4, 116);
      g.lineTo(k * 5, 126);
      g.stroke();
    }
  } else {
    // dome
    g.beginPath();
    g.moveTo(-22, 26);
    g.quadraticCurveTo(0, -8, 22, 26);
    g.closePath();
    g.fill();
    g.fillRect(-3, 0, 6, 8);
    // glass body
    const grad = g.createLinearGradient(0, 28, 0, 104);
    grad.addColorStop(0, glowCol);
    grad.addColorStop(1, body);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(-24, 28);
    g.lineTo(24, 28);
    g.lineTo(32, 100);
    g.lineTo(-32, 100);
    g.closePath();
    g.fill();
    g.strokeStyle = '#e3b341';
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.moveTo(0, 28);
    g.lineTo(0, 100);
    g.moveTo(-14, 28);
    g.lineTo(-18, 100);
    g.moveTo(14, 28);
    g.lineTo(18, 100);
    g.stroke();
    g.fillStyle = '#e3b341';
    g.fillRect(-34, 100, 68, 8);
    g.beginPath();
    g.moveTo(-14, 108);
    g.lineTo(14, 108);
    g.lineTo(0, 124);
    g.closePath();
    g.fill();
  }
  return c;
}

/** Glowing paper sky lantern. */
export function skyLantern(): Sprite {
  const [c, g] = mk(64, 80);
  const grad = g.createLinearGradient(0, 6, 0, 70);
  grad.addColorStop(0, '#ffcf70');
  grad.addColorStop(0.7, '#ff9a3c');
  grad.addColorStop(1, '#c4521a');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(14, 6);
  g.lineTo(50, 6);
  g.lineTo(56, 68);
  g.lineTo(8, 68);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(120,40,10,0.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(32, 6);
  g.lineTo(32, 68);
  g.moveTo(23, 6);
  g.lineTo(20, 68);
  g.moveTo(41, 6);
  g.lineTo(44, 68);
  g.stroke();
  g.fillStyle = '#ffe9a8';
  g.beginPath();
  g.ellipse(32, 70, 10, 5, 0, 0, TAU);
  g.fill();
  return c;
}

export function flame(): Sprite {
  const [c, g] = mk(48, 96);
  const grad = g.createRadialGradient(24, 66, 2, 24, 62, 38);
  grad.addColorStop(0, '#fffbe0');
  grad.addColorStop(0.35, '#ffc23a');
  grad.addColorStop(0.75, '#ff6a1a');
  grad.addColorStop(1, 'rgba(255,60,10,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(24, 2);
  g.bezierCurveTo(30, 28, 44, 44, 44, 66);
  g.bezierCurveTo(44, 84, 34, 94, 24, 94);
  g.bezierCurveTo(14, 94, 4, 84, 4, 66);
  g.bezierCurveTo(4, 44, 18, 30, 24, 2);
  g.fill();
  return c;
}

export function diyaBowl(): Sprite {
  const [c, g] = mk(96, 48);
  const grad = g.createLinearGradient(0, 12, 0, 46);
  grad.addColorStop(0, '#e2833a');
  grad.addColorStop(1, '#8d3d12');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(48, 14, 42, 30, 0, 0, Math.PI);
  g.closePath();
  g.fill();
  g.fillStyle = '#5a230a';
  g.beginPath();
  g.ellipse(48, 14, 42, 7, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#ffb347';
  g.beginPath();
  g.ellipse(48, 14, 36, 4.5, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#f7c948';
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.arc(18 + i * 10, 28 + Math.sin((i / 6) * Math.PI) * 6, 1.8, 0, TAU);
    g.fill();
  }
  return c;
}

/** Pumpkin body without a face (the lit face is a separate sprite so it can flicker on its own). */
export function pumpkin(): Sprite {
  const [c, g] = mk(112, 96);
  g.translate(56, 52);
  for (const [dx, rx] of [[-24, 28], [24, 28], [0, 34]] as const) {
    const grad = g.createRadialGradient(dx, -6, 4, dx, 0, 40);
    grad.addColorStop(0, '#ff9c2e');
    grad.addColorStop(1, '#a93c08');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(dx, 0, rx, 36, 0, 0, TAU);
    g.fill();
  }
  g.strokeStyle = 'rgba(80,25,0,0.45)';
  g.lineWidth = 2;
  for (const dx of [-16, 16]) {
    g.beginPath();
    g.ellipse(dx, 0, 14, 35, 0, 0, TAU);
    g.stroke();
  }
  g.fillStyle = '#4b6b1f';
  g.fillRect(-4, -46, 8, 14);
  g.strokeStyle = '#3a5516';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(4, -44);
  g.quadraticCurveTo(18, -52, 22, -42);
  g.stroke();
  return c;
}

/** The carved face: dark cut-outs with a hot inner glow; drawn additively on top of the body. */
export function pumpkinFace(): Sprite {
  const [c, g] = mk(112, 96);
  g.translate(56, 52);
  const shape = () => {
    g.beginPath();
    g.moveTo(-24, -9); g.lineTo(-7, -9); g.lineTo(-16, -24); g.closePath();
    g.moveTo(24, -9); g.lineTo(7, -9); g.lineTo(16, -24); g.closePath();
    g.moveTo(0, -1); g.lineTo(-6, 8); g.lineTo(6, 8); g.closePath();
    g.moveTo(-28, 13);
    for (let i = 0; i <= 8; i++) g.lineTo(-28 + i * 7, i % 2 ? 13 : 26);
    g.lineTo(28, 13);
    g.closePath();
  };
  g.fillStyle = '#2a0c00';
  shape();
  g.fill();
  g.shadowColor = '#ffb020';
  g.shadowBlur = 14;
  g.fillStyle = '#ffe58a';
  g.save();
  g.translate(0, 0);
  g.scale(0.86, 0.86);
  g.translate(0, 1.5);
  shape();
  g.fill();
  g.restore();
  return c;
}

/** Translucent wispy ghost. */
export function ghost(): Sprite {
  const [c, g] = mk(96, 128);
  g.translate(48, 0);
  const grad = g.createLinearGradient(0, 8, 0, 120);
  grad.addColorStop(0, 'rgba(235,245,255,0.95)');
  grad.addColorStop(0.7, 'rgba(200,220,245,0.55)');
  grad.addColorStop(1, 'rgba(200,220,245,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(-30, 52);
  g.bezierCurveTo(-30, 8, 30, 8, 30, 52);
  g.lineTo(30, 100);
  for (let i = 0; i < 4; i++) {
    const x = 30 - (i + 1) * 15;
    g.quadraticCurveTo(30 - i * 15 - 7.5, i % 2 ? 100 : 124, x, 104);
  }
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(20,25,50,0.85)';
  g.beginPath();
  g.ellipse(-11, 46, 6, 9, 0, 0, TAU);
  g.ellipse(11, 46, 6, 9, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, 70, 7, 11, 0, 0, TAU);
  g.fill();
  return c;
}

export function spider(): Sprite {
  const [c, g] = mk(80, 80);
  g.translate(40, 44);
  g.strokeStyle = '#120a18';
  g.lineWidth = 3;
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = -0.55 + k * 0.38;
      const kx = side * (16 + k * 2);
      const ky = -12 + k * 9;
      g.beginPath();
      g.moveTo(side * 6, -2 + k * 3);
      g.quadraticCurveTo(kx + side * 4, ky - 14, kx + side * 10, ky + 8 + Math.sin(a) * 4);
      g.stroke();
    }
  }
  const body = g.createRadialGradient(-4, -6, 2, 0, 0, 20);
  body.addColorStop(0, '#3a2a48');
  body.addColorStop(1, '#0d0612');
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(0, 8, 13, 16, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, -10, 9, 8, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#ff3b30';
  g.shadowColor = '#ff3b30';
  g.shadowBlur = 5;
  for (const x of [-4, 4]) {
    g.beginPath();
    g.arc(x, -12, 2, 0, TAU);
    g.fill();
  }
  g.shadowBlur = 0;
  g.fillStyle = '#c0261c';
  g.beginPath();
  g.moveTo(-3, 4); g.lineTo(0, 12); g.lineTo(3, 4); g.closePath();
  g.fill();
  return c;
}

/** Wing-flap frames: 0 = up, 1 = mid, 2 = down, 3 = mid. */
export function bat(frame: number): Sprite {
  const [c, g] = mk(96, 64);
  g.translate(48, 34);
  const tip = [-26, -10, 14, -10][frame % 4];
  g.fillStyle = '#150b1f';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * 6, -2);
    g.quadraticCurveTo(side * 26, tip - 8, side * 44, tip);
    g.quadraticCurveTo(side * 38, tip + 10, side * 32, tip * 0.4 + 12);
    g.quadraticCurveTo(side * 26, tip * 0.3 + 14, side * 20, tip * 0.2 + 12);
    g.quadraticCurveTo(side * 12, 12, side * 6, 8);
    g.closePath();
    g.fill();
  }
  g.beginPath();
  g.ellipse(0, 2, 7, 11, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(-5, -8); g.lineTo(-7, -17); g.lineTo(-1, -10);
  g.moveTo(5, -8); g.lineTo(7, -17); g.lineTo(1, -10);
  g.fill();
  g.fillStyle = '#ff5d3c';
  g.fillRect(-4, -4, 2, 2);
  g.fillRect(2, -4, 2, 2);
  return c;
}

export function marigold(): Sprite {
  const [c, g] = mk(96, 96);
  g.translate(48, 48);
  const rings: Array<[number, number, string]> = [[38, 14, '#ff9a1f'], [29, 11, '#ffb52e'], [19, 8, '#ffd23f']];
  for (const [r, n, col] of rings) {
    g.fillStyle = col;
    g.strokeStyle = 'rgba(160,70,0,0.35)';
    g.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate((i / n) * TAU + r);
      g.beginPath();
      g.ellipse(0, -r * 0.62, r * 0.3, r * 0.5, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.restore();
    }
  }
  g.fillStyle = '#e07a10';
  g.beginPath();
  g.arc(0, 0, 5, 0, TAU);
  g.fill();
  return c;
}

export function egg(base: string, stripe: string, dot: string): Sprite {
  const [c, g] = mk(80, 104);
  g.translate(40, 54);
  g.beginPath();
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * TAU;
    const x = 33 * Math.sin(t) * (1 - 0.2 * Math.cos(t));
    const y = -46 * Math.cos(t);
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.closePath();
  const grad = g.createLinearGradient(-30, -40, 30, 44);
  grad.addColorStop(0, base);
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = base;
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = stripe;
  g.beginPath();
  g.moveTo(-40, -6);
  for (let i = 0; i <= 8; i++) g.lineTo(-40 + i * 10, i % 2 ? -14 : 0);
  g.lineTo(40, 10);
  for (let i = 8; i >= 0; i--) g.lineTo(-40 + i * 10, i % 2 ? 2 : 14);
  g.closePath();
  g.fill();
  g.fillStyle = dot;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.arc(-22 + i * 9, 26 + (i % 2) * 5, 2.6, 0, TAU);
    g.fill();
  }
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.arc(-14 + i * 9, -28 + (i % 2) * 5, 2.4, 0, TAU);
    g.fill();
  }
  g.fillStyle = grad;
  g.fillRect(-40, -50, 80, 100);
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.45)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(-10, -14, 24, Math.PI * 1.05, Math.PI * 1.35);
  g.stroke();
  return c;
}

export function bauble(color: string, light: string): Sprite {
  const [c, g] = mk(80, 96);
  g.fillStyle = '#e3b341';
  g.fillRect(32, 4, 16, 14);
  const grad = g.createRadialGradient(32, 46, 4, 40, 58, 32);
  grad.addColorStop(0, light);
  grad.addColorStop(1, color);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(40, 58, 30, 0, TAU);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(40, 58, 22, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
  g.strokeStyle = '#e3b341';
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(40, 62, 30, 8, 0, 0, Math.PI);
  g.stroke();
  return c;
}

export function star5(inner: string, outer: string): Sprite {
  const [c, g] = mk(96, 96);
  g.translate(48, 50);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 17 : 42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  const grad = g.createRadialGradient(0, 0, 4, 0, 0, 42);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.shadowColor = outer;
  g.shadowBlur = 8;
  g.fill();
  return c;
}

export function crescent(): Sprite {
  const [c, g] = mk(128, 128);
  const grad = g.createLinearGradient(20, 10, 100, 120);
  grad.addColorStop(0, '#fff1b8');
  grad.addColorStop(1, '#f0b940');
  g.fillStyle = grad;
  g.shadowColor = 'rgba(255,220,120,0.9)';
  g.shadowBlur = 16;
  g.beginPath();
  g.arc(60, 64, 44, 0, TAU);
  g.fill();
  g.shadowBlur = 0;
  g.globalCompositeOperation = 'destination-out';
  g.beginPath();
  g.arc(82, 54, 38, 0, TAU);
  g.fill();
  return c;
}

export function fullMoon(): Sprite {
  const [c, g] = mk(256, 256);
  const grad = g.createRadialGradient(110, 104, 10, 128, 128, 100);
  grad.addColorStop(0, '#fffbe6');
  grad.addColorStop(1, '#f3dea0');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(128, 128, 100, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(190,160,90,0.22)';
  for (const [x, y, r] of [[96, 100, 20], [150, 90, 14], [160, 150, 24], [100, 156, 12], [128, 122, 9], [178, 118, 8]] as const) {
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  return c;
}

export function kite(c1: string, c2: string): Sprite {
  const [c, g] = mk(96, 112);
  const top: [number, number] = [48, 6];
  const right: [number, number] = [90, 50];
  const bottom: [number, number] = [48, 106];
  const left: [number, number] = [6, 50];
  const mid: [number, number] = [48, 50];
  const tri = (a: [number, number], b: [number, number], col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(...a);
    g.lineTo(...b);
    g.lineTo(...mid);
    g.closePath();
    g.fill();
  };
  tri(top, right, c1);
  tri(right, bottom, c2);
  tri(bottom, left, c1);
  tri(left, top, c2);
  g.strokeStyle = 'rgba(60,30,10,0.6)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(...top); g.lineTo(...right); g.lineTo(...bottom); g.lineTo(...left); g.closePath();
  g.moveTo(...top); g.lineTo(...bottom);
  g.moveTo(...left); g.lineTo(...right);
  g.stroke();
  return c;
}

/** Soft cloud of colour for holi powder. */
export function powderPuff(rgb: string): Sprite {
  return soft(`rgba(${rgb},0.9)`, `rgba(${rgb},0)`, 96);
}

/** Red envelope (hongbao) with gold trim. */
export function envelope(): Sprite {
  const [c, g] = mk(64, 88);
  const grad = g.createLinearGradient(0, 0, 0, 88);
  grad.addColorStop(0, '#e0212b');
  grad.addColorStop(1, '#a50f1a');
  g.fillStyle = grad;
  g.beginPath();
  rr(g, 6, 4, 52, 80, 6);
  g.fill();
  g.strokeStyle = '#f5c542';
  g.lineWidth = 2.5;
  g.stroke();
  g.fillStyle = '#c3141f';
  g.beginPath();
  g.moveTo(6, 4);
  g.lineTo(32, 34);
  g.lineTo(58, 4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#f5c542';
  g.beginPath();
  g.arc(32, 52, 12, 0, TAU);
  g.fill();
  g.fillStyle = '#c3141f';
  g.fillRect(27, 47, 10, 10);
  return c;
}

export function coin(): Sprite {
  const [c, g] = mk(48, 48);
  const grad = g.createRadialGradient(20, 18, 2, 24, 24, 22);
  grad.addColorStop(0, '#fff2a8');
  grad.addColorStop(1, '#d99a1a');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(24, 24, 21, 0, TAU);
  g.fill();
  g.strokeStyle = '#b57810';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#9a6208';
  g.fillRect(18, 18, 12, 12);
  return c;
}

export function acorn(): Sprite {
  const [c, g] = mk(48, 64);
  const nut = g.createLinearGradient(0, 22, 0, 60);
  nut.addColorStop(0, '#d9a45a');
  nut.addColorStop(1, '#a86a2a');
  g.fillStyle = nut;
  g.beginPath();
  g.ellipse(24, 40, 15, 20, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#6b4220';
  g.beginPath();
  g.ellipse(24, 26, 19, 13, 0, Math.PI, 0);
  g.fill();
  g.fillRect(5, 24, 38, 4);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(8 + i * 6.4, 25);
    g.lineTo(12 + i * 4.8, 14);
    g.stroke();
  }
  g.fillStyle = '#4b2e12';
  g.fillRect(22, 6, 4, 8);
  return c;
}

/** Bunny facing right. */
export function bunny(): Sprite {
  const [c, g] = mk(112, 112);
  g.translate(56, 62);
  const fur = g.createRadialGradient(-6, -6, 4, 0, 0, 40);
  fur.addColorStop(0, '#ffffff');
  fur.addColorStop(1, '#d9d4e2');
  g.fillStyle = fur;
  g.beginPath();
  g.ellipse(-8, 8, 30, 24, 0, 0, TAU); // body
  g.fill();
  g.beginPath();
  g.arc(-38, 8, 8, 0, TAU); // tail
  g.fillStyle = '#ffffff';
  g.fill();
  g.fillStyle = fur;
  g.beginPath();
  g.arc(18, -4, 18, 0, TAU); // head
  g.fill();
  for (const [ex, ey, rot] of [[8, -34, -0.15], [22, -36, 0.1]] as const) {
    g.save();
    g.translate(ex, ey);
    g.rotate(rot);
    g.fillStyle = fur;
    g.beginPath();
    g.ellipse(0, 0, 7, 22, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#f7b4cf';
    g.beginPath();
    g.ellipse(0, 2, 3.6, 16, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#d9d4e2';
  g.beginPath();
  g.ellipse(14, 28, 10, 6, 0, 0, TAU); // foot
  g.fill();
  g.beginPath();
  g.ellipse(-22, 30, 12, 6, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#2b2336';
  g.beginPath();
  g.arc(24, -8, 2.6, 0, TAU);
  g.fill();
  g.fillStyle = '#f08fb3';
  g.beginPath();
  g.arc(34, -2, 3, 0, TAU);
  g.fill();
  g.strokeStyle = 'rgba(80,60,90,0.5)';
  g.lineWidth = 1;
  for (const dy of [-1, 3]) {
    g.beginPath();
    g.moveTo(32, 0 + dy);
    g.lineTo(46, -4 + dy * 2);
    g.stroke();
  }
  return c;
}

/** Decorated sugar skull (Día de los Muertos). */
export function sugarSkull(accent: string, accent2: string): Sprite {
  const [c, g] = mk(96, 112);
  g.translate(48, 52);
  const bone = g.createRadialGradient(-8, -14, 4, 0, 0, 44);
  bone.addColorStop(0, '#ffffff');
  bone.addColorStop(1, '#e6dfd0');
  g.fillStyle = bone;
  g.beginPath();
  g.ellipse(0, -6, 34, 36, 0, 0, TAU);
  g.fill();
  g.beginPath();
  rr(g, -20, 18, 40, 28, 8);
  g.fill();
  g.strokeStyle = 'rgba(60,40,70,0.35)';
  g.lineWidth = 1.5;
  g.stroke();
  for (const sx of [-1, 1]) {
    g.fillStyle = accent;
    g.beginPath();
    g.ellipse(sx * 15, -6, 13, 13, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#1d1226';
    g.beginPath();
    g.ellipse(sx * 15, -6, 8, 8, 0, 0, TAU);
    g.fill();
    g.fillStyle = accent2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      g.beginPath();
      g.arc(sx * 15 + Math.cos(a) * 17, -6 + Math.sin(a) * 17, 2, 0, TAU);
      g.fill();
    }
  }
  g.fillStyle = '#1d1226';
  g.beginPath();
  g.moveTo(0, 6); g.lineTo(-5, 18); g.lineTo(5, 18); g.closePath();
  g.fill();
  g.strokeStyle = '#1d1226';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-16, 30); g.lineTo(16, 30);
  for (let i = -3; i <= 3; i++) { g.moveTo(i * 5, 24); g.lineTo(i * 5, 38); }
  g.stroke();
  g.fillStyle = accent2;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.arc(-16 + i * 8, -34 + Math.abs(i - 2) * 3, 3, 0, TAU);
    g.fill();
  }
  g.fillStyle = accent;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    g.moveTo(0, -24);
    g.ellipse(Math.cos(a) * 7, -24 + Math.sin(a) * 7, 3.4, 3.4, 0, 0, TAU);
  }
  g.fill();
  return c;
}

/** Floating water lantern in the shape of a lotus. */
export function lotusLantern(): Sprite {
  const [c, g] = mk(72, 56);
  g.translate(36, 38);
  for (const [dx, a, col] of [[-16, -0.5, '#ff9ac1'], [16, 0.5, '#ff9ac1'], [-8, -0.25, '#ffb7d3'], [8, 0.25, '#ffb7d3'], [0, 0, '#ffd0e2']] as const) {
    g.save();
    g.translate(dx, 0);
    g.rotate(a);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, -12, 9, 20, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#fff2b0';
  g.shadowColor = '#ffcf5c';
  g.shadowBlur = 14;
  g.beginPath();
  g.arc(0, -6, 7, 0, TAU);
  g.fill();
  return c;
}
