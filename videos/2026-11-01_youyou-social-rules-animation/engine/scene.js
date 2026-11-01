// The park page (drawn once per episode into a cache) and the props (drawn live).
import { C, INK, PAPER, blob, ellipsePts, shape, fill, line, stroke, polyPts, hash, mulberry, pathClosed } from './crayon.js';

export const WORLD = { x0: -300, y0: -900, w: 3500, h: 3300 };
export const GROUND = 1500, HORIZON = 1130;

function wash(ctx, x0, y0, x1, y1, color, seed, alpha = 0.18) {
  // watercolour: overlapping soft blooms, darker edge pools
  const r = mulberry(seed);
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rad = 180 + r() * 380;
    const g = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad);
    g.addColorStop(0, color); g.addColorStop(0.85, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha * (0.5 + r() * 0.6); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawPark(ctx, set, seed = 1) {
  const { x0, y0, w, h } = WORLD;
  ctx.fillStyle = PAPER; ctx.fillRect(x0, y0, w, h);
  // sky: one watercolour, ultramarine-light; resisted by the white-wax clouds
  wash(ctx, x0, y0, x0 + w, HORIZON - 60, set.sky || '#9ccbe8', seed + 1, 0.22);
  const g = ctx.createLinearGradient(0, HORIZON - 500, 0, HORIZON);
  g.addColorStop(0, 'rgba(244,239,227,0)'); g.addColorStop(1, 'rgba(244,239,227,0.85)');
  ctx.fillStyle = g; ctx.fillRect(x0, HORIZON - 500, w, 520);
  // sun (top-left), with rays
  const sx = set.sun ? set.sun[0] : 260, sy = set.sun ? set.sun[1] : -420;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; stroke(ctx, [[sx + Math.cos(a) * 150, sy + Math.sin(a) * 150], [sx + Math.cos(a) * 215, sy + Math.sin(a) * 215]], C.orange, 14, seed + i); }
  blob(ctx, sx, sy, 120, 116, set.sunColor || C.mustard, { seed: seed + 20, w: 7, lineColor: C.orange, cross: true });
  // white-wax clouds
  const r = mulberry(seed + 5);
  for (const [cx, cy, s] of set.clouds || [[900, -700, 1], [1900, -300, 1.2], [2900, -760, 0.9], [-100, 200, 0.8], [1450, 380, 0.7], [2600, 520, 0.8]]) {
    for (let i = 0; i < 4; i++) blob(ctx, cx + (i - 1.5) * 110 * s, cy + (i % 2 ? -40 : 10) * s, 110 * s, 70 * s, C.white, { seed: seed + 30 + i + cx, w: 5, lineColor: '#7aa7c7', lineAlpha: 0.7, press: 1 });
  }
  // birds
  for (const [bx, by] of [[1200, -120], [1290, -170], [2300, -950]]) stroke(ctx, [[bx - 26, by], [bx - 10, by - 14], [bx, by], [bx + 10, by - 14], [bx + 26, by]], INK, 5, seed + bx);
  // far hills
  for (let i = 0; i < 6; i++) {
    const hx = x0 + i * 760 + r() * 200;
    blob(ctx, hx, HORIZON + 30, 520, 190, i % 2 ? '#9cc27a' : '#7fb08a', { seed: seed + 60 + i, w: 6, press: 0.8 });
  }
  // grass
  const grass = polyPts([[x0, HORIZON + 70], [x0 + w * 0.3, HORIZON + 50], [x0 + w * 0.6, HORIZON + 80], [x0 + w, HORIZON + 55], [x0 + w, y0 + h], [x0, y0 + h]], seed + 70, 4);
  fill(ctx, grass, C.grass, { seed: seed + 70, gap: 10, press: 0.85, angle: -0.35, cross: true });
  stroke(ctx, grass.slice(0, 4), '#4f7f36', 7, seed + 71);
  // a path of sand-coloured crayon
  if (set.path !== false) fill(ctx, polyPts([[x0, 1640], [800, 1600], [1700, 1660], [2600, 1610], [x0 + w, 1650], [x0 + w, 1760], [2600, 1720], [1700, 1780], [800, 1720], [x0, 1760]], seed + 72, 6), '#e8cf9a', { seed: seed + 72, press: 0.8, gap: 9 });
  // tufts
  for (let i = 0; i < 160; i++) {
    const tx = x0 + r() * w, ty = HORIZON + 120 + r() * (y0 + h - HORIZON - 150);
    if (ty > 1590 && ty < 1790) continue;
    stroke(ctx, [[tx - 10, ty], [tx - 14, ty - 22]], '#4f7f36', 5, seed + i); stroke(ctx, [[tx, ty], [tx + 2, ty - 28]], '#4f7f36', 5, seed + i + 1); stroke(ctx, [[tx + 10, ty], [tx + 16, ty - 20]], '#4f7f36', 5, seed + i + 2);
  }
  if (set.flowers) for (let i = 0; i < 46; i++) {
    const fx = x0 + 100 + r() * (w - 200), fy = HORIZON + 180 + r() * 1300;
    if (fy > 1580 && fy < 1800) continue;
    const col = [C.pink, C.coral, C.lemon, C.white][i % 4];
    stroke(ctx, [[fx, fy], [fx + 3, fy - 30]], C.leaf, 5, seed + i);
    for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; blob(ctx, fx + 3 + Math.cos(a) * 12, fy - 38 + Math.sin(a) * 12, 9, 9, col, { seed: seed + i * 7 + p, w: 2.6 }); }
    blob(ctx, fx + 3, fy - 38, 6, 6, C.mustard, { seed: seed + i, outline: false, press: 1.3 });
  }
  for (const tx of set.trees || []) tree(ctx, tx, HORIZON + 300, seed + tx);
  if (set.bigtree) tree(ctx, set.bigtree, HORIZON + 330, seed + 9, 1.35);
  if (set.slide) slide(ctx, set.slide, HORIZON + 330, seed + 11);
  if (set.sandpit) sandpit(ctx, set.sandpit[0], set.sandpit[1], seed + 13);
  for (const b of set.benches || []) bench(ctx, b[0], b[1], seed + 15 + b[0]);
  if (set.basket) basket(ctx, set.basket[0], set.basket[1], seed + 17);
  if (set.mat) mat(ctx, set.mat[0], set.mat[1], seed + 19);
}

export function tree(ctx, x, y, seed, s = 1) {
  shape(ctx, polyPts([[x - 40 * s, y], [x - 26 * s, y - 330 * s], [x + 26 * s, y - 330 * s], [x + 44 * s, y]], seed, 3), C.brown, { seed, w: 6 });
  for (const [dx, dy, rx, ry] of [[-120, -380, 150, 130], [120, -390, 150, 130], [0, -520, 190, 150], [-60, -300, 130, 100], [80, -290, 130, 100]])
    blob(ctx, x + dx * s, y + dy * s, rx * s, ry * s, C.leaf, { seed: seed + dx + dy, w: 6, press: 0.9, cross: true });
  for (let i = 0; i < 7; i++) blob(ctx, x + (hash(i, seed) - 0.5) * 300 * s, y - (300 + hash(seed, i) * 260) * s, 13 * s, 13 * s, C.red, { seed: seed + i, w: 3 });
}
function slide(ctx, x, y, seed) {
  stroke(ctx, [[x - 120, y], [x - 120, y - 300]], C.teal, 14, seed); stroke(ctx, [[x - 40, y], [x - 40, y - 300]], C.teal, 14, seed + 1);
  for (let i = 1; i < 6; i++) stroke(ctx, [[x - 120, y - i * 50], [x - 40, y - i * 50]], C.teal, 9, seed + i);
  blob(ctx, x - 80, y - 310, 70, 18, C.mustard, { seed: seed + 9, w: 5 });
  shape(ctx, polyPts([[x - 40, y - 310], [x + 10, y - 316], [x + 260, y - 30], [x + 300, y - 6], [x + 250, y + 6], [x + 210, y - 10]], seed + 10, 3), C.coral, { seed: seed + 10, w: 5.5 });
}
function sandpit(ctx, x, y, seed) {
  blob(ctx, x, y, 360, 92, C.tan, { seed, w: 6, press: 1 });
  blob(ctx, x, y + 4, 320, 70, '#f0d79a', { seed: seed + 1, w: 4, press: 0.9, lineAlpha: 0.6 });
  for (let i = 0; i < 30; i++) blob(ctx, x + (hash(i, seed) - 0.5) * 560, y + (hash(seed, i) - 0.5) * 100, 3, 3, C.tan, { seed: seed + i, outline: false, press: 1.2 });
}
export function bench(ctx, x, y, seed) {
  for (const dx of [-150, 150]) stroke(ctx, [[x + dx, y], [x + dx, y - 110]], C.brown, 14, seed + dx);
  shape(ctx, polyPts([[x - 200, y - 110], [x + 200, y - 110], [x + 210, y - 86], [x - 210, y - 86]], seed + 1, 2), '#c98b4a', { seed: seed + 1, w: 5 });
  for (const yy of [-210, -160]) shape(ctx, polyPts([[x - 200, y + yy], [x + 200, y + yy], [x + 200, y + yy + 26], [x - 200, y + yy + 26]], seed + yy, 2), '#c98b4a', { seed: seed + yy, w: 5 });
  for (const dx of [-160, 160]) stroke(ctx, [[x + dx, y - 110], [x + dx, y - 216]], C.brown, 12, seed + dx + 3);
}
function basket(ctx, x, y, seed) {
  shape(ctx, polyPts([[x - 70, y - 100], [x + 70, y - 100], [x + 56, y], [x - 56, y]], seed, 3), '#c98b4a', { seed, w: 5.5, cross: true });
  for (let i = 0; i < 3; i++) stroke(ctx, [[x - 64 + i * 3, y - 72 + i * 26], [x + 64 - i * 3, y - 72 + i * 26]], C.brown, 4, seed + i);
  stroke(ctx, [[x - 70, y - 100], [x + 70, y - 100]], C.brown, 8, seed + 9);
}
function mat(ctx, x, y, seed) {
  const p = polyPts([[x - 260, y - 70], [x + 250, y - 80], [x + 290, y + 60], [x - 290, y + 70]], seed, 4);
  fill(ctx, p, C.coral, { seed, press: 0.8, gap: 8 });
  for (let i = -3; i <= 3; i++) stroke(ctx, [[x + i * 75 - 12, y - 74], [x + i * 82 + 10, y + 64]], C.white, 12, seed + i, 0.8);
  line(ctx, p, { w: 5, seed });
}

// ---------- props ----------
export const PROPS = {
  pinwheel(ctx, p, k, held) {
    const { x, y } = p, rot = (p.rot || 0) * Math.PI / 180;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    stroke(ctx, [[0, 18], [0, -120]], C.brown, 7, k.step);
    const spin = held ? k.t * 5 : 0.4;
    ctx.translate(0, -125); ctx.rotate(spin);
    const cols = [C.red, C.mustard, C.teal, C.pink];
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); shape(ctx, polyPts([[0, 0], [10, -46], [46, -40]], k.step + i, 1.5), cols[i], { seed: k.step + i, w: 3.6 }); }
    blob(ctx, 0, 0, 7, 7, C.white, { seed: k.step, w: 3 });
    ctx.restore();
  },
  bucket(ctx, p, k) {
    const { x, y } = p, sd = k.step;
    shape(ctx, polyPts([[x - 44, y - 78], [x + 44, y - 78], [x + 34, y], [x - 34, y]], sd, 2), C.mustard, { seed: sd, w: 4.6 });
    stroke(ctx, [[x - 40, y - 78], [x - 30, y - 118], [x + 30, y - 118], [x + 40, y - 78]], INK, 4, sd + 1);
    if (p.leaves) for (let i = 0; i < 4; i++) blob(ctx, x - 24 + i * 16, y - 84, 12, 7, [C.orange, C.red, C.mustard, C.leaf][i], { rot: i, seed: sd + i, w: 2.6 });
  },
  shovel(ctx, p, k, held) {
    const { x, y } = p, rot = held ? 0.5 : (p.rot || 0) * Math.PI / 180;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    stroke(ctx, [[0, -10], [0, 52]], C.red, 8, k.step);
    shape(ctx, polyPts([[-16, 50], [16, 50], [12, 84], [0, 92], [-12, 84]], k.step, 1.5), C.red, { seed: k.step, w: 3.6 });
    ctx.restore();
  },
  ball(ctx, p, k) { blob(ctx, p.x, p.y - 34, 34, 34, C.red, { seed: k.step, w: 4.6 }); stroke(ctx, [[p.x - 24, p.y - 50], [p.x - 12, p.y - 58]], C.white, 6, k.step); },
  car(ctx, p, k) {
    const { x, y } = p, sd = k.step, f = p.f || 1;
    shape(ctx, polyPts([[x - 62, y - 24], [x - 56, y - 56], [x - 20 * f, y - 60], [x - 6 * f, y - 92], [x + 34 * f, y - 92], [x + 46 * f, y - 58], [x + 62, y - 50], [x + 62, y - 24]], sd, 2), C.mustard, { seed: sd, w: 4.4 });
    blob(ctx, x + 14 * f, y - 74, 14, 11, C.sky, { seed: sd + 1, w: 3 });
    for (const dx of [-36, 36]) { blob(ctx, x + dx, y - 20, 17, 17, INK, { seed: sd + dx, w: 3, press: 1.2 }); blob(ctx, x + dx, y - 20, 6, 6, C.white, { seed: sd + dx, outline: false, knock: false }); }
  },
  leaves(ctx, p, k) {
    for (let i = 0; i < 9; i++) blob(ctx, p.x + (hash(i, 3) - 0.5) * 220, p.y - 6 + (hash(3, i) - 0.5) * 40, 14, 8, [C.orange, C.red, C.mustard, C.leaf][i % 4], { rot: i, seed: k.step + i, w: 2.6 });
  },
  cookiebox(ctx, p, k) {
    const { x, y } = p, sd = k.step;
    shape(ctx, polyPts([[x - 46, y - 56], [x + 46, y - 56], [x + 46, y], [x - 46, y]], sd, 2), C.sky, { seed: sd, w: 4.4 });
    for (let i = 0; i < 3; i++) blob(ctx, x - 24 + i * 24, y - 60, 13, 7, '#d9a05a', { seed: sd + i, w: 2.6 });
  },
  cookie(ctx, p, k) { blob(ctx, p.x, p.y, 18, 17, '#d9a05a', { seed: k.step, w: 3.4 }); for (let i = 0; i < 3; i++) blob(ctx, p.x - 6 + i * 6, p.y - 4 + (i % 2) * 7, 2.6, 2.6, INK, { seed: k.step + i, outline: false, press: 1.4 }); },
  applebox(ctx, p, k) {
    const { x, y } = p, sd = k.step;
    shape(ctx, polyPts([[x - 50, y - 40], [x + 50, y - 40], [x + 46, y], [x - 46, y]], sd, 2), C.pink, { seed: sd, w: 4.4 });
    for (let i = 0; i < 3; i++) blob(ctx, x - 26 + i * 26, y - 44, 15, 9, C.cream, { seed: sd + i, w: 2.6, lineColor: C.red });
  },
  apple(ctx, p, k) { blob(ctx, p.x, p.y, 16, 10, C.cream, { seed: k.step, w: 3, lineColor: C.red, rot: 0.3 }); },
  corn(ctx, p, k) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot ?? -40) * Math.PI / 180);
    blob(ctx, 0, -10, 15, 46, C.lemon, { seed: k.step, w: 3.6 });
    for (let i = 0; i < 4; i++) stroke(ctx, [[-10, -40 + i * 18], [10, -40 + i * 18]], C.mustard, 3, k.step + i);
    shape(ctx, polyPts([[-14, 20], [0, 50], [14, 20]], k.step, 2), C.leaf, { seed: k.step, w: 3 });
    ctx.restore();
  },
  smell(ctx, p, k) {
    for (let i = 0; i < 3; i++) {
      const ph = ((k.t * 0.8 + i / 3) % 1), yy = p.y - ph * 120, a = Math.sin(ph * Math.PI);
      stroke(ctx, [[p.x - 30 + i * 30, yy], [p.x - 20 + i * 30, yy - 18], [p.x - 30 + i * 30, yy - 36], [p.x - 20 + i * 30, yy - 54]], C.coral, 5, k.step + i, a);
    }
  },
};
// where a held prop sits relative to the hand
export const GRIP = { pinwheel: [0, 0], shovel: [0, 0], ball: [0, 30], car: [0, 30], cookie: [6, 0], cookiebox: [0, 50], applebox: [0, 40], apple: [0, 0], corn: [0, 0], bucket: [0, 60] };
