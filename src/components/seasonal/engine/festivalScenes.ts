import type { FestivalSceneId } from '../../../design/festivals';
import { blit, createScene, falling, layered, TAU, wind, type FallCfg, type Layered, type Scene, type SceneOpts } from './scenes';
import { fogBank, glint, mapleLeaf, petal, rng, sunRays, type Sprite } from './sprites';
import {
  acorn, bauble, bunny, coin, crescent, egg, envelope, fullMoon, kite, lantern, lotusLantern, marigold, papel, skyLantern, star5, sugarSkull,
} from './festivalSprites';
import {
  bats, candles, crackers, eyes, ghosts, hoppingPumpkins, spiders, celestial, colorHaze, confetti, diyaRow, dragon, dragonBoats, embers, fireworks, flagRow, flames,
  hanging, kites, koinobori, lights, powder, skyLanterns, smoke, streamers, twinkle, waves,
} from './festivalFx';
import { birds, butterflies, colorJets, fireflies, riverLanterns, shootingStars, sleigh } from './festivalFx2';

/* ------------------------------ small local helpers ------------------------------ */

const none: Scene = { draw() {}, setQuality() {} };

/** Slow drifting fog banks (back layer). */
function fog(w: number, h: number, rgbaColor: string, n = 6, alpha = 0.3): Scene {
  const r = rng(201);
  const banks = Array.from({ length: n }, (_, i) => ({ spr: fogBank(210 + i, rgbaColor), x: r() * w, y: h * (0.35 + r() * 0.6), bw: w * (0.9 + r() * 0.8), v: 6 + r() * 16, a: alpha * (0.7 + r() * 0.5) }));
  return {
    setQuality() {},
    draw(ctx, cw, _ch, dpr, dt, t) {
      for (const b of banks) {
        b.x += b.v * dt * (0.6 + wind(t) * 0.4);
        if (b.x > cw + b.bw / 2) b.x = -b.bw / 2;
        blit(ctx, b.spr, b.x, b.y, b.bw, 0, 1, b.a, dpr);
      }
    },
  };
}

/** Slowly turning shafts of warm light from the top corner (back layer). */
function rays(rgba: string, x = 0.2, alpha = 0.4): Scene {
  const spr = sunRays(5, rgba);
  return {
    setQuality() {},
    draw(ctx, cw, ch, dpr, _dt, t) {
      ctx.globalCompositeOperation = 'lighter';
      blit(ctx, spr, cw * x, -ch * 0.05, Math.max(cw, ch) * 1.7, t * 0.03, 1, alpha, dpr);
    },
  };
}

const front = (...s: Scene[]): Layered => layered([], s);
/** Back scenes plus parts that are either front-only Scenes or Layered (back+front) pairs. */
function mix(backs: Scene[], parts: Array<Scene | Layered>): Layered {
  const j = join(...parts);
  return layered([...backs, j.back], [j.front]);
}
/** Merge Scene (front-only) and Layered (back+front) parts into one Layered. */
function join(...parts: Array<Scene | Layered>): Layered {
  const back: Scene[] = [];
  const fr: Scene[] = [];
  for (const p of parts) {
    if ('back' in p) { back.push(p.back); fr.push(p.front); } else fr.push(p);
  }
  return layered(back, fr);
}
const stars = () => glint('rgba(255,240,200,1)');

/* ------------------------------ palettes ------------------------------ */

const FIREWORK_MULTI = ['255,90,90', '255,200,70', '90,200,255', '170,110,255', '110,255,160', '255,120,200'];
const GOLD = ['255,210,110', '255,170,60', '255,240,180'];

interface Flag { fw: string[]; flags: string[]; conf: string[] }
const NATIONAL: Record<string, Flag> = {
  nationalIN: { fw: ['255,150,40', '255,255,255', '40,200,90'], flags: ['#ff9933', '#ffffff', '#138808'], conf: ['#ff9933', '#ffffff', '#138808', '#000080'] },
  nationalUS: { fw: ['230,50,70', '255,255,255', '70,110,255'], flags: ['#b22234', '#ffffff', '#3c3b6e'], conf: ['#b22234', '#ffffff', '#3c3b6e'] },
  nationalCA: { fw: ['235,50,60', '255,255,255'], flags: ['#d52b1e', '#ffffff'], conf: ['#d52b1e', '#ffffff'] },
  nationalAU: { fw: ['70,110,255', '235,60,70', '255,255,255', '255,210,70'], flags: ['#00247d', '#ffffff', '#cf142b'], conf: ['#00247d', '#ffffff', '#cf142b', '#ffcd00'] },
  nationalBR: { fw: ['40,210,100', '255,225,50', '70,130,255'], flags: ['#009c3b', '#ffdf00', '#002776'], conf: ['#009c3b', '#ffdf00', '#002776', '#ffffff'] },
  nationalMX: { fw: ['40,200,110', '255,255,255', '235,60,70'], flags: ['#006847', '#ffffff', '#ce1126'], conf: ['#006847', '#ffffff', '#ce1126'] },
  nationalAE: { fw: ['235,50,60', '40,200,110', '255,255,255'], flags: ['#ce1126', '#00732f', '#ffffff', '#222222'], conf: ['#ce1126', '#00732f', '#ffffff', '#222222'] },
};

function national(id: keyof typeof NATIONAL, w: number, h: number, o: SceneOpts): Layered {
  const p = NATIONAL[id];
  const parts: Scene[] = [
    fireworks(w, h, o, { palettes: p.fw, seed: 3 + id.charCodeAt(8) }),
    confetti(w, h, o, { colors: p.conf, ambient: 26, burstEvery: 5, seed: 9 }),
    crackers(w, h, o, { kinds: ['anar', 'ladi', 'sparkler'] }),
  ];
  if (id === 'nationalCA') {
    const maple = [mapleLeaf('#ee3a3a', '#b31b1b', '#6a0a0a'), mapleLeaf('#ff5a4a', '#c82a2a', '#780d0d')];
    parts.push(falling({ sprites: [maple, maple, maple], counts: [8, 10, 5], size: [[18, 26], [28, 40], [46, 64]], vy: [[34, 56], [52, 86], [80, 120]], alpha: [0.6, 0.95, 1], windGain: 90, sway: 36, swayFreq: [0.7, 1.7], rot: 2.6, tumble: true }, w, h, o, 301));
  }
  if (id === 'nationalUS' || id === 'nationalAU' || id === 'nationalAE') parts.push(twinkle(w, h, o, { n: 16, spr: stars(), region: [0.1, 0.9] }));
  return front(...parts);
}

/* ------------------------------ scene builders ------------------------------ */

const BUILDERS: Record<FestivalSceneId, (w: number, h: number, o: SceneOpts) => Layered> = {
  newyear: (w, h, o) => front(
    fireworks(w, h, o, { palettes: FIREWORK_MULTI, every: [0.8, 1.7], seed: 1 }),
    confetti(w, h, o, { colors: ['#ffd23f', '#ff4d6d', '#4dd2ff', '#9b6bff', '#ffffff', '#5dff9b'], ambient: 36, burstEvery: 2.8 }),
    twinkle(w, h, o, { n: 24, spr: glint('rgba(255,230,150,1)'), region: [0, 1] }),
    crackers(w, h, o, { kinds: ['sparkler', 'anar'] }),
    shootingStars(w, h, o),
  ),

  diwali: (w, h, o) => mix([smoke(w, h, o, { n: 7, rgb: '170,150,150' })], [
    fireworks(w, h, o, { palettes: [...GOLD, '255,90,60', '255,140,200', '170,110,255'], every: [0.9, 2], seed: 2 }),
    embers(w, h, o, { n: 40, rgb: '255,170,60', speed: [40, 110] }),
    crackers(w, h, o),
    skyLanterns(w, h, o, { n: 8, spr: skyLantern() }),
  ]),

  holi: (w, h, o) => layered(
    [colorHaze(w, h, o, { colors: ['255,60,150', '255,215,50', '60,200,235', '150,90,235', '70,220,120'], alpha: 0.2 })],
    [
      powder(w, h, o, { colors: ['255,40,140', '255,215,40', '40,200,235', '140,80,240', '60,225,110', '255,120,30'] }),
      colorJets(w, h, o, { colors: ['255,40,140', '255,215,40', '40,200,235', '140,80,240', '60,225,110', '255,120,30'] }),
    ],
  ),

  christmas: (w, h, o) => {
    const base = createScene('winter', w, h, o);
    const orn = [bauble('#d62839', '#ff8a96'), bauble('#1b8a4c', '#7ee2a3'), bauble('#e3b341', '#fff0b0'), bauble('#2a5bd7', '#9bb8ff'), star5('#fff3b0', '#ffc933')];
    return mix([base.back], [
      base.front,
      lights(w, h, o, { colors: ['255,70,70', '255,210,80', '80,220,120', '90,160,255'], rows: 2 }),
      hanging(w, h, o, { sprites: orn, n: Math.max(4, Math.round(w / 220)), len: [60, 150], size: [34, 54], seed: 5, stringColor: 'rgba(240,220,160,0.7)' }),
      sleigh(w, h, o),
      shootingStars(w, h, o, { every: [4, 8] }),
    ]);
  },

  halloween: (w, h, o) => mix([
    celestial(w, h, o, { spr: fullMoon(), x: 0.78, y: 0.22, size: 0.2, glowRgb: '255,160,60', halo: false }),
    fog(w, h, 'rgba(150,120,200,0.55)', 6, 0.32),
  ], [
    eyes(w, h, o, { n: 6 }),
    ghosts(w, h, o, { n: 3 }),
    bats(w, h, o, { n: 7 }),
    spiders(w, h, o, { n: Math.max(2, Math.round(w / 420)) }),
    hoppingPumpkins(w, h, o, { n: Math.max(4, Math.round(w / 230)) }),
  ]),

  thanksgiving: (w, h, o) => {
    const a = createScene('autumn', w, h, o);
    const ac = [acorn()];
    return mix([rays('rgba(255,210,130,0.6)', 0.18, 0.45), a.back], [
      a.front,
      embers(w, h, o, { n: 14, rgb: '255,190,90', speed: [14, 34] }),
      birds(w, h, o, { flocks: 3, color: 'rgba(60,35,20,0.6)' }),
      falling({ sprites: [[], ac, ac], counts: [0, 5, 3], size: [[0, 0], [20, 28], [32, 44]], vy: [[0, 0], [60, 90], [90, 130]], alpha: [0, 0.95, 1], windGain: 50, sway: 20, swayFreq: [0.6, 1.4], rot: 1.4, tumble: true }, w, h, o, 391),
    ]);
  },

  cny: (w, h, o) => {
    const lan = [lantern('#c4161c', '#ff6a4a'), lantern('#d8242a', '#ff8a5a')];
    return mix([colorHaze(w, h, o, { colors: ['255,60,40', '255,200,70'], alpha: 0.16 })], [
      fireworks(w, h, o, { palettes: ['255,90,70', '255,210,90', '255,240,180'], every: [1, 2.2], seed: 4 }),
      hanging(w, h, o, { sprites: lan, n: Math.max(4, Math.round(w / 200)), len: [50, 130], size: [52, 84], glowRgb: '255,110,60', seed: 6 }),
      dragon(w, h, o, { y: 0.42 }),
      falling({ sprites: [[], [envelope(), coin()], [envelope(), coin(), coin()]], counts: [0, 8, 4], size: [[0, 0], [22, 34], [38, 58]], vy: [[0, 0], [50, 80], [80, 120]], alpha: [0, 0.95, 1], windGain: 40, sway: 26, swayFreq: [0.7, 1.6], rot: 1.8, tumble: true }, w, h, o, 381),
      crackers(w, h, o, { kinds: ['ladi', 'bomb'] }),
    ]);
  },

  lanternfest: (w, h, o) => {
    const lan = [lantern('#c4161c', '#ff6a4a'), lantern('#e0701a', '#ffc066')];
    return mix([colorHaze(w, h, o, { colors: ['255,90,60', '255,180,80'], alpha: 0.14 })], [
      hanging(w, h, o, { sprites: lan, n: Math.max(5, Math.round(w / 170)), len: [40, 150], size: [48, 80], glowRgb: '255,140,70', seed: 7 }),
      skyLanterns(w, h, o, { n: 8, spr: skyLantern() }),
      fireworks(w, h, o, { palettes: ['255,120,70', '255,215,100'], every: [2, 3.6], seed: 8 }),
      riverLanterns(w, h, o, { n: 10, spr: lotusLantern() }),
      fireflies(w, h, o, { n: 10, rgb: '255,190,120', region: [0.3, 0.8] }),
    ]);
  },

  midautumn: (w, h, o) => {
    const petalGold = [petal('#fff1b0', '#f2b84a'), petal('#ffe08a', '#e6a030')];
    return mix([celestial(w, h, o, { spr: fullMoon(), x: 0.72, y: 0.28, size: 0.34, glowRgb: '255,235,170' })], [
      skyLanterns(w, h, o, { n: 10, spr: skyLantern() }),
      hanging(w, h, o, { sprites: [lantern('#e0a020', '#ffe08a')], n: Math.max(3, Math.round(w / 300)), len: [40, 110], size: [44, 70], glowRgb: '255,200,90', seed: 9 }),
      falling({ sprites: [petalGold, petalGold, petalGold], counts: [10, 10, 4], size: [[6, 10], [10, 16], [18, 26]], vy: [[22, 40], [34, 60], [50, 80]], alpha: [0.6, 0.9, 1], windGain: 50, sway: 24, swayFreq: [0.8, 1.8], rot: 2, tumble: true }, w, h, o, 311),
      fireflies(w, h, o, { n: 30, rgb: '255,225,140' }),
      shootingStars(w, h, o),
    ]);
  },

  dragonboat: (w, h, o) => mix([rays('rgba(255,235,170,0.5)', 0.8, 0.4), waves(w, h, o, { rgb: ['70,170,200', '40,130,170', '20,95,140', '10,70,110'] })], [birds(w, h, o, { flocks: 3, color: 'rgba(20,40,70,0.55)' }), dragonBoats(w, h, o)]),

  cherry: (w, h, o) => {
    const s = createScene('spring', w, h, { ...o, count: o.count * 1.6 });
    return mix([s.back], [s.front, butterflies(w, h, o, { n: 5, colors: [['#ffd1e8', '#ff8fc4'], ['#fff2a8', '#ffb347'], ['#cfe8ff', '#7fb2ff']] }), birds(w, h, o, { flocks: 2 })]);
  },

  goldenweek: (w, h, o) => {
    const s = createScene('spring', w, h, { ...o, count: o.count * 0.7 });
    return mix([s.back], [
      s.front,
      koinobori(w, h, o, { poles: [0.08, 0.82] }),
      butterflies(w, h, o, { n: 4, colors: [['#ffd1e8', '#ff8fc4'], ['#fff2a8', '#ffb347']] }),
      birds(w, h, o, { flocks: 2 }),
    ]);
  },

  childrensday: (w, h, o) => front(
    koinobori(w, h, o, { poles: [0.07, 0.4, 0.78] }),
    twinkle(w, h, o, { n: 14, spr: glint('rgba(255,255,255,1)'), region: [0.1, 0.9] }),
    butterflies(w, h, o, { n: 4, colors: [['#ffd23f', '#ff9a1f'], ['#a8e6ff', '#5aa8ff']] }),
  ),

  easter: (w, h, o) => {
    const eggs = [egg('#ffd1e8', '#ff8fc4', '#ffffff'), egg('#cfeedd', '#6fcf97', '#ffffff'), egg('#fff0a8', '#ffb84d', '#ff6b9d'), egg('#cde6ff', '#6aa8ff', '#ffffff'), egg('#e6d4ff', '#a97cf0', '#ffe27a')];
    const s = createScene('spring', w, h, { ...o, count: o.count * 0.7 });
    const cfg: FallCfg = { sprites: [eggs, eggs, eggs], counts: [8, 9, 4], size: [[16, 22], [26, 38], [44, 62]], vy: [[28, 46], [44, 74], [66, 100]], alpha: [0.7, 0.95, 1], windGain: 40, sway: 24, swayFreq: [0.6, 1.4], rot: 1.1, tumble: false };
    return mix([], [
      s.front,
      falling(cfg, w, h, o, 321),
      hoppingPumpkins(w, h, o, { n: 3, body: bunny(), face: null, directional: true, size: [70, 120] }),
      butterflies(w, h, o, { n: 4, colors: [['#ffd1e8', '#ff8fc4'], ['#fff2a8', '#ffb347'], ['#d8c8ff', '#a97cf0']] }),
    ]);
  },

  bonfire: (w, h, o) => mix([], [
    fireworks(w, h, o, { palettes: ['255,120,60', '255,210,90', '255,80,110', '120,200,255'], seed: 10 }),
    embers(w, h, o, { n: 60, rgb: '255,140,50', speed: [50, 150], size: [5, 13] }),
    flames(w, h, o, { n: Math.max(4, Math.round(w / 170)), size: Math.min(150, Math.max(90, h * 0.2)) }),
    crackers(w, h, o, { kinds: ['bomb', 'ladi', 'sparkler'] }),
    shootingStars(w, h, o),
  ]),

  sankranti: (w, h, o) => {
    const cols: Array<[string, string]> = [['#ff3d6e', '#ffd23f'], ['#2dd4ff', '#ffffff'], ['#7cff6b', '#ff9a1f'], ['#a96bff', '#ffd23f'], ['#ff9a1f', '#ffffff']];
    const mg = [marigold()];
    return mix([rays('rgba(255,215,130,0.5)', 0.85, 0.35)], [
      kites(w, h, o, { n: 9, sprites: cols.map(([a, b]) => kite(a, b)) }),
      falling({ sprites: [[], mg, mg], counts: [0, 6, 3], size: [[0, 0], [18, 26], [30, 42]], vy: [[0, 0], [30, 54], [46, 76]], alpha: [0, 0.9, 1], windGain: 70, sway: 24, swayFreq: [0.7, 1.5], rot: 1.6, tumble: true }, w, h, o, 331),
      birds(w, h, o, { flocks: 2 }),
      falling({ sprites: [[], cols.map(([a, b]) => kite(a, b)), cols.map(([a, b]) => kite(a, b))], counts: [0, 2, 1], size: [[0, 0], [30, 40], [46, 60]], vy: [[0, 0], [40, 70], [60, 90]], alpha: [0, 0.95, 1], windGain: 140, sway: 50, swayFreq: [0.6, 1.4], rot: 2, tumble: true }, w, h, o, 371),
    ]);
  },

  dussehra: (w, h, o) => {
    const mg = [marigold()];
    return mix([], [
      fireworks(w, h, o, { palettes: ['255,170,60', '255,220,120', '255,110,60'], every: [1.3, 2.6], seed: 11 }),
      falling({ sprites: [mg, mg, mg], counts: [8, 9, 4], size: [[12, 18], [22, 32], [38, 54]], vy: [[28, 46], [44, 74], [66, 100]], alpha: [0.6, 0.9, 1], windGain: 60, sway: 24, swayFreq: [0.7, 1.5], rot: 1.6, tumble: true }, w, h, o, 341),
      embers(w, h, o, { n: 56, rgb: '255,140,40', speed: [60, 160] }),
      flames(w, h, o, { n: Math.max(4, Math.round(w / 190)), size: Math.min(140, Math.max(85, h * 0.18)) }),
    ]);
  },

  ganesh: (w, h, o) => {
    const mg = [marigold()];
    return mix([], [
      falling({ sprites: [mg, mg, mg], counts: [10, 11, 5], size: [[12, 18], [22, 32], [40, 56]], vy: [[28, 46], [44, 74], [66, 100]], alpha: [0.6, 0.92, 1], windGain: 55, sway: 24, swayFreq: [0.7, 1.5], rot: 1.6, tumble: true }, w, h, o, 351),
      powder(w, h, o, { colors: ['255,120,30', '230,40,60', '255,200,50'] }),
      diyaRow(w, h, o, { n: Math.max(4, Math.round(w / 170)) }),
      twinkle(w, h, o, { n: 14, spr: glint('rgba(255,215,120,1)') }),
    ]);
  },

  carnival: (w, h, o) => front(
    confetti(w, h, o, { colors: ['#00c853', '#ffd600', '#ff1f8e', '#00b0ff', '#ff6d00', '#ffffff'], ambient: 50, burstEvery: 1.8, seed: 17 }),
    streamers(w, h, o, { colors: ['#00c853', '#ffd600', '#ff1f8e', '#00b0ff', '#ff6d00'], n: 14 }),
    fireworks(w, h, o, { palettes: ['40,210,100', '255,225,40', '255,50,150', '60,180,255'], every: [1, 2], seed: 12 }),
  ),

  muertos: (w, h, o) => {
    const mg = [marigold()];
    const pap = ['#ff4fa3', '#ffb020', '#2ec4b6', '#8e5cf0', '#ff7a2f'].map((c) => papel(c));
    return mix([], [
      flagRow(w, h, o, { sprites: pap, rows: 2, per: Math.max(6, Math.round(w / 110)), size: [54, 72], sag: 24, wire: 'rgba(240,220,190,0.6)' }),
      falling({ sprites: [mg, mg, mg], counts: [10, 11, 5], size: [[12, 18], [22, 32], [40, 56]], vy: [[26, 42], [40, 68], [60, 92]], alpha: [0.6, 0.92, 1], windGain: 45, sway: 28, swayFreq: [0.7, 1.5], rot: 1.6, tumble: true }, w, h, o, 361),
      candles(w, h, o, { n: 16 }),
      hanging(w, h, o, { sprites: [sugarSkull('#ff4fa3', '#ffd23f'), sugarSkull('#2ec4b6', '#ff7a2f'), sugarSkull('#8e5cf0', '#ffd23f')], n: Math.max(3, Math.round(w / 280)), len: [90, 190], size: [46, 70], seed: 15, stringColor: 'rgba(240,220,190,0.6)' }),
      butterflies(w, h, o, { n: 5, colors: [['#ff8a1f', '#2b1a10'], ['#ffb02e', '#3b2210']] }),
      fireflies(w, h, o, { n: 16, rgb: '255,170,70', region: [0.4, 1] }),
    ]);
  },

  eid: (w, h, o) => eid(w, h, o, ['#0f6d7a', '#2fb7b0']),
  eidadha: (w, h, o) => eid(w, h, o, ['#0f7a4a', '#34c07a']),

  nationalIN: (w, h, o) => national('nationalIN', w, h, o),
  nationalUS: (w, h, o) => national('nationalUS', w, h, o),
  nationalCA: (w, h, o) => national('nationalCA', w, h, o),
  nationalAU: (w, h, o) => national('nationalAU', w, h, o),
  nationalBR: (w, h, o) => national('nationalBR', w, h, o),
  nationalMX: (w, h, o) => national('nationalMX', w, h, o),
  nationalAE: (w, h, o) => national('nationalAE', w, h, o),
};

function eid(w: number, h: number, o: SceneOpts, glass: [string, string]): Layered {
  const lan: Sprite[] = [lantern(glass[0], glass[1], true), lantern('#b8860b', '#ffe08a', true)];
  return mix([celestial(w, h, o, { spr: crescent(), x: 0.82, y: 0.2, size: 0.2, glowRgb: '255,225,150' })], [
    hanging(w, h, o, { sprites: lan, n: Math.max(4, Math.round(w / 220)), len: [50, 130], size: [46, 74], glowRgb: '255,210,110', seed: 13 }),
    twinkle(w, h, o, { n: 26, spr: glint('rgba(255,236,170,1)'), region: [0, 0.8] }),
    embers(w, h, o, { n: 22, rgb: '255,215,110', speed: [10, 30], size: [4, 9] }),
    fireworks(w, h, o, { palettes: ['255,215,110', '120,255,190', '255,255,255'], every: [2.5, 4.5], seed: 14 }),
    shootingStars(w, h, o),
  ]);
}

export function createFestivalScene(id: FestivalSceneId, w: number, h: number, o: SceneOpts): Layered {
  return BUILDERS[id](w, h, o);
}

void none;
void TAU;
