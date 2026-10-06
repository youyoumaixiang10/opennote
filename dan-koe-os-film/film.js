// "一块白板，蒸馏出一套个人成长操作系统" — Whiteboard Explainer. One continuous board, no hands.
// Times are seconds. Line starts (VO) come from the voice durations + GAP; visual beats hang off spoken
// characters via T(id, substring), so the picture re-times itself whenever the voice is regenerated.
import * as W from './engine/wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

export const INK = { black: '#23262c', green: '#2e6b4f', orange: '#d97757' };
export const BPM = 96, BEAT = 60 / BPM;
// pause before each line (s)
const GAP = { l01: .9, l02: .5, l03: .7, l04: .8, l05: 1.4, l06: .7, l07: .7, l08: .5, l09: .4, l10: .6, l11: 1.3, l12: .4,
  l13: 1.9, l14: .4, l15: 1.0, l16: 1.9, l17: .4, l18: 1.3, l19: .3, l20: 1.2, l21: .4, l22: 1.7, l23: .9, l24: .9 };
const TAIL = 8.0;

// ───────── handwriting: CJK from stroke-order medians (Make Me a Hanzi), Latin from the single-line font
let HZ = {};
const PUNCT = { '，': ',', '：': ':', '？': '?', '、': ',', '；': ';', '！': '!' };
function hw(str, x, y, o = {}) {
  // y = baseline; o.h = Latin cap height; CJK em = 1.25 h
  const h = o.h ?? 60, em = h * 1.25, R = mulberry(o.seed ?? Math.round(x * 7 + y * 13 + str.length));
  const items = []; let adv = 0;
  for (const ch of str) {
    if (HZ[ch]) { items.push({ cjk: HZ[ch], x: adv }); adv += em * (o.cjkSp ?? 1.0); }
    else if (ch === '。') { items.push({ dot: true, x: adv }); adv += em * .6; }
    else if (ch === ' ') { adv += h * .42; }
    else if (ch === '1') { items.push({ one: true, x: adv }); adv += h * .62; }
    else {
      const c = PUNCT[ch] || ch, s = W.text(c, 0, 0, { h, w: o.w, jitter: o.jitter });
      items.push({ lat: c, x: adv, wid: s.width }); adv += s.width * (PUNCT[ch] ? .9 : 1);
    }
  }
  const x0 = o.align === 'center' ? x - adv / 2 : o.align === 'right' ? x - adv : x, out = [];
  const wCJK = o.w ?? Math.max(5, em * .085);
  for (const it of items) {
    const rot = (R() - .5) * .06, dy = (R() - .5) * h * .06, sc = 1 + (R() - .5) * .05;
    if (it.cjk) {
      const k = em / 1024 * sc, cx = x0 + it.x + em / 2, cy = y - em * .38 + dy;
      for (const m of it.cjk) {
        const p = [];
        for (const [mx, my] of m) {
          const px = (mx - 512) * k, py = (388 - my) * k;
          p.push(cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot));
        }
        out.push(new W.Stroke(p, { w: wCJK, color: o.color, jitter: o.jitter ?? .3, wav: 70, kind: 'text', smooth: 1 }));
      }
    } else if (it.one) {
      const bx = x0 + it.x + h * .36, by = y + dy * .5;
      out.push(new W.Stroke([bx - h * .26, by - h * .74, bx, by - h, bx, by], { w: o.w ?? Math.max(5, h * .13), color: o.color, jitter: o.jitter ?? .35, wav: 90, kind: 'text', smooth: 0 }));
    } else if (it.dot) {
      out.push(W.circle(x0 + it.x + em * .22, y - em * .05, em * .07, { w: wCJK * .8, color: o.color, kind: 'text', lap: .3 }));
    } else {
      out.push(...W.text(it.lat, x0 + it.x, y + dy * .5, { h, w: o.w, color: o.color, jitter: o.jitter, seed: Math.floor(R() * 1e6) }));
    }
  }
  out.width = adv; out.x0 = x0;
  return out;
}

export async function build(q) {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  HZ = await (await fetch('fonts/hanzi.json')).json();
  const VOICE = q.get('voice') || 'voice/out';
  const dur = await (await fetch(VOICE + '/dur.json')).json();
  const lines = await (await fetch('voice/lines.json')).json();
  const LN = Object.fromEntries(lines.map(l => [l.id, l]));

  // line start times
  const VO = {}; let tc = 0;
  for (const l of lines) { tc += GAP[l.id] ?? .6; VO[l.id] = +tc.toFixed(3); tc += dur[l.id]; }
  const END = +(tc + TAIL).toFixed(2);
  const VE = id => VO[id] + dur[id];

  // T(id, sub, edge): time a spoken substring starts (edge 0) or ends (edge 1). Weighted char position:
  // CJK 1, Latin letter .4, digit .5, punctuation 1.6 (a pause), space 0.
  const wt = c => /[一-鿿]/.test(c) ? 1 : /[，。：；、！？,.:;!?]/.test(c) ? 1.6 : c === ' ' ? 0 : /[0-9]/.test(c) ? .5 : /[“”"]/.test(c) ? 0 : .4;
  const T = (id, sub, edge = 1) => {
    const s = LN[id].say || LN[id].text, i = s.indexOf(sub);
    if (i < 0) throw new Error(`"${sub}" not in ${id}`);
    const chars = [...s], pre = [...s.slice(0, i + (edge ? sub.length : 0))];
    let tot = 0, a = 0; for (const c of chars) tot += wt(c); for (const c of pre) a += wt(c);
    // trailing punctuation is mostly silence after the last word, so map onto (0 .. dur-0.12)
    return VO[id] + (dur[id] - .12) * clamp(a / tot);
  };

  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.black, { park: [2200, 1320] });
  const K2 = new W.Pen('black2', INK.black, { park: [-300, 1250] });
  const G = new W.Pen('green', INK.green, { park: [2150, -260] });
  const O = new W.Pen('orange', INK.orange, { park: [2350, 1150] });
  const PENS = [K, K2, G, O];
  const H = hw, R = mulberry(4242);
  const cues = {};

  // ghosts of old lessons
  const ghosts = [], gR = mulberry(77);
  const gWords = ['周会', 'TODO', '复盘', 'Q3', '读书笔记', '→ 3', 'v2', '灵感', 'ok!', '待定'];
  for (let i = 0; i < 44; i++) {
    const x = gR() * 7600 + 200, y = gR() * 4100 + 200, k = gR();
    const o = { w: 11, alpha: .05 + gR() * .05, color: gR() < .25 ? '#8fb0a0' : '#9aa0a8' };
    let g;
    if (k < .35) g = H(gWords[i % gWords.length], x, y, { h: 40 + gR() * 30, color: o.color });
    else if (k < .6) g = [W.circle(x, y, 40 + gR() * 100, o)];
    else if (k < .8) g = W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o);
    else g = [W.line(x, y, x + 200 + gR() * 400, y + (gR() - .5) * 80, o)];
    for (const s of g) { s.alpha = o.alpha; s.color = s.color || o.color; ghosts.push(s); }
  }

  // ═════════ A1 · the hook: 2.1亿
  const A1 = [1000, 700];
  tl.draw(O, H('2.1亿', A1[0], A1[1], { h: 210, align: 'center', w: 22 }), .35, { by: Math.max(T('l01', '亿'), 1.6) });
  tl.draw(K, H('次浏览', A1[0], A1[1] + 170, { h: 84, align: 'center' }), T('l01', '亿') + .05, { by: VE('l01') + .2 });
  tl.draw(K, H('Dan Koe', A1[0], A1[1] + 330, { h: 74, align: 'center' }), T('l02', '年初'), { by: T('l02', 'Dan Koe') + .35 });
  tl.draw(K2, H('“How to Fix Your Entire Life in 1 Day”', A1[0], A1[1] + 440, { h: 38, align: 'center' }), T('l02', '一篇文章', 0), { by: T('l02', '刷遍') });
  // burst of rays around the number: "刷遍了整个互联网"
  const rays = []; for (let i = 0; i < 9; i++) { const a = -Math.PI * .95 + i / 8 * Math.PI * .9, r0 = 300, r1 = 380 + (i % 2) * 50; rays.push(W.line(A1[0] + Math.cos(a) * r0 * 1.3, A1[1] - 80 + Math.sin(a) * r0 * .75, A1[0] + Math.cos(a) * r1 * 1.3, A1[1] - 80 + Math.sin(a) * r1 * .75, { w: 9 })); }
  tl.draw(G, rays, T('l02', '刷遍', 0), { by: T('l02', '互联网') });

  // ═════════ A2 · six topics → one system
  const C2 = [1250, 1990], R2 = 430;
  const topics = [['人生方向', '人生方向'], ['身份', '身份'], ['注意力', '注意力'], ['写作', '写作'], ['个人品牌', '个人品牌'], ['一人公司', '一人公司']];
  const angs = [-150, -90, -30, 30, 90, 150].map(a => a * Math.PI / 180);
  const node = i => [C2[0] + Math.cos(angs[i]) * R2, C2[1] + Math.sin(angs[i]) * R2 * .8];
  // the pen rides a line down from the hook to the first node
  const lead = W.curve([[A1[0] - 40, A1[1] + 500], [A1[0] - 160, 1450], node(0)], { w: 8 });
  tl.draw(G, lead, VO.l03 - .55, { by: T('l03', '人生方向', 0) });
  topics.forEach(([w, sub], i) => {
    const [nx, ny] = node(i), c = Math.cos(angs[i]), s = Math.sin(angs[i]);
    const al = c > .3 ? 'left' : c < -.3 ? 'right' : 'center', lx = nx + (al === 'left' ? 46 : al === 'right' ? -46 : 0);
    const ly = s < -.5 ? ny - 50 : s > .5 ? ny + 110 : ny + 26;
    const t0 = T('l03', sub, 0) - .1, t1 = T('l03', sub) + .1;
    tl.draw(K, [W.circle(nx, ny, 16, { w: 9, lap: .4 })], t0 - .22, { by: t0 });
    tl.draw(K, H(w, lx, ly, { h: 60, align: al }), t0, { by: t1 });
  });
  // "连成了一套系统": ring through the nodes + 系统 in the centre
  tl.draw(G, [W.arc(C2[0], C2[1], R2, -2.62, -2.62 + TAU + .25, { w: 10, ry: R2 * .8 })], T('l03', '连成', 0), { by: T('l03', '一套') });
  tl.draw(O, H('系统', C2[0], C2[1] + 50, { h: 110, align: 'center', w: 15 }), T('l03', '一套', 0), { by: VE('l03') + .15 });
  // l04 quote
  const Q4 = [1250, 2720];
  tl.draw(K, H('“你的心智，是你理解现实的', Q4[0] - 560, Q4[1], { h: 58 }), VO.l04 + .1, { by: T('l04', '现实的') });
  const q4a = H('“你的心智，是你理解现实的', Q4[0] - 560, Q4[1], { h: 58 });
  const q4c = H('操作系统', q4a.x0 + q4a.width + 6, Q4[1], { h: 58 });
  const q4d = H('”', q4c.x0 + q4c.width + 4, Q4[1], { h: 58 });
  tl.draw(O, q4c, T('l04', '操作', 0), { by: T('l04', '系统') + .1 });
  tl.draw(K, q4d, T('l04', '系统') + .12, { by: T('l04', '系统') + .3 });
  tl.draw(K2, H('— Dan Koe', Q4[0] + 560, Q4[1] + 100, { h: 40, align: 'right' }), T('l04', '系统'), { by: VE('l04') + .7 });

  // ═════════ A3 · it changed me (dashed → solid)
  const A3y = 3420, Lx0 = 330, Lx1 = 1880;
  tl.draw(K, H('它改变了我', 300, 3230, { h: 76 }), VO.l05 + .15, { by: VE('l05') });
  tl.draw(G, H('学 AI 提效', Lx0, A3y - 70, { h: 52 }), T('l06', '学', 0), { by: T('l06', '提效') });
  // sharing that keeps breaking: irregular dashes
  const dsh = []; { let x = Lx0; const Rd = mulberry(31); while (x < Lx1 - 40) { const l = 60 + Rd() * 110, g = 50 + Rd() * 150; dsh.push(W.line(x, A3y + (Rd() - .5) * 8, Math.min(Lx1, x + l), A3y + (Rd() - .5) * 8, { w: 10, kind: 'dash' })); x += l + g; } }
  tl.draw(K, dsh, T('l06', '总想分享', 0), { by: T('l06', '断断续续') });
  tl.draw(K2, H('分享', Lx1 + 50, A3y + 22, { h: 60 }), T('l06', '分享', 0), { by: T('l06', '分享') + .25 });
  tl.draw(K, H('你把自己当成谁?', 1220, 3640, { h: 72, align: 'center' }), T('l07', '而是', 0), { by: VE('l07') + .1 });
  const who1 = H('偶尔写点东西的人', 330, 3850, { h: 56 });
  tl.draw(K2, who1, VO.l08 + .1, { by: T('l08', '的人') });
  tl.draw(K, [W.line(310, 3830, who1.x0 + who1.width + 20, 3826, { w: 10 })], T('l08', '停下来', 0), { by: T('l08', '正常') });
  const MAG1 = [440, 4040];
  const who2 = H('持续分享 AI 提效的博主', 540, 4060, { h: 62, w: 10 });
  tl.draw(O, who2, T('l09', '持续', 0), { by: T('l09', '博主') });
  cues.mag1 = T('l09', '持续', 0) - .3;
  // l10: the broken line is redrawn as one continuous line (identity first, action follows)
  tl.draw(G, W.arrow(Lx0 - 10, A3y + 4, Lx1 + 10, A3y + 2, { w: 12, head: 40 }), VO.l10 + .05, { by: VE('l10') + .1 });

  // ═════════ B1 · 1297 → 11
  const F = { x: 2950, y: 300, w: 2500, h: 1260 };   // the content system
  const frame = W.dashed([[F.x, F.y], [F.x + F.w, F.y], [F.x + F.w, F.y + F.h], [F.x, F.y + F.h], [F.x, F.y + 8]], { w: 7, dash: 46, gap: 30, smooth: 0 });
  tl.draw(G, frame, VO.l11 - .1, { by: T('l11', '内容体系') });
  tl.draw(G, H('内容体系', F.x, F.y - 40, { h: 52 }), T('l11', '内容体系', 0), { by: T('l11', '切面', 0) });
  // the doc grid: 1297 tiny marks (Isotype); the first one is the viral post
  const NC = 49, NR = 27, sx = (F.w - 120) / NC, sy = (F.h - 110) / NR, docs = [];
  for (let i = 0; i < 1297; i++) {
    const c = i % NC, r = Math.floor(i / NC), x = F.x + 70 + c * sx, y = F.y + 60 + r * sy;
    docs.push({ x, y, s: W.poly([x, y + 30, x, y, x + 17, y, x + 24, y + 7, x + 24, y + 30, x, y + 30], { w: 4.5, jitter: .3 }) });
  }
  tl.draw(O, [docs[0].s], T('l11', '一篇爆文', 0), { by: T('l11', '爆文') });
  tl.draw(O, [W.circle(docs[0].x + 12, docs[0].y + 15, 34, { w: 7 })], T('l11', '切面', 0), { by: T('l11', '切面') + .2 });
  const half = Math.floor(docs.length / 2);
  tl.draw(K, docs.slice(1, half).map(d => d.s), T('l12', '公开内容', 0), { by: T('l12', '资料'), minGap: .001 });
  tl.draw(K2, docs.slice(half).map(d => d.s), T('l12', '公开内容', 0) + .1, { by: T('l12', '资料') + .1, minGap: .001 });
  tl.draw(G, H('1297 份资料', F.x + F.w / 2, F.y + F.h + 120, { h: 74, align: 'center' }), T('l12', '一千', 0), { by: VE('l12') + .2 });
  // silence, then the eraser: three passes (检索 / 去重 / 深读), ghosts stay
  const e0 = VO.l13 - .75, eD = (VE('l13') + .35 - e0) / 3;
  cues.silence0 = VE('l12') + .25; cues.erase0 = e0;
  for (let k = 0; k < 3; k++) tl.erase(W.zigzag(F.x + 40, F.y + 40 + k * (F.h - 80) / 3, F.w - 80, (F.h - 80) / 3, 4, k % 2 ? -1 : 1), e0 + k * eD, eD * .96, { width: 150, strength: .9 });
  // funnel + words
  const FN = { x0: F.x + F.w + 70, x1: F.x + F.w + 800, y0: F.y + 30, y1: F.y + F.h - 30, mid: F.y + F.h / 2 };
  tl.draw(G, [W.line(FN.x0, FN.y0, FN.x1, FN.mid - 70, { w: 10 }), W.line(FN.x0, FN.y1, FN.x1, FN.mid + 70, { w: 10 })], e0 - .2, { by: VO.l13 + .15 });
  [['检索', '多轮检索'], ['去重', '去重'], ['深读', '深读']].forEach(([w, sub], k) =>
    tl.draw(K, H(w, FN.x0 + 300, FN.mid - 170 + k * 150, { h: 54, align: 'center' }), T('l13', sub, 0) - .05, { by: T('l13', sub) + .1 }));
  // survivors: 11 marks re-inked in orange where the eraser passed
  const surv = [41, 170, 263, 388, 455, 602, 717, 803, 951, 1066, 1240];
  tl.draw(O, surv.map(i => { const { x, y } = docs[i]; return W.poly([x, y + 30, x, y, x + 17, y, x + 24, y + 7, x + 24, y + 30, x, y + 30], { w: 6 }); }), VE('l13') + .3, { by: T('l14', '留下'), minGap: .01 });
  tl.draw(G, W.arrow(FN.x1 + 10, FN.mid, FN.x1 + 170, FN.mid, { w: 10, head: 30 }), T('l14', '留下', 0), { by: T('l14', '十一', 0) });
  // 11 boxes
  const BX = { x: FN.x1 + 230, y: F.y + 70, cw: 300, rh: 270, w: 236, h: 200 };
  const boxes = []; for (let i = 0; i < 11; i++) { const c = i % 4, r = Math.floor(i / 4); boxes.push(W.roundRect(BX.x + c * BX.cw, BX.y + r * BX.rh, BX.w, BX.h, 26, { w: 9 })); }
  tl.draw(K, boxes, T('l14', '十一', 0), { by: T('l14', '可调用'), minGap: .02 });
  tl.draw(O, H('11', BX.x + 3 * BX.cw + 118, BX.y + 2 * BX.rh + 175, { h: 150, align: 'center', w: 18 }), T('l14', '十一', 0), { by: T('l14', '十一') + .35 });
  tl.draw(K2, H('个可调用决策框架', BX.x + 2 * BX.cw - 32, BX.y + 3 * BX.rh + 70, { h: 62, align: 'center' }), T('l14', '可调用', 0), { by: VE('l14') + .3 });

  // ═════════ B2 · five domains
  const DY = 2230, DX = [3450, 4400, 5350, 6300, 7250];
  tl.draw(G, H('五大领域', 3000, 1900, { h: 70 }), VO.l15 + .05, { by: T('l15', '五大领域') + .1 });
  const icon = [
    (x, y) => [W.circle(x, y, 96, { w: 9 }), W.circle(x, y - 122, 18, { w: 7 }), W.poly([x - 40, y + 40, x + 14, y - 14, x + 40, y - 40, x - 14, y + 14, x - 40, y + 40], { w: 8 }), W.circle(x, y, 8, { w: 6 })],
    (x, y) => [0, 1, 2, 3].map(i => W.roundRect(x - 92 + (i % 2) * 100, y - 92 + (i >> 1) * 100, 84, 84, 14, { w: 8 })),
    (x, y) => [W.roundRect(x - 110, y - 60, 220, 150, 18, { w: 9 }), W.poly([x - 42, y - 60, x - 42, y - 100, x + 42, y - 100, x + 42, y - 60], { w: 8 }), W.line(x - 110, y + 2, x + 110, y + 2, { w: 7 }), W.roundRect(x - 18, y - 12, 36, 30, 6, { w: 6 })],
    (x, y) => [W.poly([x - 70, y + 90, x - 40, y - 10, x + 40, y - 90, x + 80, y - 50, x + 10, y + 30, x - 70, y + 90], { w: 9 }), W.line(x - 70, y + 90, x - 8, y + 26, { w: 6 }), W.circle(x - 4, y + 22, 13, { w: 6 }), W.line(x + 30, y - 100, x + 90, y - 40, { w: 8 })],
    (x, y) => [W.poly([x - 80, y - 110, x + 40, y - 110, x + 85, y - 65, x + 85, y + 110, x - 80, y + 110, x - 80, y - 110], { w: 9 }), W.poly([x + 40, y - 110, x + 40, y - 65, x + 85, y - 65], { w: 7 }), ...[-30, 15, 60].map(d => W.line(x - 45, y + d, x + 50, y + d, { w: 7 }))],
  ];
  const dom = [['人生方向与身份', '人生方向与身份'], ['Human 3.0', 'Human 三点零'], ['一人公司', '一人公司'], ['内容与个人品牌', '内容与个人品牌'], ['写作与表达', '写作与表达']];
  dom.forEach(([w, sub], i) => {
    const t0 = T('l15', sub, 0), t1 = T('l15', sub);
    tl.draw(K, icon[i](DX[i], DY), t0 - .55, { by: t0 + (t1 - t0) * .45 });
    tl.draw(K2, H(w, DX[i], DY + 230, { h: 52, align: 'center' }), t0 - .1, { by: t1 + .15 });
  });

  // ═════════ B3 · the judgment chain
  const CY = 3150, CX = [3350, 4300, 5250, 6200, 7150], CW = 640, CH = 150;
  const pw = H('模仿口吻的提示词', 3000, 2880, { h: 54 });
  tl.draw(K2, pw, T('l16', '模仿', 0), { by: T('l16', '提示词') });
  tl.draw(K, [W.line(2980, 2862, pw.x0 + pw.width + 20, 2856, { w: 10 })], T('l16', '提示词') + .05, { by: T('l16', '而是', 0) });
  tl.draw(G, H('判断链路', 4400, 2885, { h: 76 }), T('l16', '判断', 0) - .15, { by: VE('l16') + .2 });
  const chain = [['真实问题', '识别真实问题', 0], ['识别意图', '识别真实问题', 1], ['选择 1-3 个框架', '选择一到三个框架', 1], ['读取证据', '回到对应证据', 1], ['给出下一步', '给出下一步行动', 1]];
  chain.forEach(([w, sub, ed], i) => {
    const tA = i === 0 ? T('l17', '识别', 0) - .1 : i === 1 ? T('l17', '真实问题', 0) : T('l17', sub, 0) - .05;
    const tB = i === 0 ? T('l17', '真实问题', 0) : i === 1 ? T('l17', '真实问题') + .05 : T('l17', sub) - .05;
    const pen = i % 2 ? K2 : K;
    tl.draw(pen, [W.roundRect(CX[i] - CW / 2, CY - CH / 2, CW, CH, 40, { w: 9 })], tA - .45, { by: tA });
    tl.draw(pen, H(w, CX[i] + (i === 4 ? 40 : 0), CY + 26, { h: 52, align: 'center', color: i === 4 ? INK.orange : undefined }), tA, { by: tB });
    if (i) tl.draw(G, W.arrow(CX[i - 1] + CW / 2 + 22, CY, CX[i] - CW / 2 - 22, CY, { w: 9, head: 26 }), tA - .7, { by: tA - .48 });
  });
  // the flag on the last node
  const FL = [CX[4] - 230, CY + 50];
  tl.draw(O, [W.line(FL[0], FL[1], FL[0], FL[1] - 110, { w: 9 }), W.poly([FL[0], FL[1] - 110, FL[0] + 74, FL[1] - 88, FL[0], FL[1] - 64], { w: 8 })], T('l17', '下一步', 0) - .1, { by: T('l17', '行动') });

  // ═════════ B4 · example: "我总是拖延"
  const EX = [3060, 3720];
  tl.draw(G, W.arrow(CX[0] - 120, CY + CH / 2 + 15, CX[0] - 200, EX[1] - 110, { w: 8, head: 24 }), VO.l18 - .5, { by: VO.l18 + .1 });
  const MAG2 = [EX[0] - 30, EX[1] + 5];
  cues.mag2 = T('l18', '我总是拖延', 0) - .35;
  const lz = H('“我总是拖延”', EX[0] + 20, EX[1], { h: 62 });
  tl.draw(K, lz, T('l18', '我总是拖延', 0), { by: T('l18', '拖延') + .1 });
  const todo = H('待办清单', EX[0] + 90, EX[1] + 150, { h: 46 });
  tl.draw(K2, todo, T('l18', '待办清单', 0) - .2, { by: T('l18', '清单') });
  const tdx = todo.x0 + todo.width;
  tl.draw(K, [W.line(todo.x0 - 20, EX[1] + 90, tdx + 20, EX[1] + 170, { w: 9 }), W.line(tdx + 20, EX[1] + 90, todo.x0 - 20, EX[1] + 170, { w: 9 })], T('l18', '清单') + .05, { by: VE('l18') + .2 });
  const BR0 = [lz.x0 + lz.width + 40, EX[1] - 22], BRX = BR0[0] + 380;
  const br = [['目标', 3500, '目标'], ['身份', 3650, '身份'], ['恐惧', 3800, '恐惧'], ['现实条件', 3950, '现实条件']];
  br.forEach(([w, y, sub], i) => {
    const t0 = T('l19', sub, 0);
    tl.draw(G, [W.curve([BR0, [BR0[0] + 180, (BR0[1] + y) / 2], [BRX - 20, y - 18]], { w: 8 })], t0 - .4, { by: t0 - .02 });
    tl.draw(K, H(w, BRX, y, { h: 54 }), t0, { by: T('l19', sub) + .08 });
  });
  const sid = [BRX + 64, 3650 - 20];
  tl.draw(O, [W.arc(sid[0], sid[1], 110, -2.4, -2.4 + TAU + .35, { w: 10, ry: 58 })], VE('l19') + .1, { by: VE('l19') + .8 });

  // ═════════ C · bring a real question
  const UX = 5620;
  tl.draw(O, H('带着真问题来', UX, 3640, { h: 70, w: 11 }), T('l20', '带着', 0), { by: VE('l20') + .1 });
  [['1  你想解决什么', '你想解决什么'], ['2  你的真实背景', '你的真实背景'], ['3  你希望得到什么', '你希望得到什么']].forEach(([w, sub], i) =>
    tl.draw(i % 2 ? K2 : K, H(w, UX + 30, 3830 + i * 165, { h: 56 }), T('l21', sub, 0) - .1, { by: T('l21', sub) + .1 }));

  // ═════════ ending: the flag, circled twice; pen capped; end card
  const nx = CX[4], nyy = CY;
  const c0 = T('l24', '迈出', 0);
  tl.draw(O, [W.arc(nx, nyy, CW * .62, -2.5, -2.5 + TAU * 2 + .3, { w: 11, ry: CH * 1.05 })], c0, { by: VE('l24') + .55 });
  cues.cap = VE('l24') + 1.15;
  const ec = VE('l24') + 1.6;
  tl.draw(K, H('Dan Koe 个人成长操作系统 Skill', nx, nyy + 290, { h: 46, align: 'center' }), ec, { by: ec + 2.3 });
  tl.draw(G, H('github.com/youyoumaixiang10/Dan-Koe-', nx, nyy + 380, { h: 34, align: 'center' }), ec + 2.4, { by: ec + 4.0 });
  tl.end();

  // ═════════ board + props
  const board = new W.Board(tl, { ghosts });
  // camera (t, x, y, zoom, rot, ease)
  const ck = [];
  const key = (t, x, y, z, r = 0, e = 'io') => ck.push([+t.toFixed(3), x, y, z, r, e]);
  key(0, A1[0], A1[1] - 60, 1.75, -.01);
  key(VE('l01') + .2, A1[0], A1[1] - 20, 1.55, -.004, 's');
  key(VO.l02 + .3, A1[0], A1[1] + 120, 1.15, 0);
  key(VE('l02') + .2, A1[0], A1[1] + 200, 1.05, .004, 's');
  // ride the lead line down into the ring
  key(T('l03', '人生方向', 0) + .1, C2[0] - 120, C2[1] - 260, .95, 0, 'io');
  key(T('l03', '连成', 0), C2[0], C2[1] - 10, .88, 0, 's');
  key(VE('l03') + .4, C2[0], C2[1] + 60, .86, 0, 's');
  key(VO.l04 + .3, C2[0], 2440, .9, 0);
  key(VE('l04') + .9, C2[0], 2470, .92, 0, 'l');
  // whip to "it changed me"
  key(VO.l05 - .1, 1180, 3640, .9, .01, 'io');
  key(VE('l06'), 1150, 3560, .92, 0, 's');
  key(VE('l08'), 1150, 3700, .9, 0, 's');
  key(VE('l09'), 1180, 3720, .9, -.003, 's');
  key(VE('l10') + .5, 1150, 3660, .86, 0, 's');
  // whip up-right to the content system
  key(VO.l11 + .25, F.x + F.w / 2, F.y + F.h / 2 + 80, .66, 0, 'io');
  key(VE('l12'), F.x + F.w / 2 + 60, F.y + F.h / 2 + 100, .62, 0, 's');
  key(VO.l13 + .2, F.x + F.w / 2 + 600, F.y + F.h / 2 + 60, .56, 0, 's');
  key(VE('l13') + .2, FN.x0 + 300, F.y + F.h / 2 + 60, .62, 0, 's');
  key(T('l14', '十一', 0), BX.x + 560, F.y + F.h / 2 + 90, .88, 0, 'io');
  key(VE('l14') + .5, BX.x + 520, F.y + F.h / 2 + 110, .86, 0, 's');
  // track along the five domains
  key(VO.l15 - .2, 3800, 2160, .95, 0, 'io');
  key(T('l15', '人生方向与身份'), 3900, 2180, .95, 0, 's');
  key(T('l15', '写作与表达', 0), 6900, 2200, .95, 0, 'l');
  key(VE('l15') + .9, 5330, 2180, .44, 0, 'io');
  key(VO.l16 - .05, 5330, 2190, .45, 0, 'l');
  // the chain
  key(VO.l16 + .2, 3900, 2980, .95, 0, 'io');
  key(VE('l16') + .2, 4100, 3020, .95, 0, 's');
  key(T('l17', '真实问题'), 3900, 3080, .95, 0, 's');
  key(T('l17', '给出', 0), 6700, 3100, .95, 0, 'l');
  key(VE('l17') + .2, 6750, 3090, .95, 0, 's');
  key(VO.l18 - .55, 6760, 3090, .95, 0, 'l');
  // return to the first node: the example
  key(VO.l18 + .2, 3950, 3640, .95, -.006, 'io');
  key(VE('l19') + .9, 4000, 3680, .92, 0, 's');
  // whip right: bring a real question
  key(VO.l20 + .05, 6350, 3880, .98, .006, 'io');
  key(VE('l21') + .6, 6320, 3900, .96, 0, 's');
  // pull back past the board edge: the whole lesson as one picture
  key(VO.l22 + 3.0, 4000, 2280, .205, 0, 'io');
  key(VE('l23') + .1, 4000, 2280, .225, 0, 'l');
  // push into the flag
  key(c0 + .3, nx - 60, nyy + 10, 1.35, 0, 'io');
  key(VE('l24') + 1.4, nx - 40, nyy + 30, 1.4, 0, 's');
  key(ec + .6, nx, nyy + 200, 1.15, 0, 'io');
  key(END, nx, nyy + 210, 1.1, 0, 's');
  const cam = new W.Camera(ck);

  // magnets
  const magnet = (pos, tDrop, color) => ({
    draw: (ctx, t, c) => {
      if (t < tDrop - .4) return;
      const u = clamp((t - tDrop + .4) / .4), lift = (1 - u) ** 2;
      W.drawPinMagnet(ctx, pos[0], pos[1] - lift * 60, c, { lift, size: 120, color });
    }
  });
  board.objs.push(magnet(MAG1, cues.mag1, INK.orange), magnet(MAG2, cues.mag2, INK.green));
  for (const e of tl.erasers) board.objs.push({ draw: (ctx, t, c) => W.drawEraser(ctx, e, t, c) });
  for (const p of PENS) board.objs.push({ draw: (ctx, t, c) => { if (p === O && t > cues.cap) return; W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });
  // the orange marker gets its cap back and is laid down after the final circle
  board.objs.push({
    draw: (ctx, t, c) => {
      if (t < cues.cap - .5) return;
      const u = clamp((t - cues.cap + .5) / .5), x = lerp(nx + 520, nx + 470, u), y = lerp(nyy - 120, nyy - 60, u);
      W.drawMarker(ctx, O, { x, y, lift: (1 - u) * .8, ang: lerp(-.95, -.25, u) }, c, t);
    }
  });

  // ───────── subtitles: split at clauses, ≤ 22 CJK chars per row
  const subs = [];
  for (const L of lines) {
    const disp = L.text, parts = disp.match(/[^，。：；、！？]+[，。：；、！？]*/g).reduce((acc, p) => {
      const last = acc[acc.length - 1];
      if (last != null && (last + p).length <= 22) acc[acc.length - 1] += p; else acc.push(p); return acc;
    }, []);
    let c = 0;
    const say = L.say || L.text;
    for (const p of parts) {
      const f0 = c / disp.length, f1 = (c + p.length) / disp.length; c += p.length;
      const t0 = VO[L.id] + dur[L.id] * f0 - .05, t1 = VO[L.id] + dur[L.id] * f1 + .3;
      subs.push({ t0, t1, text: p.replace(/[，。：；、]$/, '') });
    }
  }
  for (let i = 0; i < subs.length; i++) {
    const nxt = subs[i + 1] ? subs[i + 1].t0 - .04 : END;
    subs[i].t1 = Math.min(Math.max(subs[i].t1, subs[i].t0 + 1.8), nxt);
  }
  board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '46px SUB';
      const w = ctx.measureText(s.text).width + 72, h = 74, y0 = 1036 - h;
      ctx.globalAlpha = a * .9; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(960 - w / 2, y0, w, h, 14); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = INK.orange; ctx.fillRect(960 - w / 2 + 22, y0 + h - 12, 36, 4);
      ctx.fillStyle = '#23262c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.text, 960, y0 + 39);
    }
  });
  if (q.has('nosubs')) board.overlays.length = 0;

  // ───────── frame render with camera motion blur on fast moves
  const off = new OffscreenCanvas(1920, 1080), oc = off.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(12, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
  }

  // sound events, panned by where the stroke is on screen
  const ev = [...tl.ev, ...Object.entries(VO).map(([id, t]) => ({ t, type: 'vo', id })),
    { t: cues.mag1, type: 'magnet' }, { t: cues.mag2, type: 'magnet' }, { t: cues.cap, type: 'cap' }].sort((a, b) => a.t - b.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - 960) / 1400, -.7, .7).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < 2020 && py > -100 && py < 1180 ? 1 : 0; }
  const texts = t => { const s = subs.find(s => t >= s.t0 && t < s.t1); return s ? [{ id: 'sub', text: s.text, x0: 400, y0: 960, x1: 1520, y1: 1040 }] : []; };
  return { dur: END, render, ev, subs, cam, tl, VO, texts,
    cues: { BPM, BEAT, ...cues, VO, VE: Object.fromEntries(lines.map(l => [l.id, +VE(l.id).toFixed(3)])),
      chainEnd: VE('l17'), wide0: VO.l22, push0: c0, endCard: ec } };
}
