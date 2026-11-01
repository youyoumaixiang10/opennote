import { buildTimeline } from './timeline.mjs';
import { C, INK, PAPER, makePaperTiles, hash, polyPts, pathClosed, blob, stroke, shape } from './crayon.js';
import { drawActor, POSES } from './chars.js';
import { drawPark, WORLD, PROPS, GRIP } from './scene.js';

const W = 1080, H = 1920, FONT = '"Kuaile", "WenQuanYi Zen Hei", sans-serif';
const ease = (u) => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
const NUM = ['x', 'y', 's', 'lean', 'sit', 'crouch', 'tilt', 'rot'];

function sorted(keys) { return keys.slice().sort((a, b) => a[0] - b[0]); }
// numeric props: ease between the keys that define them; discrete: last key wins
function stateAt(keys, t) {
  const st = {};
  for (const [kt, v] of keys) if (kt <= t + 1e-6) for (const [k, val] of Object.entries(v)) if (!NUM.includes(k)) st[k] = val;
  for (const p of NUM) {
    const def = keys.filter(([, v]) => v[p] !== undefined);
    if (!def.length) continue;
    let a = def[0], b = null;
    for (const d of def) { if (d[0] <= t) a = d; else { b = d; break; } }
    if (!b || a[0] > t) st[p] = a[1][p];
    else {
      // a move starts at the previous key time of the same prop, so the motion fills the gap
      const u = ease((t - a[0]) / Math.max(1e-3, b[0] - a[0]));
      st[p] = a[1][p] + (b[1][p] - a[1][p]) * u;
    }
  }
  return st;
}
function poseHands(keys, t, f) {
  // blend from the previous pose to the current one over 0.33 s
  const changes = keys.filter(([, v]) => v.pose);
  let cur = null, prev = null, tc = -1;
  for (const [kt, v] of changes) if (kt <= t + 1e-6) { prev = cur; cur = v.pose; tc = kt; }
  cur = cur || 'stand';
  const P = POSES[cur] || POSES.stand, Q = POSES[prev || cur] || P;
  const u = ease((t - tc) / 0.33);
  const mix = (s) => [Q[s][0] + (P[s][0] - Q[s][0]) * u, Q[s][1] + (P[s][1] - Q[s][1]) * u];
  return { L: mix('L'), R: mix('R'), layer: u > 0.5 ? P.layer : Q.layer, wave: P.wave && u > 0.6, dig: P.dig && u > 0.6, binoc: P.binoc && u > 0.8 };
}

export async function boot(ep, durs) {
  const tl = buildTimeline(ep, durs);
  for (const sh of tl.shots) { sh.cam = sorted(sh.cam); for (const k in sh.actors) sh.actors[k] = sorted(sh.actors[k]); for (const k in sh.props) sh.props[k] = sorted(sh.props[k]); }
  const cv = document.getElementById('c'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // the page, drawn once
  const BS = 1.4, bg = document.createElement('canvas'); bg.width = WORLD.w * BS; bg.height = WORLD.h * BS;
  const b = bg.getContext('2d'); b.scale(BS, BS); b.translate(-WORLD.x0, -WORLD.y0); drawPark(b, ep.set, 3);
  const tiles = makePaperTiles(512);
  const speck = ctx.createPattern(tiles.speck, 'repeat'), grain = ctx.createPattern(tiles.grain, 'repeat');
  await document.fonts.load(`80px Kuaile`, '豆豆和妈妈');

  function render(t) {
    t = Math.min(Math.max(0, t), tl.DUR - 1e-3);
    let sh = tl.shots[0];
    for (const s of tl.shots) if (t >= s.t0) sh = s;
    const lt = t - sh.t0, step = Math.floor(t * 12), t2 = step / 12, lt2 = Math.max(0, t2 - sh.t0);
    const k = { t, step, t2 };
    // camera (smooth, every frame)
    const cs = stateCam(sh.cam, lt);
    const z = cs.z, tx = W / 2 - cs.x * z, ty = H / 2 - cs.y * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(z, 0, 0, z, tx, ty);
    ctx.drawImage(bg, WORLD.x0, WORLD.y0, WORLD.w, WORLD.h);
    if (sh.wash) drawWash(ctx, sh.wash, lt);
    // actors on twos, sorted by depth then script order
    const ids = Object.keys(sh.actors);
    const order = sh.order || ids.slice().sort((a, b) => (stateAt(sh.actors[a], lt2).y ?? 1500) - (stateAt(sh.actors[b], lt2).y ?? 1500));
    const hands = {}, front = [];
    for (const id of order) {
      const keys = sh.actors[id];
      const st = stateAt(keys, lt2);
      const st0 = stateAt(keys, Math.max(0, lt2 - 1 / 12));
      const vx = (st.x - st0.x) * 12;
      st.walking = Math.abs(vx) > 20 && !(st.sit > 0.5) && !(st.crouch > 0.5);
      st.phase = st.x / 13;
      st.hands = poseHands(keys, lt2, st.f || 1);
      st.talking = sh.lines.some(l => l.who.includes(id) && lt >= l.at && lt <= l.end - 0.05);
      if (st.armsFront) { hands[id] = drawActor(ctx, id, st, k, 'body'); front.push([id, st]); }
      else hands[id] = drawActor(ctx, id, st, k);
    }
    for (const [id, st] of front) drawActor(ctx, id, st, k, 'arms');
    // props
    for (const [pid, keys] of Object.entries(sh.props)) {
      const name = pid.replace(/\d+$/, '');
      let cur = keys[0], nxt = null;
      for (const kk of keys) { if (kk[0] <= lt2) cur = kk; else { nxt = kk; break; } }
      const v = cur[1];
      if (v.hide) continue;
      if (v.att) {
        const [aid, side] = v.att.split('.'), h = hands[aid];
        if (!h) continue;
        const g = GRIP[name] || [0, 0];
        PROPS[name](ctx, { ...v, x: h[side][0] + g[0], y: h[side][1] + g[1], att: 1 }, k, true);
      } else {
        let p = { ...v };
        if (nxt && !nxt[1].att && cur[0] <= lt2) {
          const u = ease((lt2 - cur[0]) / Math.max(1e-3, nxt[0] - cur[0]));
          for (const q of ['x', 'y', 'rot']) if (v[q] !== undefined && nxt[1][q] !== undefined) p[q] = v[q] + (nxt[1][q] - v[q]) * u;
        }
        PROPS[name](ctx, p, k, false);
      }
    }
    // material: wax skips the deep tooth (anchored to the page), then paper grain over everything
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    speck.setTransform(new DOMMatrix([1, 0, 0, 1, Math.round(((tx % 512) + 512) % 512), Math.round(((ty % 512) + 512) % 512)]));
    ctx.fillStyle = speck; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grain; ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, 'rgba(225,205,175,1)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // printed words
    if (sh.title) drawTitle(ctx, ep.title, lt, k);
    if (sh.over) drawOver(ctx, sh.over, lt, k);
    if (sh.star && lt >= sh.star[0] && lt <= sh.star[1]) drawStar(ctx, lt - sh.star[0], k);
    if (sh.mantra) drawMantra(ctx, sh, lt, k);
    if (sh.caption) {
      const ml = sh.mantra ? sh.mantra.lines : [];
      let cur = null;
      sh.lines.forEach((l, i) => { if (!ml.includes(i) && lt >= l.at && lt <= Math.max(l.end + 0.6, l.at + 1.8)) cur = l; });
      if (cur) drawCaption(ctx, cur.text, lt - cur.at, k, cur.who[0]);
    }
  }
  window.TL = tl; window.DUR = tl.DUR; window.render = render; window.EV = tl.sfx;
  render(0); window.READY = true;
}

function stateCam(keys, t) {
  let a = keys[0], b = null;
  for (const kk of keys) { if (kk[0] <= t) a = kk; else { b = kk; break; } }
  if (!b) return { x: a[1], y: a[2], z: a[3] };
  const u = ease((t - a[0]) / Math.max(1e-3, b[0] - a[0]));
  return { x: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u, z: a[3] + (b[3] - a[3]) * u };
}

function drawWash(ctx, w, lt) {
  // a warm watercolour sweeping across the sky from left to right
  const u = ease((lt - w.from) / (w.dur || 3));
  if (u <= 0) return;
  const x0 = WORLD.x0, x1 = x0 + WORLD.w * u;
  ctx.save();
  const g = ctx.createLinearGradient(0, -900, 0, 1420);
  g.addColorStop(0, w.top || 'rgba(244,160,120,0.55)'); g.addColorStop(0.55, 'rgba(250,190,140,0.5)'); g.addColorStop(0.82, w.bottom || 'rgba(252,222,170,0.4)'); g.addColorStop(1, 'rgba(252,222,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x0, -1400);
  for (let y = -1400; y <= 1420; y += 60) ctx.lineTo(x1 + Math.sin(y * 0.02) * 30, y);
  ctx.lineTo(x0, 1420); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function patch(ctx, cx, cy, w, h, seed) {
  const p = polyPts([[cx - w / 2, cy - h / 2], [cx, cy - h / 2 - 6], [cx + w / 2, cy - h / 2], [cx + w / 2 + 8, cy], [cx + w / 2, cy + h / 2], [cx, cy + h / 2 + 5], [cx - w / 2, cy + h / 2], [cx - w / 2 - 8, cy]], seed, 6);
  ctx.save(); pathClosed(ctx, p); ctx.globalAlpha = 0.93; ctx.fillStyle = PAPER; ctx.fill(); ctx.restore();
}
function writeText(ctx, text, cx, cy, size, age, k, o = {}) {
  // hand-printed: each glyph tilted and offset, boiling on twos, written left→right
  const chars = [...text], per = o.per ?? 0.35 / Math.max(1, chars.length) * 3;
  ctx.save(); ctx.font = `${size}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const widths = chars.map(ch => ctx.measureText(ch).width * (o.track ?? 1.02));
  const total = widths.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  chars.forEach((ch, i) => {
    const w = widths[i];
    if (age < i * per) { x += w; return; }
    const s = 1 + (o.pop && age - i * per < 0.2 ? 0.25 * (1 - (age - i * per) / 0.2) : 0);
    const j = (a) => (hash(i, k.step, a) - 0.5);
    ctx.save(); ctx.translate(x + w / 2 + j(1) * 2, cy + j(2) * 3 + (hash(i, 9) - 0.5) * 6);
    ctx.rotate((hash(i, 4) - 0.5) * 0.12 + j(3) * 0.03); ctx.scale(s, s);
    ctx.fillStyle = o.colors ? o.colors[i % o.colors.length] : (o.color || INK);
    ctx.fillText(ch, 0, 0);
    if (o.stroke) { ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.globalAlpha = 0.5; ctx.strokeText(ch, 0, 0); }
    ctx.restore();
    x += w;
  });
  ctx.restore();
  return total;
}
const SPEAKER = { nar: INK, mama: '#b4472f', baba: '#2f6f73', nainai: '#6d4fa0', doudou: '#8a5a1e', mimi: '#3d7fb3', gaga: '#b07f00', guoguo: '#a4501c' };
function drawCaption(ctx, text, age, k, who) {
  const size = 60; ctx.font = `${size}px ${FONT}`;
  const w = Math.min(1000, [...text].length * size * 1.04 + 60);
  patch(ctx, W / 2, 1740, w, size + 40, 77);
  writeText(ctx, text, W / 2, 1742, size, age, k, { color: SPEAKER[who] || INK, per: 0.35 / [...text].length });
}
function drawTitle(ctx, title, lt, k) {
  if (lt < 0.3) return;
  const n = [...title[1]].length, size = Math.min(132, Math.floor(880 / n)), tw = n * size * 1.04;
  patch(ctx, W / 2, 380, Math.max(620, tw + 90), 290, 5);
  writeText(ctx, title[0], W / 2, 300, 64, lt - 0.3, k, { color: C.coral, per: 0.15 });
  writeText(ctx, title[1], W / 2, 430, size, lt - 0.7, k, { colors: [INK, '#2f6f73', INK, '#b4472f', INK, '#2f6f73', INK, '#b4472f'], per: 0.22, pop: true });
  // a scribbled underline drawn on
  const u = Math.min(1, Math.max(0, (lt - 0.7 - n * 0.22) / 0.6));
  if (u > 0) stroke(ctx, [[W / 2 - tw / 2, 515], [W / 2 - tw / 2 + tw * u, 508 + 6 * Math.sin(u * 9)]], C.mustard, 14, k.step);
}
function drawOver(ctx, text, lt, k) {
  if (lt < 0.2 || lt > 3.4) return;
  patch(ctx, W / 2, 330, 420, 110, 9);
  writeText(ctx, text, W / 2, 332, 70, lt - 0.2, k, { color: '#2f6f73', per: 0.12 });
}
function drawStar(ctx, age, k) {
  // the "your turn" signal: same star every episode, blinking softly
  const cx = 860, cy = 340, pulse = 1 + 0.12 * Math.sin(k.t2 * Math.PI * 2 * 1.2), grow = Math.min(1, age / 0.3);
  const R = 120 * pulse * grow, r = R * 0.45, pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  shape(ctx, polyPts(pts, k.step, 3), C.lemon, { seed: k.step, w: 7, lineColor: C.orange, press: 1.2 });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + k.t2 * 1.5, d = 140 + 14 * Math.sin(k.t2 * 6 + i);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    stroke(ctx, [[x - 14, y], [x + 14, y]], C.mustard, 6, k.step + i); stroke(ctx, [[x, y - 14], [x, y + 14]], C.mustard, 6, k.step + i + 9);
  }
}
const MCOL = ['#b4472f', '#2f6f73', '#8a5a1e', '#6d4fa0'];
function drawMantra(ctx, sh, lt, k) {
  const L = sh.mantra.lines.map(i => sh.lines[i]);
  if (lt < L[0].at - 0.1) return;
  patch(ctx, W / 2, 1640, 960, 330, 31);
  const rows = [[0, 1], [2, 3]];
  rows.forEach((row, r) => {
    row.forEach((i, j) => {
      const l = L[i], age = lt - l.at;
      if (age < 0) return;
      const active = lt >= l.at && lt <= l.end + 0.2;
      const size = active ? 112 : 96;
      const cx = W / 2 + (j === 0 ? -225 : 225), cy = 1560 + r * 160;
      writeText(ctx, sh.mantra.text[i], cx, cy, size, age, k, { color: MCOL[i], per: 0.1, pop: true });
    });
  });
}
