'use strict';
// ============================================================
// sand.js: SAND ON A LIGHT TABLE. The frame is not redrawn from nothing: it is a bed of sand that remembers.
// A field of sand thickness lies on a backlit glass; gestures pour it, sprinkle it, draw in it with a fingertip,
// comb it, sweep it with the palm, blow it sideways with wind. Sand pushed aside piles up in ridges beside the
// stroke and slumps into cones, the way it does on a real table. One picture becomes the next without a cut.
//
//   sandFilm({ gestures, N, world, hand })   declare the performance once, at file scope
//   sandFrame(c, t, live)                    bring the bed to time t (seconds) and draw it; call it first in a scene
//   sandLook(x, y, w)                        the camera over the table: this window fills the frame (world units)
//   sandTint([r, g, b])                      the colour of the lamp under the glass, 1 = as it is
//   sandCover({ box, amount })               pass as init: the film starts on a table already covered in sand
//   G.pour / sprinkle / finger / palm / comb / dab / fill / wind / fly / move      gestures, times in seconds
//
// The table is a square of `world` units (default: the long side of the frame), the bed is N x N cells over it.
// Gesture points are in world units; with the default camera they are frame units, as in a plain film.
// drawFrame stays a pure function of the frame number: the bed steps at a fixed 1/48 s, and a request for an
// earlier time rebuilds it from the first gesture. Load after core.js.
// ============================================================
const SAND = { N: 540, world: 1080, h: null, k: 0, seed: 1, gestures: [], air: [], streak: null, hand: true, view: null, tint: null };
const SAND_DT = 1 / 48;
const _sandCheckpoints = new Map(); // bounded snapshots for deterministic seeking
function _srand() { SAND.seed = (Math.imul(SAND.seed, 1664525) + 1013904223) >>> 0; return SAND.seed / 4294967296; }

// ---------- paths ----------
function sandPath(pts) { const P = pts.map(p => [p[0], p[1]]), L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return { P, L, len: L[L.length - 1] || 1e-6 }; }
function sandPoint(path, s) { const { P, L } = path; s = clamp(s, 0, path.len); let i = 1; while (i < P.length - 1 && L[i] < s) i++; const a = P[i - 1], b = P[i] || a, seg = Math.max(1e-6, L[i] - L[i - 1]), t = clamp((s - L[i - 1]) / seg, 0, 1), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), dx / d, dy / d]; }
// scanFill: a back-and-forth path that covers a polygon, for wiping or pouring an area. spacing is the distance between passes.
function scanFill(poly, spacing, angle = 0) { const ca = Math.cos(-angle), sa = Math.sin(-angle), R = poly.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca]); let y0 = 1e9, y1 = -1e9; for (const p of R) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const out = []; let flip = false; for (let y = y0 + spacing / 2; y < y1; y += spacing) { const xs = []; for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) { const seg = [[xs[k], y], [xs[k + 1], y]]; if (flip) seg.reverse(); out.push(...seg); } flip = !flip; }
  const cb = Math.cos(angle), sb = Math.sin(angle); return out.map(([x, y]) => [x * cb - y * sb, x * sb + y * cb]); }
const circlePts = (cx, cy, r, n = 28, a0 = 0, turns = 1) => Array.from({ length: Math.round(n * turns) + 1 }, (_, k) => { const a = a0 + k / n * TAU; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const spiralPts = (cx, cy, r, turns = 3, n = 24) => Array.from({ length: Math.round(turns * n) + 1 }, (_, k) => { const u = k / (turns * n), a = u * turns * TAU; return [cx + Math.cos(a) * r * u, cy + Math.sin(a) * r * u]; });

// ---------- gestures ----------
const G = {
  pour: (t0, t1, pts, o = {}) => ({ tool: 'pour', t0, t1, path: sandPath(pts), r: o.r ?? 10, amount: o.amount ?? 1.6, ease: o.ease || (t => t), hover: true }),
  sprinkle: (t0, t1, pts, o = {}) => ({ tool: 'sprinkle', t0, t1, path: sandPath(pts), r: o.r ?? 120, amount: o.amount ?? 1.2, ease: o.ease || (t => t), hover: true }),
  finger: (t0, t1, pts, o = {}) => ({ tool: 'wipe', t0, t1, path: sandPath(pts), r: o.r ?? 9, strength: o.strength ?? 1, keep: o.keep ?? 1, ease: o.ease || easeIO, hand: 'finger' }),
  palm: (t0, t1, pts, o = {}) => ({ tool: 'wipe', t0, t1, path: sandPath(pts), r: o.r ?? 70, strength: o.strength ?? .9, streaks: o.streaks ?? .4, keep: o.keep ?? 1, ease: o.ease || easeIO, hand: 'palm' }),
  dab: (t, x, y, o = {}) => ({ tool: 'wipe', t0: t, t1: t + (o.dur ?? .07), path: sandPath([[x, y], [x + .5, y + .5]]), r: o.r ?? 6, strength: 1, keep: o.keep ?? 1, ease: t => t, hand: o.hand === undefined ? 'finger' : o.hand, quick: true }),
  comb: (t0, t1, pts, o = {}) => { const n = o.fingers ?? 4, sp = o.spacing ?? 26, base = sandPath(pts), out = []; for (let f = 0; f < n; f++) { const off = (f - (n - 1) / 2) * sp, P = []; for (let s = 0; s <= base.len; s += 8) { const q = sandPoint(base, s); P.push([q[0] - q[3] * off, q[1] + q[2] * off]); } out.push({ tool: 'wipe', t0, t1, path: sandPath(P), r: o.r ?? 7, strength: o.strength ?? 1, keep: o.keep ?? 1, ease: o.ease || easeIO, hand: f === Math.floor(n / 2) ? 'palm' : null }); } return out; },
  fill: (t0, t1, poly, o = {}) => { const tool = o.tool || 'pour', r = o.r ?? (tool === 'pour' ? 12 : 16), pts = scanFill(poly, o.spacing ?? r * 1.3, o.angle ?? 0); return tool === 'pour' ? G.pour(t0, t1, pts, { r, amount: o.amount ?? 1.4 }) : G.finger(t0, t1, pts, { r, strength: o.strength ?? 1, keep: o.keep ?? 1 }); },
  move: (t0, t1, pts, o = {}) => ({ tool: 'none', t0, t1, path: sandPath(pts), r: 1, ease: o.ease || easeIO, hand: o.hand || 'palm' }),
  // wind: sand inside the box creeps along (vx, vy) units per second, the thin top layer first, fading out over `feather`
  // units at the edges of the box so it never cuts a straight line through the drawing. Nobody's hand is in shot.
  wind: (t0, t1, o = {}) => ({ tool: 'wind', t0, t1, box: o.box || [0, 0, SAND.world, SAND.world], feather: o.feather ?? 160, vx: o.vx ?? 900, vy: o.vy ?? -60, strength: o.strength ?? .5, lift: o.lift ?? 1.4, turb: o.turb ?? .5, ease: o.ease || (t => t), hand: null, path: sandPath([[0, 0], [1, 1]]) }),
  // fly: a grain, a seed, a flake in the air. It is drawn over the bed while it travels and lands as a small pour.
  fly: (t0, t1, pts, o = {}) => ({ tool: 'fly', t0, t1, path: sandPath(pts), r: o.r ?? 5, light: !!o.light, land: o.land === undefined ? { r: o.r ?? 5, amount: 2.4 } : o.land, wob: o.wob ?? 0, seed: o.seed ?? 1, ease: o.ease || (t => t), hand: null }),
};
function sandFilm({ gestures, N = 540, world = null, hand = true, init = null }) { SAND.N = N; SAND.world = world || Math.max(W, H); SAND.h = new Float32Array(N * N); const all = gestures.flat(Infinity).sort((a, b) => a.t0 - b.t0);
  SAND.gestures = all; SAND.air = all.filter(g => g.tool === 'fly'); SAND.hand = hand; SAND.k = 0; SAND.view = null; SAND.tint = null; SAND.init = init; _sandReset(); _sandCheckpoints.clear();
  SAND.streak = new Float32Array(4096); let s = 7; for (let i = 0; i < 4096; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; SAND.streak[i] = s / 4294967296; } for (let pass = 0; pass < 2; pass++) for (let i = 1; i < 4095; i++) SAND.streak[i] = (SAND.streak[i - 1] + SAND.streak[i] * 2 + SAND.streak[i + 1]) / 4; }
// the bed at time zero: empty glass, or whatever init lays down (a table already covered in sand, see sandCover)
function _sandReset() { SAND.h.fill(0); SAND.seed = 1; if (SAND.init) SAND.init(SAND.h, SAND.N, SAND.world); }
// sandCover: an init that starts the film on a table already covered, inside box (world units), with soft edges.
// The most striking sand pictures are made by taking sand away: start covered and draw with the fingertip.
const sandCover = ({ box = null, amount = 3.2, grain = .5, feather = 140, seed = 3 } = {}) => (h, N, world) => { const k = N / world, r = rng(seed), [x0, y0, x1, y1] = box || [0, 0, world, world], fw = Math.max(1, feather * k);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const e = Math.min((i - x0 * k) / fw, (x1 * k - i) / fw, (j - y0 * k) / fw, (y1 * k - j) / fw); if (e <= 0) continue; h[j * N + i] += amount * (e >= 1 ? 1 : e * e * (3 - 2 * e)) * (1 - grain / 2 + grain * r()); } };
function sandLook(x, y, w) { SAND.view = (x === null || x === undefined) ? null : { x, y, w }; }
function sandTint(t) { SAND.tint = t; }
function sandViewRect(aw = OUT_W, ah = OUT_H) { const V = SAND.view || { x: SAND.world / 2, y: SAND.world / 2, w: SAND.world }; return { x: V.x, y: V.y, w: V.w, h: V.w * ah / aw }; }
const sandScale = () => W / sandViewRect().w;                                                  // frame units per world unit
function sandToScreen(x, y) { const V = sandViewRect(), s = W / V.w; return [CX + (x - V.x) * s, CY + (y - V.y) * s]; }

// ---------- the physics, such as it is ----------
function _pour(x, y, r, amount) { const N = SAND.N, h = SAND.h, R = Math.ceil(r * 2.2), s2 = r * r * .5, x0 = Math.max(0, Math.floor(x - R)), x1 = Math.min(N - 1, Math.ceil(x + R)), y0 = Math.max(0, Math.floor(y - R)), y1 = Math.min(N - 1, Math.ceil(y + R));
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const d2 = (i - x) * (i - x) + (j - y) * (j - y), g = Math.exp(-d2 / (2 * s2)); if (g < .02) continue; h[j * N + i] += amount * g * (.55 + .9 * _srand()); }
  for (let k = 0; k < 3; k++) { const a = _srand() * TAU, d = r * (1.5 + _srand() * 3.5), i = Math.round(x + Math.cos(a) * d), j = Math.round(y + Math.sin(a) * d); if (i >= 0 && j >= 0 && i < N && j < N) h[j * N + i] += .5 + _srand() * .5; }   // stray grains
  if (r > 4) _slump([x0, y0, x1, y1]); }
// _slump: sand steeper than the angle of repose falls to its lowest neighbour, so heaps become cones
function _slump(box, passes = 1, talus = 2.2) { const N = SAND.N, h = SAND.h, x0 = Math.max(1, box[0]), y0 = Math.max(1, box[1]), x1 = Math.min(N - 2, box[2]), y1 = Math.min(N - 2, box[3]);
  for (let p = 0; p < passes; p++) for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const q = j * N + i, hc = h[q]; if (hc < talus) continue;
      let bi = -1, bd = talus; for (const nb of [q - 1, q + 1, q - N, q + N]) { const d = hc - h[nb]; if (d > bd) { bd = d; bi = nb; } }
      if (bi >= 0) { const m = (bd - talus) * .25; h[q] -= m; h[bi] += m; } } }
function _sprinkle(x, y, R, grains, amount) { const N = SAND.N, h = SAND.h; for (let k = 0; k < grains; k++) { const a = _srand() * TAU, d = R * Math.sqrt(_srand()) * (.55 + .45 * _srand()), fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * .8, i = Math.floor(fx), j = Math.floor(fy); if (i < 1 || j < 1 || i >= N - 2 || j >= N - 2) continue;
    const tx = fx - i, ty = fy - j, v = amount * (.4 + 1.2 * _srand()), p = j * N + i; h[p] += v * (1 - tx) * (1 - ty); h[p + 1] += v * tx * (1 - ty); h[p + N] += v * (1 - tx) * ty; h[p + N + 1] += v * tx * ty; } }
// _wipe: a fingertip or a palm. The edge is ragged (each cell has its own threshold, so grains break off unevenly), and the
// sand it moves is pushed ahead and aside into a soft berm that fades with distance, never back into the trail.
const _cellNoise = (i, j) => SAND.streak[(Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) & 4095];
function _wipe(x, y, r, dx, dy, strength, streaks, keep = 1) {
  const N = SAND.N, h = SAND.h, rw = Math.max(3, r * .75), R = Math.ceil(r * 1.12 + rw + 1);
  const x0 = Math.max(0, Math.floor(x - R)), x1 = Math.min(N - 1, Math.ceil(x + R)), y0 = Math.max(0, Math.floor(y - R)), y1 = Math.min(N - 1, Math.ceil(y + R));
  let moved = 0, wsum = 0; const receivers = [];
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
    const ex = i - x, ey = j - y, d = Math.hypot(ex, ey), re = r * (.88 + .3 * _cellNoise(i, j)), p = j * N + i;
    if (d < re) {
      let k = clamp(strength, 0, 1) * (1 - sm(.5 * r, re, d, t => t));
      if (streaks) k *= 1 - clamp(streaks, 0, 1) * SAND.streak[(Math.round((ex * -dy + ey * dx) * 3 + 2048) & 4095)];
      const m = h[p] * k; h[p] -= m; moved += m;
    } else if (d < re + rw) {
      const f = (ex * dx + ey * dy) / (d || 1), wv = Math.max(0, (.3 + .9 * f) * (1 - (d - re) / rw)) * (.7 + .6 * _cellNoise(i + 9, j + 13));
      if (wv > 0) { receivers.push([p, wv]); wsum += wv; }
    }
  }
  if (!moved || keep <= 0) return;
  // At a table boundary, material with no receiver is explicitly carried away.
  if (wsum > 0) for (const [p, w] of receivers) h[p] += moved * clamp(keep, 0, 1) * w / wsum;
}
function _blow(g, dt) { const N = SAND.N, h = SAND.h, k = N / SAND.world, bx0 = Math.max(1, Math.floor(g.box[0] * k)), by0 = Math.max(1, Math.floor(g.box[1] * k)), bx1 = Math.min(N - 2, Math.ceil(g.box[2] * k)), by1 = Math.min(N - 2, Math.ceil(g.box[3] * k));
  const dx = g.vx * k * dt, dy = g.vy * k * dt, sx = dx >= 0 ? -1 : 1, s = g.strength, lift = g.lift, tb = g.turb, st = SAND.streak, fw = Math.max(1, (g.feather ?? 160) * k);
  for (let j = by0; j <= by1; j++) { const i0 = sx < 0 ? bx1 : bx0, i1 = sx < 0 ? bx0 : bx1, ey = Math.min(1, (j - by0) / fw, (by1 - j) / fw);
    for (let i = i0; sx < 0 ? i >= i1 : i <= i1; i += sx) { const p = j * N + i, hv = h[p]; if (hv < .05) continue;
      let e = Math.min(ey, (i - bx0) / fw, (bx1 - i) / fw); if (e <= 0) continue; e = e > 1 ? 1 : e * e * (3 - 2 * e);         // the gust fades out at the edges of its box, or it cuts the drawing
      const tu = st[(i * 7 + j * 13 + (SAND.k * 3)) & 4095] * .6 + st[(i * 23 + j * 3 + 900) & 4095] * .4;
      const take = Math.min(hv, lift) * s * e * (.6 + .8 * tu); if (take < .01) continue;
      const ti = Math.round(i + dx * e * (.7 + .6 * tu)), tj = Math.round(j + dy * e * (.7 + .6 * tu) + (tu - .5) * tb * 4);
      h[p] -= take; if (ti >= 0 && tj >= 0 && ti < N && tj < N) h[tj * N + ti] += take; } } }
function _applyGesture(g, ta, tb) { if (g.tool === 'none') return; const k = SAND.N / SAND.world;
  if (g.tool === 'wind') { if (tb > g.t0 && ta < g.t1) _blow(g, SAND_DT * g.ease(clamp((tb - g.t0) / Math.max(1e-6, g.t1 - g.t0), 0, 1) * 0 + 1)); return; }
  if (g.tool === 'fly') { if (g.land && ta <= g.t1 && tb > g.t1) { const q = sandPoint(g.path, g.path.len); _pour(q[0] * k, q[1] * k, (g.land.r ?? g.r) * k, g.land.amount ?? 2.4); } return; }
  const ua = g.ease(clamp((ta - g.t0) / (g.t1 - g.t0), 0, 1)), ub = g.ease(clamp((tb - g.t0) / (g.t1 - g.t0), 0, 1)); if (ub <= ua && !(g.quick && ta <= g.t0)) return; const sa = ua * g.path.len, sb = ub * g.path.len, r = g.r * k;
  if (g.tool === 'sprinkle') { const q = sandPoint(g.path, (sa + sb) / 2), area = r * r; _sprinkle(q[0] * k, q[1] * k, r, Math.max(1, Math.round(area * .075 * g.amount)), .42); return; }
  const step = Math.max(.8, r * (g.tool === 'pour' ? .5 : .22)) / k; for (let s = sa; s <= sb + 1e-9; s += step) { const q = sandPoint(g.path, s); if (g.tool === 'pour') _pour(q[0] * k, q[1] * k, r, g.amount * .42); else _wipe(q[0] * k, q[1] * k, r, q[2], q[3], g.strength, g.streaks || 0, g.keep ?? 1); if (sb - sa < 1e-6) break; } }
function sandAdvance(t) {
  const K = Math.max(0, Math.floor(t / SAND_DT + 1e-6));
  if (K < SAND.k) {
    let best = 0, snapshot = null;
    for (const [k, value] of _sandCheckpoints) if (k <= K && k > best) { best = k; snapshot = value; }
    if (snapshot) { SAND.h.set(snapshot.h); SAND.seed = snapshot.seed; SAND.k = best; }
    else { _sandReset(); SAND.k = 0; }
  }
  while (SAND.k < K) {
    const ta = SAND.k * SAND_DT, tb = ta + SAND_DT;
    for (const g of SAND.gestures) { if (g.t0 >= tb) break; if (g.t1 > ta - SAND_DT) _applyGesture(g, ta, tb); }
    SAND.k++;
    if (SAND.k % 96 === 0 && !_sandCheckpoints.has(SAND.k)) {
      _sandCheckpoints.set(SAND.k, { h: SAND.h.slice(), seed: SAND.seed });
      if (_sandCheckpoints.size > 12) _sandCheckpoints.delete(_sandCheckpoints.keys().next().value);
    }
  }
}

// ---------- the look ----------
const _sandTex = new Map();
// Bilinearly sampled grain in table coordinates, independent of output resolution.
const _sandGrainTile = Float32Array.from({length: 512 * 512}, (_, i) => hash(i, 99));
function _sandGrain(x, y) { const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy; const at = (a, b) => _sandGrainTile[((b & 511) * 512) + (a & 511)]; return lerp(lerp(at(ix, iy), at(ix + 1, iy), tx), lerp(at(ix, iy + 1), at(ix + 1, iy + 1), tx), ty); }
function _sandTextures(w, h) { const key = w + 'x' + h; if (_sandTex.has(key)) return _sandTex.get(key); const t = { img: new ImageData(w, h) }; _sandTex.set(key, t); return t; }
// sandImage: the bed as pixels, any size, through the current camera. live = { clear, ridge } (see sandLive) changes what is
// shown without touching the bed: the sand is thinned where clear is set and heaped where ridge is set.
function sandImage(w = OUT_W, h = OUT_H, live = null) { const T = _sandTextures(w, h), N = SAND.N, hf = SAND.h, out = T.img.data, V = sandViewRect(w, h), kc = (N - 1) / SAND.world;
  const stepx = V.w / w, stepy = V.h / h, wx0 = V.x - V.w / 2, wy0 = V.y - V.h / 2, lx = SAND.world / 2, ly = SAND.world * .46, inv = 1 / SAND.world, tn = SAND.tint;
  const tr = tn ? tn[0] : 1, tg = tn ? tn[1] : 1, tb2 = tn ? tn[2] : 1;
  for (let y = 0; y < h; y++) { const wy = wy0 + (y + .5) * stepy, fy = clamp(wy * kc, 0, N - 1.001), j = fy | 0, ty = fy - j, row = j * N, dv = (wy - ly) * inv;
    for (let x = 0; x < w; x++) { const wx = wx0 + (x + .5) * stepx, fx = clamp(wx * kc, 0, N - 1.001), i = fx | 0, tx = fx - i, p0 = row + i;
      const a0 = hf[p0] + (hf[p0 + 1] - hf[p0]) * tx, a1 = hf[p0 + N] + (hf[p0 + N + 1] - hf[p0 + N]) * tx; let hh = a0 + (a1 - a0) * ty; const p = y * w + x;
      if (live) { const m = live.clear[p0] / 255, rd = live.ridge[p0] / 255; hh = hh * (1 - .94 * m) + rd * 1.9; }
      const du = (wx - lx) * inv * 1.05, d2 = du * du + dv * dv, hot = 1 / (1 + 3.1 * d2 + 2.6 * d2 * d2); let e = (Math.sqrt(d2) - .5) / .28; e = e < 0 ? 0 : e > 1 ? 1 : e; const edge = e * e * (3 - 2 * e);
      const cov = 1 - Math.exp(-hh * 1.25); const gr = .65 * _sandGrain(wx * 1.7, wy * 1.7) + .35 * _sandGrain(wx * .43 + 71, wy * .43 + 29); let a = (cov - gr) * 6 + .5; a = a < 0 ? 0 : a > 1 ? 1 : a; const dep = hh > 2.6 ? 1 : hh / 2.6, dim = 1 - .3 * cov, q = p * 4;
      out[q] = ((250 * hot + 226 * (1 - hot)) * (1 - .62 * edge) * tr) * dim * (1 - a) + (118 - 94 * dep) * a;
      out[q + 1] = ((232 * hot + 168 * (1 - hot)) * (1 - .7 * edge) * tg) * dim * (1 - a) + (66 - 53 * dep) * a;
      out[q + 2] = ((196 * hot + 92 * (1 - hot)) * (1 - .8 * edge) * tb2) * dim * (1 - a) + (26 - 19 * dep) * a; out[q + 3] = 255; } }
  return T.img; }
function sandRender(c, live = null) { const img = sandImage(OUT_W, OUT_H, live); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(img, 0, 0); c.restore(); }
// sandLive: rasterise closed polygons (world units) into the clear and ridge masks at bed resolution.
// lines = [{ p, w }] are drawn in heaped sand inside the shape (the pen strokes of a roto pose), heap = polygons filled
// with heaped sand (a bird in the air, made of the same sand as everything else).
let _liveA = null, _liveB = null;
function sandLive(polys, ridgeW = 9, lines = null, heap = null) { const N = SAND.N, k = N / SAND.world; if (!_liveA || _liveA.width !== N) { _liveA = document.createElement('canvas'); _liveB = document.createElement('canvas'); _liveA.width = _liveA.height = _liveB.width = _liveB.height = N; }
  const path = new Path2D(); for (const pl of polys) { pl.forEach((q, i) => i ? path.lineTo(q[0] * k, q[1] * k) : path.moveTo(q[0] * k, q[1] * k)); path.closePath(); }
  const ga = _liveA.getContext('2d', { willReadFrequently: true }), gb = _liveB.getContext('2d', { willReadFrequently: true }); ga.clearRect(0, 0, N, N); ga.fillStyle = '#fff'; ga.fill(path, 'evenodd'); gb.clearRect(0, 0, N, N); gb.strokeStyle = '#fff'; gb.lineWidth = ridgeW * k; gb.lineJoin = 'round'; gb.lineCap = 'round'; gb.stroke(path);
  if (lines) for (const l of lines) { gb.lineWidth = Math.max(1.2, l.w * k); gb.beginPath(); l.p.forEach((q, i) => i ? gb.lineTo(q[0] * k, q[1] * k) : gb.moveTo(q[0] * k, q[1] * k)); gb.stroke(); }
  if (heap) { gb.fillStyle = '#fff'; for (const pl of heap) { gb.beginPath(); pl.forEach((q, i) => i ? gb.lineTo(q[0] * k, q[1] * k) : gb.moveTo(q[0] * k, q[1] * k)); gb.closePath(); gb.fill(); } }
  const A = ga.getImageData(0, 0, N, N).data, B = gb.getImageData(0, 0, N, N).data, clear = new Uint8Array(N * N), ridge = new Uint8Array(N * N); for (let p = 0; p < N * N; p++) { clear[p] = A[p * 4 + 3]; ridge[p] = B[p * 4 + 3]; } return { clear, ridge }; }

// ---------- what flies over the bed ----------
function sandAir(c, t) { if (!SAND.air.length) return; const s = sandScale(); c.save(); resetT(c);
  for (const g of SAND.air) { if (t < g.t0 || t > g.t1) continue; const u = g.ease(clamp((t - g.t0) / (g.t1 - g.t0), 0, 1)), q = sandPoint(g.path, u * g.path.len), r0 = rng(g.seed * 13 + 1), wob = g.wob ? Math.sin(u * 22 + g.seed) * g.wob : 0;
    const [sx, sy] = sandToScreen(q[0] - q[3] * wob, q[1] + q[2] * wob), rr = Math.max(.7, g.r * s);
    c.fillStyle = g.light ? '#fdf3d8' : '#2e2112'; c.globalAlpha = g.light ? .9 : .85; c.beginPath(); c.arc(sx, sy, rr, 0, TAU); c.fill();
    for (let n = 0; n < 2; n++) { const a = r0() * TAU, d = rr * (1.4 + r0() * 1.8); c.globalAlpha *= .6; c.beginPath(); c.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, rr * .5, 0, TAU); c.fill(); } }
  c.restore(); }

// ---------- the hand: a soft shadow that does the work ----------
let _handCv = null;
function _handState(t) { const gs = SAND.gestures.filter(g => g.hand !== null); let act = null; for (const g of gs) if (t >= g.t0 && t <= g.t1) { act = g; break; }
  const at = g => { const q = sandPoint(g.path, g.ease(clamp((t - g.t0) / (g.t1 - g.t0), 0, 1)) * g.path.len); return [q[0], q[1]]; };
  if (act) return { p: at(act), lift: act.hover ? .55 : 0, kind: act.hand || (act.hover ? 'fist' : 'finger'), a: 1 };
  let prev = null, next = null; for (const g of gs) { if (g.t1 < t) prev = g; else if (g.t0 > t) { next = g; break; } }
  const RV = sandViewRect(), rest = [RV.x + RV.w * .85, RV.y + RV.h * .95], pe = prev ? sandPoint(prev.path, prev.path.len) : rest, ns = next ? sandPoint(next.path, 0) : rest, dtp = prev ? t - prev.t1 : 9, dtn = next ? next.t0 - t : 9, gap = prev && next ? next.t0 - prev.t1 : 9;
  if (gap < 1.2) { const u = easeIO(dtp / gap); return { p: [lerp(pe[0], ns[0], u), lerp(pe[1], ns[1], u)], lift: .8 * Math.sin(u * Math.PI) + .1, kind: next.hand || 'fist', a: 1 }; }
  if (dtn < .6) { const u = easeOut(1 - dtn / .6); return { p: [lerp(rest[0], ns[0], u), lerp(rest[1], ns[1], u)], lift: 1 - u * .6, kind: next.hand || 'fist', a: u }; }
  if (dtp < .6) { const u = easeIn(dtp / .6); return { p: [lerp(pe[0], rest[0], u), lerp(pe[1], rest[1], u)], lift: .3 + u * .7, kind: prev.hand || 'fist', a: 1 - u }; }
  return null; }
function sandHand(c, t) { const st = _handState(t); if (!st || st.a <= .01) return; const q = 9; if (!_handCv || _handCv.width !== Math.ceil(W / q) || _handCv.height !== Math.ceil(H / q)) { _handCv = document.createElement('canvas'); _handCv.width = Math.ceil(W / q); _handCv.height = Math.ceil(H / q); } const g = _handCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, _handCv.width, _handCv.height); g.setTransform(1 / q, 0, 0, 1 / q, 0, 0);
  const sc0 = sandScale(), [px, py] = sandToScreen(st.p[0], st.p[1]), off = st.lift * 70 * sc0, tx = px + off * .5, ty = py + off, sh = [W + 200, H + 520], dx = sh[0] - tx, dy = sh[1] - ty, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl, nx = -uy, ny = ux, s = (1 + st.lift * .3) * sc0;
  g.fillStyle = '#1c0e05'; g.strokeStyle = '#1c0e05'; g.lineCap = 'round'; g.lineJoin = 'round';
  const at = (along, side) => [tx + ux * along * s + nx * side * s, ty + uy * along * s + ny * side * s], seg = (a, b, w) => { g.lineWidth = w * s; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }, blob = (p, rx, ry) => { g.beginPath(); g.ellipse(p[0], p[1], rx * s, ry * s, Math.atan2(uy, ux), 0, TAU); g.fill(); };
  if (st.kind === 'finger') { seg(at(6, 0), at(104, 3), 23); blob(at(160, 14), 66, 58); seg(at(128, -44), at(84, -50), 27); seg(at(118, 40), at(100, 52), 30); }
  else if (st.kind === 'palm') { [[12, -44, 26], [0, -15, 27], [8, 15, 27], [34, 44, 24]].forEach(([tip, side, w]) => seg(at(tip + 12, side * 1.05), at(112, side * .8), w)); blob(at(160, 2), 70, 66); seg(at(150, -64), at(84, -104), 29); }
  else { blob(at(64, 0), 64, 58); seg(at(40, -52), at(88, -48), 30); }
  const w0 = st.kind === 'fist' ? [118, 6] : [212, 14]; g.lineWidth = 86 * s; g.beginPath(); g.moveTo(...at(w0[0], w0[1])); g.lineTo(...at(w0[0] + 110, w0[1] + 12)); g.stroke(); g.lineWidth = 104 * s; g.beginPath(); g.moveTo(...at(w0[0] + 110, w0[1] + 12)); g.lineTo(...at(dl / s + 80, 60)); g.stroke();
  c.save(); resetT(c); c.globalCompositeOperation = 'multiply'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.globalAlpha = (.46 - st.lift * .2) * st.a; c.drawImage(_handCv, 0, 0, W, H); c.globalAlpha *= .55; c.drawImage(_handCv, (10 + st.lift * 30) * sc0, (14 + st.lift * 40) * sc0, W, H); c.restore(); }
function sandFrame(c, t, live = null) { sandAdvance(t); sandRender(c, live); sandAir(c, t); if (SAND.hand) sandHand(c, t); resetT(c); }
