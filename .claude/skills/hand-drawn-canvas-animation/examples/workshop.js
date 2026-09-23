'use strict';
// ============================================================
// WORKSHOP. The film engine with a hand on it: a point-and-click screen, in the
// spirit of Samorost, where the other examples are films. Five museum cutouts
// hang in a workshop; click them awake in the right order and the room hands you
// to a night finale; click the finale and an ink blot eats it back to the start.
// Photos: The Metropolitan Museum of Art, Open Access (CC0). Credits and sources are in workshop-photos.js.
//
// This page owns a live rAF loop and mutable screen state, so the film purity
// invariant (same frame index in, same pixels out) does not apply here. But
// everything the core draws stays pure: no core function is ever called with
// anything but (context, time, seed), and a click only changes this file's
// own state.
//
// Determinism: no Math.random anywhere. Static textures use fixed seeds via
// the core's rng, so grain and brush lines are stable frame to frame.
// Nothing boils unless a reaction means it to.
//
// core.js API used: setFormat, W/H/CX/CY/S/OUT_W/OUT_H, layer, blit,
// usePalette, pastel, PAL, backdrop, place, photo, on, brush, wob, glow,
// nightfall, iris, blot, ripples, aster, dotBurst, seedDot, plant, rng, sm,
// easeIO, easeOut, easeIn, easeInOutSine, lerp, clamp, mix, alpha, tint,
// polyPath, blob, PHOTOS, _photoLoads, note, noiseBurst, pentHz.
// The core has no hop() — hops are a local parabola + stretch below.
// ============================================================
(() => {

// ---------------- the puzzle ----------------
// The click order is the whole puzzle. A wrong click only shakes the object;
// the right one wakes it for good, and the fifth hands the screen over.
const SEQUENCE = ['lantern', 'watch', 'teapot', 'cup', 'violin'];
const DISPLAY  = ['lantern', 'teapot', 'cup', 'violin', 'watch'];   // hit-canvas ids 1..5

// ---------------- canvas / format / resize ----------------
const cv  = document.getElementById('c');
const ctx = cv.getContext('2d');
const now = () => performance.now() / 1000;

function fit() {
  const iw = Math.max(320, window.innerWidth), ih = Math.max(320, window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const k = Math.min(1, 1920 / (Math.max(iw, ih) * dpr));       // cap the long side at 1920 output px
  const outW = 2 * Math.round(iw * dpr * k / 2);                // even, like the core likes
  setFormat({ ar: iw + ':' + ih, width: outW });                // window aspect -> logical W/H, S
  cv.width = OUT_W; cv.height = OUT_H;
  cv.style.width = iw + 'px'; cv.style.height = ih + 'px';      // full-viewport, 1 canvas, no letterbox
  buildHit();
}

// transition render targets; layer() canvases follow setFormat on resize
let FL = null, SL = null;      // FL = finale frame during iris-in, SL = fresh screen 1 during blot-out

// ---------------- game state ----------------
const G = {
  screen: 1, phase: 'play', phaseT0: 0, phaseArg: null,   // phase: play | celebrate | iris | finale | blot
  solved: [], hover: null,
  obj: {},
};
DISPLAY.forEach(n => { G.obj[n] = { awake: false, reactT0: -9, shakeT0: -9 }; });

// screen 1 layout: sizes are fractions of the short side, positions of W/H,
// so the composition survives any window aspect (architecture.md: no literal 540s)
const DEFS1 = [
  { name: 'lantern', hf: .38,  xf: .14,  yf: .82, pivot: [.5, 1],  bob: [4,   .9,  0  ], kind: 'ground' },
  { name: 'teapot',  hf: .185, xf: .415, yf: .82, pivot: [.4, 1],  bob: [3,   .7,  2.1], kind: 'ground' },
  { name: 'cup',     hf: .19,  xf: .69,  yf: .82, pivot: [.37, 1], bob: [3.5, .8,  4.2], kind: 'ground' },
  { name: 'violin',  hf: .44,  xf: .885, yf: .33, pivot: null,     bob: [5,   .6,  1.3], kind: 'hang'   },
  { name: 'watch',   hf: .30,  xf: .16,  yf: .40, pivot: [.5, 1],  bob: [3,   .75, 3.4], kind: 'shelf'  },
];

// current placement of one object: idle bob + wrong-click shake + celebration hop
function mk(def, t, rest) {
  const o = G.obj[def.name], SS = Math.min(W, H);
  let x = def.xf * W, y = def.yf * H, rot = 0, hh = def.hf * SS;
  if (!rest) {
    y -= Math.sin(t * TAU * def.bob[1] + def.bob[2]) * def.bob[0] * (o.awake ? 1.7 : 1);   // idle bob, livelier awake
    const st = t - o.shakeT0;                                                              // decaying x jitter
    if (st >= 0 && st < 1.2) x += Math.sin(st * 46) * 12 * Math.exp(-4.5 * st);
    if (G.phase === 'celebrate' || G.phase === 'iris') {                                   // staggered hop parade
      const u = (t - G.phaseT0 - SEQUENCE.indexOf(def.name) * .13) / .55;
      if (u > 0 && u < 1) { y -= 4 * u * (1 - u) * (SS * .11); hh *= 1 + .10 * Math.sin(u * Math.PI); }
    }
    if (def.name === 'violin' && o.awake) rot = Math.sin(t * 1.3) * .05;                   // the hung violin swings
  }
  return place(def.name, { x, y, h: hh, rot, pivot: def.pivot });
}

// ---------------- hit canvas (exact-alpha picking) ----------------
// Each cutout is pre-tinted a unique red (source-in) once; the hit canvas
// draws the five silhouettes at their REST positions in that id colour, and a
// click reads one pixel. No camera math: the camera is static per screen.
// TODO camera-inverse picking once a screen pans/zooms (setView screens).
const hit = document.createElement('canvas');
const TINTS = {};
let hitScreen = 0, HIT_S = 1;

function buildTints() {
  DISPLAY.forEach((n, i) => {
    const ph = PHOTOS[n], tc = document.createElement('canvas');
    tc.width = ph.img.naturalWidth || ph.w; tc.height = ph.img.naturalHeight || ph.h;
    const g = tc.getContext('2d');
    g.drawImage(ph.img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = 'rgb(' + (i + 1) + ',0,0)';
    g.fillRect(0, 0, tc.width, tc.height);
    TINTS[n] = tc;
  });
}

function buildHit() {
  if (!TINTS[DISPLAY[0]]) return;
  hit.width = Math.max(2, cv.width >> 1); hit.height = Math.max(2, cv.height >> 1);
  HIT_S = (cv.width / 2) / W;
  const g = hit.getContext('2d', { willReadFrequently: true });
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, hit.width, hit.height);
  g.setTransform(HIT_S, 0, 0, HIT_S, 0, 0);
  for (const d of DEFS1) {
    const pl = mk(d, 0, true);
    g.save(); g.translate(pl.x, pl.y); g.rotate(pl.rot); if (pl.flip) g.scale(-1, 1);
    g.drawImage(TINTS[d.name], -pl.w / 2, -pl.h / 2, pl.w, pl.h); g.restore();
  }
  hitScreen = 1;
}

function hitAt(lx, ly) {
  if (hitScreen !== 1 || G.screen !== 1) return null;
  const g = hit.getContext('2d', { willReadFrequently: true });
  const px = clamp(Math.round(lx * HIT_S), 0, hit.width - 1), py = clamp(Math.round(ly * HIT_S), 0, hit.height - 1);
  const d = g.getImageData(px, py, 1, 1).data;
  return (d[3] > 60 && d[0] > 0) ? DISPLAY[d[0] - 1] : null;
}

// ---------------- event sound (the core's note/noiseBurst, on a click-unlocked AudioContext) ----------------
const snd = {
  ac: null, master: null,
  ensure() {   // AudioContext is created lazily on the first pointerdown (autoplay policy)
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ac = new AC();
      this.master = this.ac.createGain(); this.master.gain.value = .5;
      this.master.connect(this.ac.destination);
    }
    if (this.ac.resume) this.ac.resume();
  },
  click() { if (!this.ac) return; const t = this.ac.currentTime;
    note(this.ac, this.master, 720, t, 0, .06, 'triangle', .06);
    noiseBurst(this.ac, this.master, t, 0, .035, .1, 3); },
  ok(i) { if (!this.ac) return; const t = this.ac.currentTime, f = pentHz(1, (i - 1) % 5, 261.6);
    note(this.ac, this.master, f, t, 0, .5, 'sine', .22);
    note(this.ac, this.master, f * 2, t, .03, .25, 'triangle', .08); },
  err() { if (!this.ac) return; const t = this.ac.currentTime;
    note(this.ac, this.master, 87, t, 0, .32, 'sawtooth', .16);
    note(this.ac, this.master, 82.4, t, .02, .3, 'square', .05);
    noiseBurst(this.ac, this.master, t, 0, .12, .16, 9); },
  win() { if (!this.ac) return; const t = this.ac.currentTime;
    [[0, 0], [0, 2], [0, 4], [1, 0], [1, 2]].forEach(([o, s], k) => note(this.ac, this.master, pentHz(o, s, 261.6), t, k * .1, .5, 'sine', .2));
    note(this.ac, this.master, pentHz(2, 0, 261.6), t, .55, 1.2, 'sine', .15); },
  woosh() { if (!this.ac) return; const t = this.ac.currentTime;
    noiseBurst(this.ac, this.master, t, 0, .6, .2, 21);
    noiseBurst(this.ac, this.master, t, .08, .5, .13, 22); },
};

// ---------------- screen 1: the workshop ----------------
function scenery1(c, GY, SHY, SS) {
  // static hand-drawn set: ground line, wall shelf, a plant, pebbles. Fixed seeds = stable lines.
  brush(c, [[-40, GY + 5], [W * .3, GY - 3], [W * .62, GY + 7], [W + 40, GY - 1]], { w: 3.4, color: PAL.ink, seed: 11, amp: 1.4 });
  brush(c, [[W * .045, SHY + 4], [W * .17, SHY - 2], [W * .295, SHY + 4]], { w: 3, color: PAL.ink, seed: 12, amp: 1.2 });
  for (const u of [.08, .175, .27]) brush(c, [[W * u, SHY + 6], [W * u - 4, SHY + 20]], { w: 2.2, color: PAL.ink, seed: 13, amp: .6 });
  plant(c, W * .955, GY + 4, SS * .10, 3, 16, { leaf: PAL.fills[3], flower: PAL.accents[1] });
  for (const [u, s] of [[.30, 31], [.56, 32], [.80, 33]]) seedDot(c, W * u, GY + 16 + Math.sin(s) * 3, 3, alpha(PAL.ink, .5), null);
}

function drawScreen1(c, t) {
  usePalette(pastel('cream'));
  backdrop(c);
  const SS = Math.min(W, H), GY = H * .82, SHY = H * .40;
  scenery1(c, GY, SHY, SS);

  const pls = DEFS1.map(d => mk(d, t));

  // the violin hangs from a hook: string drawn behind it, from the wall to its current top
  const vp = pls[DISPLAY.indexOf('violin')], vTop = on(vp, .5, .03), hook = [vp.x, H * .072];
  brush(c, [hook, [(hook[0] + vTop[0]) / 2 + 3, (hook[1] + vTop[1]) / 2], vTop], { w: 2.2, color: '#7a5433', seed: 14, amp: .5 });
  c.save(); c.strokeStyle = PAL.ink; c.lineWidth = 2.4; c.beginPath(); c.arc(hook[0], hook[1] - 4, 5, 0, TAU); c.stroke(); c.restore();

  for (let k = 0; k < pls.length; k++) {
    const d = DEFS1[k];
    photo(c, pls[k], d.kind === 'hang' ? { shadow: 0 } : { ground: d.kind === 'ground' ? GY : SHY });
  }

  pls.forEach((pl, k) => reaction(c, DEFS1[k], pl, t, SS));

  // celebrate sparkles while the hops run
  if (G.phase === 'celebrate' || G.phase === 'iris') {
    const r = rng(51);
    for (let k = 0; k < 10; k++) {
      const p = pls[k % pls.length], a = .3 + .7 * Math.max(0, Math.sin(t * 5 + k * 2.1));
      c.save(); c.globalAlpha = a * (1 - sm(1.5, 2.1, t - G.phaseT0));
      aster(c, p.x + (r() - .5) * p.w * 2.2, p.y - p.h * .7 - r() * SS * .18, SS * .006 + r() * SS * .005, 5, PAL.accents[k % 4], 40 + k, a, PAL.paper, PAL.ink);
      c.restore();
    }
  }

  // hover highlight: a soft wobbling dashed ring
  if (G.phase === 'play' && G.hover) {
    const pl = pls[DISPLAY.indexOf(G.hover)];
    c.save(); c.globalAlpha = .5 + Math.sin(t * 3) * .12; c.strokeStyle = PAL.accents[2]; c.lineWidth = 3;
    c.setLineDash([18, 14]); c.lineDashOffset = -((t * 42) % 32);
    wob(c, ellPts(pl.x, pl.y - pl.h * .04, pl.w * .62, pl.h * .55, 0, 64), 1.8, 31, true);
    c.restore();
  }
  return pls;
}

// per-object reactions: ~1 s visible event, then a subtle awake behaviour.
// Every anchor rides the object through on(pl, u, v), so a bobbing
// object carries its steam, glow and ticks with it.
function reaction(c, d, pl, t, SS) {
  const o = G.obj[d.name];
  if (!o.awake) return;
  const rt = t - o.reactT0;                    // seconds since the correct click
  const k = clamp(rt, 0, 1);                   // the 1 s reaction ramp

  if (d.name === 'lantern') {                  // glow halo + flame, flickering like the core's lantern scene
    const fl = on(pl, .52, .62);
    const fk = 1 + Math.sin(t * 12.3) * .07 + Math.sin(t * 31.7) * .04;
    const big = .3 + .7 * easeOut(k);
    glow(c, fl[0], fl[1], SS * .17 * fk * big, '#ffcf70', .55);
    glow(c, fl[0], fl[1], SS * .05 * fk, '#fff1c0', .2 + .8 * big);
    c.save(); c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(fl[0], fl[1], SS * .008 * (1 + .2 * Math.sin(t * 9)), 0, TAU); c.fill(); c.restore();

  } else if (d.name === 'watch') {             // tick marks appear, then a hand spins and keeps slow time
    const hub = on(pl, .49, .652), R = pl.w * .33;
    c.save(); c.strokeStyle = PAL.ink;
    for (let j = 0; j < 12; j++) {
      const tk = clamp((rt - j * .05) / .2, 0, 1); if (tk <= 0) continue;
      const a = j / 12 * TAU, r0 = R * (.78 + .04 * (j % 3 === 0 ? 1 : 0)), r1 = R * .92;
      c.globalAlpha = .55 * tk; c.lineWidth = j % 3 === 0 ? 2.6 : 1.8;
      c.beginPath(); c.moveTo(hub[0] + Math.cos(a) * r0, hub[1] + Math.sin(a) * r0);
      c.lineTo(hub[0] + Math.cos(a) * r1, hub[1] + Math.sin(a) * r1); c.stroke();
    }
    c.restore();
    const spin = -Math.PI / 2 + (rt < 1 ? easeOut(rt) * TAU * 2.2 : TAU * 2.2 + (rt - 1) * TAU / 8);
    brush(c, [hub, [hub[0] + Math.cos(spin) * R * .72, hub[1] + Math.sin(spin) * R * .72]], { w: 4.4, color: PAL.accents[0], seed: 2, amp: .5 });
    c.save(); c.fillStyle = PAL.accents[0]; c.beginPath(); c.arc(hub[0], hub[1], SS * .008, 0, TAU); c.fill(); c.restore();

  } else if (d.name === 'teapot') {            // steam squiggles rise from the spout, then keep steaming
    const s0 = on(pl, .02, .3), rise = SS * .03 * Math.min(1, rt * 1.2 + .2);
    for (let m = 0; m < 2; m++) {
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        const u = j / 8;
        pts.push([s0[0] + (m ? 7 : -4) + Math.sin(u * 5 + m * 2 + t * 2.2) * SS * .014 * (u * .7 + .3),
                  s0[1] - u * rise * (m ? .85 : 1)]);
      }
      brush(c, pts, { w: 2.6, color: mix(PAL.ink, PAL.paper, .55), seed: 60 + m, amp: .8, al: .55 * (1 - .35 * m) });
    }

  } else if (d.name === 'cup') {               // ripple rings run out over the paper, then breathe
    const ct = on(pl, .365, .1);
    c.save();
    if (rt < 1.6) {
      const rk = easeOut(clamp(rt / 1.2, 0, 1));
      c.globalAlpha = .55 * (1 - clamp((rt - 1.1) / .5, 0, 1));
      ripples(c, ct[0], ct[1], [SS * .04 + rk * SS * .17, SS * .04 + rk * SS * .12, SS * .04 + rk * SS * .06], PAL.accents[2], 71, 3.4);
    } else {
      c.globalAlpha = .25 + .12 * Math.sin(t * 2);
      const rr = SS * (.06 + .015 * Math.sin(t * 2));
      ripples(c, ct[0], ct[1], [rr, rr * .62], PAL.accents[2], 72, 3);
    }
    c.restore();

  } else if (d.name === 'violin') {            // a string plucked: vibration decays to a shimmer
    const a = on(pl, .5, .16), b = on(pl, .5, .92);
    const env = rt < 1 ? 1 : Math.max(Math.exp(-2.2 * (rt - 1)), .12);
    const pts = [];
    for (let j = 0; j <= 14; j++) {
      const u = j / 14;
      pts.push([lerp(a[0], b[0], u) + Math.sin(u * Math.PI) * Math.sin(t * 46) * SS * .016 * env, lerp(a[1], b[1], u)]);
    }
    brush(c, pts, { w: 2, color: PAL.accents[3], seed: 80, amp: .4, al: .85 });
    if (rt < .4) { const m = on(pl, .5, .54); c.save(); c.globalAlpha = 1 - rt / .4;
      aster(c, m[0], m[1], SS * .007, 6, PAL.accents[3], 81, 1 - rt / .4, PAL.paper, PAL.ink); c.restore(); }
  }
}

// ---------------- screen 2: the finale ----------------
const DEFS2 = [
  { name: 'lantern', hf: .34, xf: .50, yf: .44, pivot: [.5, 1],  bob: [5, .5, 0]   },
  { name: 'violin',  hf: .44, xf: .24, yf: .62, pivot: [.5, 1],  bob: [6, .42, 1.2], rot: -.13 },
  { name: 'watch',   hf: .26, xf: .37, yf: .84, pivot: [.5, 1],  bob: [4, .6, 2.4]  },
  { name: 'teapot',  hf: .20, xf: .64, yf: .84, pivot: [.4, 1],  bob: [4, .55, 3.1], rot: .06 },
  { name: 'cup',     hf: .17, xf: .79, yf: .80, pivot: [.37, 1], bob: [3.5, .7, 4.5] },
];

function drawFinale(c, t) {
  usePalette(pastel('lilac'));
  backdrop(c);
  const SS = Math.min(W, H), FGY = H * .84;

  // a mound in the middle so the lantern stands above the rest
  const mound = blob(W * .5, FGY + SS * .02, SS * .17, SS * .06, 88, { amp: .12 });
  c.save(); c.fillStyle = tint(PAL.paper, .25); c.fill(polyPath(mound)); c.restore();
  brush(c, mound, { w: 3, color: PAL.ink, seed: 89, amp: 1.4 });

  const pls = DEFS2.map(d => {
    let y = d.yf * H - Math.sin(t * TAU * d.bob[1] + d.bob[2]) * d.bob[0];
    return place(d.name, { x: d.xf * W, y, h: d.hf * SS, rot: d.rot || 0, pivot: d.pivot });
  });
  for (let k = 0; k < pls.length; k++) photo(c, pls[k], { ground: k === 0 ? H * .44 : FGY });

  nightfall(c, .62);                            // evening: everything sinks, the lamps stay

  // the lantern carries the scene
  const fl = on(pls[0], .52, .62);
  const fk = 1 + Math.sin(t * 12.3) * .07 + Math.sin(t * 29) * .05;
  glow(c, fl[0], fl[1], SS * .30 * fk, '#ffcf70', .6);
  glow(c, fl[0], fl[1], SS * .09 * fk, '#fff1c0', .95);
  glow(c, fl[0], fl[1], SS * .035, '#ffd36b', 1);
  c.save(); c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(fl[0], fl[1], SS * .009 * (1 + .2 * Math.sin(t * 9)), 0, TAU); c.fill(); c.restore();

  // stars: fixed seeded positions, twinkling alpha — no Math.random anywhere
  const r = rng(77);
  for (let k = 0; k < 14; k++) {
    const x = r() * W, y = r() * H * .55, s = SS * .005 + r() * SS * .007;
    const a = .25 + .75 * Math.max(0, Math.sin(t * 1.8 + k * 2.3));
    c.save(); c.globalAlpha = a;
    aster(c, x, y, s, 5, '#ffe9a8', 40 + k, a, PAL.night, '#ffe9a8');
    c.restore();
  }
  // a slow firework breathing above the group
  const bg = sm(0, 1, (t * .25) % 1) ;
  c.save(); c.globalAlpha = .5 * Math.sin((t * .25) % 1 * Math.PI);
  dotBurst(c, W * .5, H * .16, SS * .16, 12, PAL.accents[2], 90, bg);
  c.restore();
  return pls;
}

// ---------------- input ----------------
function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}

cv.addEventListener('pointermove', e => {
  const [x, y] = toLogical(e);
  G.hover = (G.screen === 1 && G.phase === 'play') ? hitAt(x, y) : null;
  cv.style.cursor = (G.hover || (G.screen === 2 && G.phase === 'finale')) ? 'pointer' : 'default';
});

cv.addEventListener('pointerdown', e => {
  snd.ensure();                                 // first gesture unlocks audio
  const [x, y] = toLogical(e);

  if (G.screen === 1 && G.phase === 'play') {
    const name = hitAt(x, y);
    if (!name) { snd.click(); return; }
    const o = G.obj[name], next = SEQUENCE[G.solved.length];
    if (name === next) {
      o.awake = true; o.reactT0 = now();
      G.solved.push(name);
      snd.ok(G.solved.length);
      if (G.solved.length === SEQUENCE.length) { G.phase = 'celebrate'; G.phaseT0 = now(); snd.win(); }
    } else {
      o.shakeT0 = now();
      snd.err();
    }

  } else if (G.screen === 2 && G.phase === 'finale') {
    G.phase = 'blot'; G.phaseT0 = now(); G.phaseArg = [x, y];
    G.solved.length = 0;                        // reset the puzzle now; the blot reveals the fresh workshop
    DISPLAY.forEach(n => { const o = G.obj[n]; o.awake = false; o.reactT0 = -9; o.shakeT0 = -9; });
    G.hover = null;
    snd.woosh();
  } else {
    snd.click();
  }
});

// ---------------- the loop ----------------
function frame(ms) {
  const t = ms / 1000;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);
  const RMAX = Math.hypot(W, H) * .62;

  if (G.screen === 1 && G.phase === 'iris') {          // workshop darkens, then an iris opens onto the finale
    drawScreen1(ctx, t);
    const u = t - G.phaseT0;
    if (u < .45) nightfall(ctx, .9 * easeIn(sm(0, .45, u)));
    else {
      nightfall(ctx, .9);
      drawFinale(FL.getContext('2d'), t);
      iris(ctx, CX, CY, easeInOutSine(sm(.45, 1.35, u)) * RMAX * 1.2, c2 => blit(c2, FL), PAL.night);
      if (u > 1.45) { G.screen = 2; G.phase = 'finale'; G.hover = null; }
    }
  } else if (G.screen === 1) {                          // play | celebrate
    if (G.phase === 'celebrate' && t - G.phaseT0 > 1.6) { G.phase = 'iris'; G.phaseT0 = t; snd.woosh(); }
    drawScreen1(ctx, t);
  } else if (G.phase === 'blot') {                      // an ink blot eats the finale back to a fresh workshop
    drawFinale(ctx, t);
    const u = t - G.phaseT0;
    drawScreen1(SL.getContext('2d'), t);
    blot(ctx, SL, G.phaseArg[0], G.phaseArg[1], easeIO(clamp(u / .95, 0, 1)) * RMAX * 1.9, 5, PAL.night);
    if (u > 1.1) { G.screen = 1; G.phase = 'play'; buildHit(); }
  } else {                                              // finale
    drawFinale(ctx, t);
  }

  requestAnimationFrame(frame);
}

// ---------------- boot ----------------
function start() {
  buildTints();
  fit();
  FL = layer(); SL = layer();
  window.addEventListener('resize', fit);
  requestAnimationFrame(frame);
}

// photos decode before the first frame (the core collects their load promises)
Promise.all([..._photoLoads, document.fonts.ready]).then(start)
  .catch(e => console.error(e));

})();
