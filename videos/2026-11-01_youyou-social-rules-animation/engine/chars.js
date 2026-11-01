// Character rig in crayon: substitution poses on twos, a hand-target rig, faces with a dozen expressions.
import { C, INK, PAPER, blob, ellipsePts, shape, fill, line, stroke, tubePts, polyPts, hash } from './crayon.js';

export const CAST = {
  doudou: { sp: 'bear', s: 1.0, fur: C.brown, light: C.cream, inner: '#e3a07a', outfit: 'overalls', oc: C.mustard },
  mama:   { sp: 'bear', s: 1.5, fur: '#b9804e', light: C.cream, inner: '#e3a07a', outfit: 'scarf', oc: C.coral },
  baba:   { sp: 'bear', s: 1.55, fur: '#8e5a32', light: '#e8cfa0', inner: '#d08f6a', outfit: 'sweater', oc: C.teal, glasses: 1 },
  nainai: { sp: 'bear', s: 1.4, fur: '#b8a08a', light: '#f1e4cc', inner: '#e0a790', outfit: 'cardigan', oc: C.lavender, glasses: 1, hat: 1 },
  mimi:   { sp: 'bunny', s: 0.72, fur: C.white, light: C.white, inner: C.pink, outfit: 'cap', oc: C.sky },
  tumama: { sp: 'bunny', s: 1.35, fur: '#f1e2cc', light: C.white, inner: C.pink, outfit: 'apron', oc: C.pink },
  gaga:   { sp: 'duck', s: 0.95, fur: C.lemon, light: '#fbe98a', inner: C.orange, outfit: 'bow', oc: C.teal },
  guoguo: { sp: 'squirrel', s: 1.1, fur: '#cf7a3c', light: C.cream, inner: '#f0b08a', outfit: 'vest', oc: C.grass },
  lulu:   { sp: 'deer', s: 1.15, fur: '#d9a46a', light: C.cream, inner: C.pink, outfit: 'dress', oc: C.coral },
};

// Hand targets for f = +1 (R = the hand on the facing side), body units, before the sit/crouch drop.
export const POSES = {
  stand: { L: [-80, -82], R: [80, -82] },
  holdlow: { L: [-80, -82], R: [47, -86] },
  holdup: { L: [-62, -128], R: [80, -82] },
  point: { L: [-80, -82], R: [130, -178] },
  reach: { L: [72, -138], R: [118, -142] },
  push: { L: [100, -140], R: [146, -144] },
  hold: { L: [-80, -82], R: [80, -120] },
  down: { L: [-104, -118], R: [104, -112] },
  rubknee: { L: [-22, -74], R: [40, -72] },
  lookhands: { L: [16, -122], R: [54, -124] },
  handsout: { L: [64, -112], R: [92, -110] },
  holdhands: { L: [52, -150], R: [70, -148] },
  comfort: { L: [-96, -150], R: [70, -118] },
  wave: { L: [-80, -82], R: [92, -246], wave: 1 },
  cross: { L: [40, -152], R: [-40, -152], layer: 'over' },
  clasp: { L: [-9, -100], R: [9, -100] },
  open: { L: [-142, -214], R: [142, -214] },
  behind: { L: [-34, -96], R: [34, -96], layer: 'back' },
  tapmouth: { L: [-80, -82], R: [16, -190], layer: 'over' },
  belly: { L: [-26, -106], R: [30, -108] },
  binoc: { L: [-58, -196], R: [58, -196], layer: 'mid', binoc: 1 },
  patchest: { L: [-16, -142], R: [18, -140], layer: 'over' },
  give: { L: [80, -134], R: [114, -134] },
  take: { L: [-86, -84], R: [112, -132] },
  pick: { L: [62, -86], R: [96, -84] },
  dig: { L: [-62, -72], R: [96, -84], dig: 1 },
  hug: { L: [52, -158], R: [112, -166], layer: 'over' },
  eat: { L: [-20, -118], R: [20, -192], layer: 'over' },
  hugbox: { L: [-30, -122], R: [32, -124], layer: 'over' },
  throw: { L: [-80, -82], R: [110, -232] },
  drive: { L: [70, -84], R: [100, -82] },
  slap: { L: [-80, -82], R: [130, -120] },
  shrug: { L: [-110, -150], R: [110, -150] },
};

const BODY = { bear: { rx: 68, ry: 62 }, bunny: { rx: 60, ry: 58 }, duck: { rx: 66, ry: 60 }, squirrel: { rx: 64, ry: 62 }, deer: { rx: 60, ry: 64 } };

// st: interpolated state from the player; ctx is already in world space.
export function drawActor(ctx, id, st, k, part = 'all') {
  const c = CAST[id], f = st.f || 1, s = (st.s || 1) * c.s;
  const step = k.step, seed = k.step + hash(id.length, id.charCodeAt(0)) * 997 | 0;
  const sit = st.sit || 0, cr = st.crouch || 0;
  const U = 50 * sit + 65 * cr;
  const walkBob = st.walking ? Math.abs(Math.sin(st.phase)) * 5 : 0;
  ctx.save();
  ctx.translate(st.x, st.y ?? 1500);
  ctx.scale(s, s);
  let lean = (st.lean || 0) + (st.walking && st.wobble ? 5 * Math.sin(st.phase * 0.5) : 0);
  ctx.rotate(lean * f * Math.PI / 180);
  const X = (x) => x * f;                       // mirror for facing
  const fx = st.look === 'cam' ? 0 : f * 0.5;   // 3/4 view offset of the face
  const bodyDrop = 45 * Math.min(1, sit + cr), bry = BODY[c.sp].ry - 10 * cr, brx = BODY[c.sp].rx + 6 * cr;
  const bcy = -110 + bodyDrop - walkBob, up = U + walkBob * -1;
  const pose = st.hands;  // {L:[x,y], R:[x,y], layer, wave, dig, binoc}
  const hand = (side) => {
    let [hx, hy] = pose[side];
    if (pose.wave && side === 'R') hx += 20 * Math.sin(k.t2 * Math.PI * 2 * 2.0);
    if (pose.dig && side === 'R') hy += 12 * Math.sin(k.t2 * Math.PI * 2 * 1.6);
    return [X(hx), hy + up];
  };
  const sh = (side) => [X(side === 'R' ? 44 : -44), -150 + up + (c.sp === 'bunny' ? 8 : 0)];
  const armColor = ['sweater', 'cardigan'].includes(c.outfit) ? c.oc : c.fur;
  const drawArm = (side, sd) => {
    const [ax, ay] = sh(side), [hx, hy] = hand(side);
    const bend = ((side === 'R') === (f > 0) ? 1 : -1) * 6;
    shape(ctx, tubePts(ax, ay, hx, hy, 15, 13, bend, sd), armColor, { seed: sd, w: 4.4 });
    blob(ctx, hx, hy, 16, 15, c.sp === 'duck' ? c.fur : c.fur, { seed: sd + 3, w: 4.4 });
  };
  const layer = pose.layer || 'mid';
  // --- back layer
  if (part !== 'arms') {
    if (c.sp === 'squirrel') { // tail
      const tx = X(-78), ty = -150 + up * 0.5;
      blob(ctx, tx, ty, 58, 100, c.fur, { rot: -f * 0.35, seed: seed + 40, w: 5 });
      blob(ctx, tx + X(-14), ty - 70, 30, 32, c.light, { seed: seed + 41, w: 3, lineAlpha: 0.5 });
    }
    if (layer === 'back') { drawArm('L', seed + 1); drawArm('R', seed + 2); }
    // legs / feet
    const footC = c.sp === 'duck' ? C.orange : (c.outfit === 'overalls' ? c.oc : c.fur);
    if (sit > 0.5) {
      blob(ctx, X(10) - 30, -14, 26, 20, footC, { seed: seed + 5, w: 4.4 });
      blob(ctx, X(10) + 30, -14, 26, 20, footC, { seed: seed + 6, w: 4.4 });
      if (c.sp === 'bear' || c.sp === 'bunny') { blob(ctx, X(10) - 30, -12, 12, 10, c.inner, { seed: seed + 7, outline: false }); blob(ctx, X(10) + 30, -12, 12, 10, c.inner, { seed: seed + 8, outline: false }); }
    } else {
      const lift = st.walking ? Math.sin(st.phase) * 12 : 0;
      const spread = 28 + 14 * cr;
      blob(ctx, -spread + X(4), -22 - Math.max(0, lift), c.sp === 'duck' ? 30 : 24, c.sp === 'duck' ? 14 : 25, footC, { seed: seed + 5, w: 4.4 });
      blob(ctx, spread + X(4), -22 - Math.max(0, -lift), c.sp === 'duck' ? 30 : 24, c.sp === 'duck' ? 14 : 25, footC, { seed: seed + 6, w: 4.4 });
    }
    // body
    const bodyPts = ellipsePts(0, bcy, brx, bry, 0, seed + 10, 1.6);
    const bodyCol = ['sweater', 'cardigan', 'dress'].includes(c.outfit) ? c.oc : c.fur;
    fill(ctx, bodyPts, bodyCol, { seed: seed + 10 });
    if (['bear', 'squirrel', 'deer'].includes(c.sp) && !['sweater', 'cardigan', 'dress'].includes(c.outfit)) blob(ctx, X(8), bcy + 8, brx * 0.58, bry * 0.62, c.light, { seed: seed + 11, outline: false, press: 0.7 });
    if (c.outfit === 'overalls') {
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, bcy, brx + 4, bry + 4, 0, 0, Math.PI * 2); ctx.clip();
      fill(ctx, ellipsePts(0, bcy + 30, brx * 0.95, bry * 0.72, 0, seed + 12, 1.4), c.oc, { seed: seed + 12, knock: false });
      ctx.restore();
      stroke(ctx, [[X(-22), bcy - 4], [X(-30), bcy - 52]], c.oc, 9, seed + 13);
      stroke(ctx, [[X(22), bcy - 4], [X(30), bcy - 52]], c.oc, 9, seed + 14);
      blob(ctx, X(-22), bcy - 2, 4, 4, INK, { seed, outline: false, press: 1.4 }); blob(ctx, X(22), bcy - 2, 4, 4, INK, { seed, outline: false, press: 1.4 });
    }
    if (c.outfit === 'apron') fill(ctx, polyPts([[-38, bcy - 10], [38, bcy - 10], [44, bcy + 50], [-44, bcy + 50]], seed + 15, 2), c.oc, { seed: seed + 15, knock: false });
    if (c.outfit === 'cardigan') { stroke(ctx, [[0, bcy - bry + 10], [0, bcy + bry - 6]], c.light, 10, seed + 16); for (let i = 0; i < 3; i++) blob(ctx, 12, bcy - 30 + i * 26, 4, 4, INK, { seed, outline: false, press: 1.4 }); }
    if (c.outfit === 'vest') fill(ctx, polyPts([[X(-62), bcy - 30], [X(-20), bcy - 40], [X(-24), bcy + 40], [X(-60), bcy + 20]], seed + 17, 2), c.oc, { seed: seed + 17, knock: false });
    if (c.sp === 'deer' && c.outfit !== 'dress') for (let i = 0; i < 4; i++) blob(ctx, X(-30 + i * 18), bcy - 20 + (i % 2) * 22, 6, 6, C.white, { seed: seed + 18 + i, outline: false, press: 1.2 });
    line(ctx, bodyPts, { w: 5, seed: seed + 10 });
    if (layer === 'mid' && part !== 'body') { drawArm('L', seed + 1); drawArm('R', seed + 2); }
    drawHead(ctx, c, st, k, seed, up, fx, f, X);
    if (pose.binoc) for (const sx of [-1, 1]) { // little finger-rings around open eyes: "just one look"
      const p = ellipsePts(sx * 25 + fx * 18, -228 + up, 19, 18, 0, seed + 9 + sx, 1.2);
      line(ctx, p, { w: 11, color: armColor, seed: seed + 9 }); line(ctx, p, { w: 3.2, seed: seed + 10 });
    }
  }
  if (part === 'arms' || (layer === 'over' && part !== 'body')) { drawArm('L', seed + 1); drawArm('R', seed + 2); }
  ctx.restore();
  // world positions of the hands for props
  const handW = (side) => {
    const [hx, hy] = hand(side), a = lean * f * Math.PI / 180;
    const rx = hx * Math.cos(a) - hy * Math.sin(a), ry = hx * Math.sin(a) + hy * Math.cos(a);
    return [st.x + rx * s, (st.y ?? 1500) + ry * s];
  };
  return { L: handW('L'), R: handW('R'), s };
}

function drawHead(ctx, c, st, k, seed, up, fx, f, X) {
  const hy = -215 + up, sp = c.sp, ex = st.expr || 'neutral';
  ctx.save();
  ctx.translate(0, hy); ctx.rotate((st.tilt || 0) * Math.PI / 180); ctx.translate(0, -hy);
  const ox = fx * 18;
  // ears behind the head
  if (sp === 'bear') for (const sx of [-1, 1]) { blob(ctx, sx * 54, hy - 56, 25, 24, c.fur, { seed: seed + 30 + sx, w: 4.6 }); blob(ctx, sx * 54, hy - 54, 12, 11, c.inner, { seed: seed + 32 + sx, outline: false }); }
  if (sp === 'bunny') for (const sx of [-1, 1]) {
    const rot = sx * 0.16 + (ex === 'sad' || ex === 'cry' ? sx * 0.5 : 0);
    blob(ctx, sx * 26, hy - 95, 17, 52, c.fur, { rot, seed: seed + 30 + sx, w: 4.6 });
    blob(ctx, sx * 26, hy - 92, 8, 36, c.inner, { rot, seed: seed + 32 + sx, outline: false });
  }
  if (sp === 'squirrel') for (const sx of [-1, 1]) shape(ctx, polyPts([[sx * 30, hy - 52], [sx * 58, hy - 98], [sx * 64, hy - 40]], seed + 30 + sx, 2), c.fur, { seed: seed + 30 + sx, w: 4.6 });
  if (sp === 'deer') for (const sx of [-1, 1]) { blob(ctx, sx * 76, hy - 30, 34, 14, c.fur, { rot: sx * 0.45, seed: seed + 30 + sx, w: 4.6 }); blob(ctx, sx * 74, hy - 30, 20, 7, c.inner, { rot: sx * 0.45, seed: seed + 32 + sx, outline: false }); }
  // head
  const r = { bear: [76, 70], bunny: [66, 62], duck: [66, 64], squirrel: [68, 66], deer: [62, 68] }[sp];
  blob(ctx, 0, hy, r[0], r[1], c.fur, { seed: seed + 34, w: 5 });
  if (sp === 'duck') for (let i = -1; i <= 1; i++) stroke(ctx, [[i * 8, hy - 60], [i * 12 + 4, hy - 82]], c.fur, 7, seed + 35 + i);
  // muzzle
  if (sp === 'bear' || sp === 'squirrel' || sp === 'deer') blob(ctx, ox * 0.9, hy + 22, sp === 'bear' ? 34 : 26, sp === 'bear' ? 25 : 20, c.light, { seed: seed + 36, w: 3.4, lineAlpha: 0.6 });
  // eyes, brows
  const exy = hy - 13, el = [-25 + ox, exy], er = [25 + ox, exy];
  const blink = (k.step + (seed % 37)) % 41 === 0;
  const eyeDot = (p, r) => { blob(ctx, p[0], p[1], r, r * 1.1, INK, { seed: seed + p[0] | 0, outline: false, press: 1.5, gap: 4 }); blob(ctx, p[0] + r * 0.35, p[1] - r * 0.4, r * 0.32, r * 0.32, C.white, { seed: seed + 3, outline: false, press: 1.5, knock: false }); };
  const arc = (p, dir, w = 9) => stroke(ctx, [[p[0] - w, p[1] + dir * 3], [p[0], p[1] - dir * 5], [p[0] + w, p[1] + dir * 3]], INK, 4.4, seed + 50);
  const big = { excited: 9.5, surprise: 10.5 }[ex] || 7.6;
  const look = ex === 'thinking' ? [4, -4] : (ex === 'shy' || ex === 'sad' ? [0, 3] : [0, 0]);
  if (ex === 'joy') { arc(el, 1); arc(er, 1); }
  else if (ex === 'cry') { arc(el, -1); arc(er, -1); }
  else if (blink) { stroke(ctx, [[el[0] - 8, el[1]], [el[0] + 8, el[1]]], INK, 4, seed); stroke(ctx, [[er[0] - 8, er[1]], [er[0] + 8, er[1]]], INK, 4, seed); }
  else { eyeDot([el[0] + look[0], el[1] + look[1]], big); eyeDot([er[0] + look[0], er[1] + look[1]], big); }
  const brow = (p, inner, outer, side) => stroke(ctx, [[p[0] - side * 11, p[1] - 22 + outer], [p[0] + side * 9, p[1] - 22 + inner]], INK, 3.6, seed + 60 + side);
  if (['sad', 'cry', 'worry'].includes(ex)) { brow(el, -8, 2, 1); brow(er, -8, 2, -1); }
  else if (['surprise', 'excited'].includes(ex)) { brow(el, -10, -10, 1); brow(er, -10, -10, -1); }
  else if (ex === 'firm') { brow(el, -2, -3, 1); brow(er, -2, -3, -1); }
  // cheeks
  const cheekP = ex === 'joy' || ex === 'happy' || ex === 'excited' ? 1.0 : 0.6;
  blob(ctx, -46 + ox * 0.6, hy + 14, 13, 10, C.pink, { seed: seed + 70, outline: false, press: cheekP });
  blob(ctx, 46 + ox * 0.6, hy + 14, 13, 10, C.pink, { seed: seed + 71, outline: false, press: cheekP });
  // nose / beak
  if (sp === 'bear') blob(ctx, ox * 0.9, hy + 10, 10, 7, INK, { seed: seed + 72, outline: false, press: 1.5, gap: 4 });
  if (sp === 'squirrel' || sp === 'deer') blob(ctx, ox * 0.9, hy + 12, 8, 6, INK, { seed: seed + 72, outline: false, press: 1.5, gap: 4 });
  if (sp === 'bunny') blob(ctx, ox * 0.9, hy + 10, 7, 5, C.pink, { seed: seed + 72, w: 3 });
  // mouth
  const my = hy + (sp === 'bear' ? 30 : sp === 'duck' ? 26 : 26), mx = ox * 0.9;
  const talking = st.talking && (k.step % 2 === 1 || hash(k.step, 3) > 0.6);
  if (sp === 'duck') {
    const open = talking ? 9 : (['happy', 'joy', 'excited'].includes(ex) ? 6 : (ex === 'surprise' ? 7 : 0));
    blob(ctx, mx + fx * 10, my - 4, 36, 13 + open * 0.5, C.orange, { seed: seed + 73, w: 4 });
    if (open) blob(ctx, mx + fx * 10, my + 6, 26, open, C.orange, { seed: seed + 74, w: 4 });
    else stroke(ctx, [[mx + fx * 10 - 30, my], [mx + fx * 10 + 30, my]], INK, 3, seed);
  } else if (talking) {
    blob(ctx, mx, my + 4, 10 + hash(k.step, 9) * 4, 7 + hash(k.step, 8) * 5, '#7a2f3f', { seed: seed + 75, w: 3.6, press: 1.3 });
  } else if (['happy', 'joy', 'excited'].includes(ex)) {
    const p = polyPts([[mx - 15, my - 2], [mx + 15, my - 2], [mx + 8, my + 13], [mx - 8, my + 13]], seed + 76, 1.2);
    shape(ctx, p, '#7a2f3f', { seed: seed + 76, w: 3.6, press: 1.3 });
    blob(ctx, mx, my + 8, 7, 4, C.pink, { seed: seed + 77, outline: false, knock: false });
  } else if (ex === 'surprise') blob(ctx, mx, my + 4, 7, 9, '#7a2f3f', { seed: seed + 78, w: 3.6, press: 1.3 });
  else if (ex === 'cry') {
    blob(ctx, mx, my + 6, 13, 10, '#7a2f3f', { seed: seed + 79, w: 3.6, press: 1.3, wob: 4 });
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const dy = ((k.step * 5 + i * 18) % 36); blob(ctx, (sx < 0 ? el : er)[0] + sx * 4, exy + 12 + dy, 4.5, 6.5, C.sky, { seed: seed + 80 + i, w: 2.4, lineColor: '#3f74a8' }); }
  } else if (['sad', 'shy'].includes(ex)) stroke(ctx, [[mx - 12, my + 7], [mx, my + 1], [mx + 12, my + 7]], INK, 4, seed + 81);
  else if (ex === 'worry') stroke(ctx, [[mx - 12, my + 4], [mx - 4, my + 1], [mx + 4, my + 5], [mx + 12, my + 2]], INK, 3.6, seed + 82);
  else if (ex === 'firm') stroke(ctx, [[mx - 11, my + 3], [mx + 11, my + 3]], INK, 4, seed + 83);
  else if (ex === 'thinking') blob(ctx, mx + 4, my + 4, 5, 5, '#7a2f3f', { seed: seed + 84, w: 3, press: 1.3 });
  else { const d = ex === 'neutral' ? 4 : 7; stroke(ctx, [[mx - 13, my], [mx, my + d], [mx + 13, my]], INK, 4, seed + 85); }
  // accessories
  if (c.glasses) { for (const p of [el, er]) line(ctx, ellipsePts(p[0], p[1], 15, 13, 0, seed + 86, 1), { w: 3.6, seed: seed + 86 }); stroke(ctx, [[el[0] + 15, el[1]], [er[0] - 15, er[1]]], INK, 3, seed); }
  if (c.outfit === 'cap') { const p = polyPts([[-48, hy - 30], [-40, hy - 62], [0, hy - 72], [40, hy - 62], [48, hy - 30]], seed + 87, 2); shape(ctx, p, c.oc, { seed: seed + 87, w: 4.4 }); blob(ctx, X(52), hy - 30, 22, 8, c.oc, { seed: seed + 88, w: 4 }); }
  if (c.hat) { blob(ctx, 0, hy - 58, 64, 16, C.mustard, { seed: seed + 89, w: 4.4 }); blob(ctx, 0, hy - 74, 40, 24, C.mustard, { seed: seed + 90, w: 4.4 }); blob(ctx, X(30), hy - 78, 11, 11, C.pink, { seed: seed + 91, w: 3.4 }); }
  if (c.outfit === 'scarf') { blob(ctx, 0, hy + 64, 60, 15, c.oc, { seed: seed + 92, w: 4.4 }); shape(ctx, polyPts([[X(-30), hy + 70], [X(-48), hy + 72], [X(-52), hy + 104], [X(-36), hy + 102]], seed + 93, 2), c.oc, { seed: seed + 93, w: 4 }); }
  if (c.outfit === 'bow') { shape(ctx, polyPts([[0, hy + 66], [-26, hy + 54], [-26, hy + 80]], seed + 94, 2), c.oc, { seed: seed + 94, w: 3.6 }); shape(ctx, polyPts([[0, hy + 66], [26, hy + 54], [26, hy + 80]], seed + 95, 2), c.oc, { seed: seed + 95, w: 3.6 }); }
  if (sp === 'deer') { shape(ctx, polyPts([[X(56), hy - 50], [X(36), hy - 66], [X(40), hy - 40]], seed + 96, 2), C.pink, { seed: seed + 96, w: 3.4 }); }
  ctx.restore();
}
