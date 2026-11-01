// Crayon primitives: seeded noise, wobbly closed shapes, hatched wax fills, crayon outlines, paper.
export const PAPER = '#f4efe3';
export const INK = '#4b3049';          // the one dark outline crayon (plum), never black
export const C = {
  brown: '#a8683a', tan: '#c99a6a', cream: '#f3dfb4', coral: '#ec7a5c', mustard: '#e9b43a', lemon: '#f5d64c',
  grass: '#86b24a', leaf: '#4f8a3c', sky: '#8cc4e6', pink: '#f2a0b4', lavender: '#a58ad0', teal: '#4fa3a5',
  orange: '#ef9645', red: '#e05a4f', white: '#fffdf7', grey: '#b9ada0',
};

export function hash(...a) {
  let h = 2166136261;
  for (const v of a) { h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
export function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// smooth 1D value noise
export function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash(i, seed) * (1 - u) + hash(i + 1, seed) * u) * 2 - 1;
}

// points of an ellipse with hand wobble; boil = seed that changes on twos
export function ellipsePts(cx, cy, rx, ry, rot = 0, seed = 0, wob = 1.5, n = 0) {
  n = n || Math.max(14, Math.min(48, Math.round((rx + ry) / 6)));
  const pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = 1 + 0.025 * vnoise(i * 0.9, seed * 7 + 3);
    let x = Math.cos(a) * rx * w + (hash(i, seed, 1) - 0.5) * wob;
    let y = Math.sin(a) * ry * w + (hash(i, seed, 2) - 0.5) * wob;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return pts;
}
export function polyPts(list, seed = 0, wob = 1.5) {
  return list.map(([x, y], i) => [x + (hash(i, seed, 5) - 0.5) * wob, y + (hash(i, seed, 6) - 0.5) * wob]);
}
// closed Catmull-Rom path through points
export function pathClosed(ctx, pts) {
  const n = pts.length; ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  ctx.closePath();
}
export function pathOpen(ctx, pts) {
  const n = pts.length; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function bbox(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}

// Wax colouring: knock-out to paper, a light base, then zig-zag hatching that overshoots the outline a little.
export function fill(ctx, pts, color, o = {}) {
  const { press = 0.85, angle = -0.6, gap = 7, knock = true, seed = 0, over = 2.5, cross = false } = o;
  ctx.save();
  if (knock) { pathClosed(ctx, pts); ctx.fillStyle = PAPER; ctx.fill(); }
  // overshoot: shift the colour path a few px off the line
  const ox = (hash(seed, 11) - 0.5) * over * 2, oy = (hash(seed, 12) - 0.5) * over * 2;
  const sp = pts.map(([x, y]) => [x + ox, y + oy]);
  pathClosed(ctx, sp);
  ctx.globalAlpha = 0.42 * press; ctx.fillStyle = color; ctx.fill();
  ctx.clip();
  const [x0, y0, x1, y1] = bbox(sp);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + gap;
  const hatch = (ang, alpha, g) => {
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = g * 0.95; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.beginPath();
    let k = 0;
    for (let d = -R; d <= R; d += g, k++) {
      const j = (hash(k, seed, 7) - 0.5) * g * 0.5;
      const ax = cx + ca * -R - sa * (d + j), ay = cy + sa * -R + ca * (d + j);
      const bx = cx + ca * R - sa * (d + j * 0.6), by = cy + sa * R + ca * (d + j * 0.6);
      if (k % 2) { ctx.moveTo(bx, by); ctx.lineTo(ax, ay); } else { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
    }
    ctx.stroke();
  };
  hatch(angle, 0.62 * press, gap);
  if (cross) hatch(angle + 1.1, 0.25 * press, gap * 1.4);
  ctx.restore();
}

// Crayon line: a main ribbon plus a thinner offset streak.
export function line(ctx, pts, o = {}) {
  const { w = 5, color = INK, closed = true, seed = 0, alpha = 1 } = o;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
  (closed ? pathClosed : pathOpen)(ctx, pts);
  ctx.globalAlpha = 0.9 * alpha; ctx.lineWidth = w; ctx.stroke();
  const dx = (hash(seed, 21) - 0.5) * w * 0.5, dy = (hash(seed, 22) - 0.5) * w * 0.5;
  const p2 = pts.map(([x, y]) => [x + dx, y + dy]);
  (closed ? pathClosed : pathOpen)(ctx, p2);
  ctx.globalAlpha = 0.45 * alpha; ctx.lineWidth = w * 0.45; ctx.stroke();
  ctx.restore();
}
export function shape(ctx, pts, color, o = {}) {
  if (color) fill(ctx, pts, color, o);
  if (o.outline !== false) line(ctx, pts, { w: o.w ?? 5, seed: o.seed, color: o.lineColor ?? INK, alpha: o.lineAlpha ?? 1 });
}
export function blob(ctx, cx, cy, rx, ry, color, o = {}) {
  const pts = ellipsePts(cx, cy, rx, ry, o.rot || 0, o.seed || 0, o.wob ?? 1.6);
  shape(ctx, pts, color, o); return pts;
}
// a tube between two points (limbs)
export function tubePts(ax, ay, bx, by, wa, wb, bend = 0, seed = 0) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
  const side = (s) => [[ax + nx * wa * s, ay + ny * wa * s], [mx + nx * (wa + wb) / 2 * s, my + ny * (wa + wb) / 2 * s], [bx + nx * wb * s, by + ny * wb * s]];
  const A = side(1), B = side(-1).reverse();
  return polyPts([...A, ...B], seed, 1.2);
}
export function stroke(ctx, pts, color, w, seed = 0, alpha = 1) { line(ctx, pts, { w, color, closed: false, seed, alpha }); }

// Paper: tooth + fibre, tiled; specks: paper-coloured dots that make wax skip on the peaks.
export function makePaperTiles(size = 512) {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  const grain = mk(), speck = mk(), g = grain.getContext('2d'), s = speck.getContext('2d');
  const gi = g.createImageData(size, size), si = s.createImageData(size, size);
  const r = mulberry(7);
  const lat = (x, y, f, sd) => { // tileable value noise
    const X = x * f / size, Y = y * f / size, xi = Math.floor(X), yi = Math.floor(Y), xf = X - xi, yf = Y - yi;
    const h = (a, b) => hash(((a % f) + f) % f, ((b % f) + f) % f, sd);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const n = 0.5 * lat(x, y, 128, 1) + 0.3 * lat(x, y, 64, 2) + 0.2 * lat(x, y, 256, 3);
    const fib = 0.5 + 0.5 * Math.sin(y * 0.9 + lat(x, y, 16, 4) * 6);
    const tooth = 0.75 * n + 0.25 * fib * lat(x, y, 32, 5);
    // grain: multiply layer (light, slightly warm)
    const v = 255 - Math.max(0, (tooth - 0.35)) * 38;
    gi.data[i] = v; gi.data[i + 1] = v - 2; gi.data[i + 2] = v - 6; gi.data[i + 3] = 255;
    // specks where the tooth is deep: wax didn't reach
    const sp = tooth < 0.255 + r() * 0.04 ? 1 : 0;
    si.data[i] = 244; si.data[i + 1] = 239; si.data[i + 2] = 227; si.data[i + 3] = sp ? 200 : 0;
  }
  g.putImageData(gi, 0, 0); s.putImageData(si, 0, 0);
  return { grain, speck };
}
