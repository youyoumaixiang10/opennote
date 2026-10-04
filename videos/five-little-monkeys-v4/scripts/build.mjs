// Five Little Monkeys v4 — the user's ChatGPT picture-book art, timed to the
// user-supplied song (assets/song.wav, not committed). Timings come from the
// scene cuts of the reference video (scripts/cues.json); no lyrics are shown.
import { readFileSync, writeFileSync } from "node:fs";

const C = JSON.parse(readFileSync("scripts/cues.json", "utf8"));
const B = C.beat;
const TOTAL = C.total;
const r = (x) => Math.round(x * 1000) / 1000;

const NUM = { 0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" };
const COLORS = ["red", "yellow", "green", "blue", "purple"];
const MW = 300, MH = 330, FEET = 820;
const cx = (count, i) => 960 + (i - (count - 1) / 2) * 212;
const BASE_L = 960 - MW / 2;
const PILE = [{ side: 1, x: 1560 }, { side: 1, x: 1700 }, { side: 1, x: 1830 }, { side: -1, x: 300 }, { side: -1, x: 140 }];
const PILE_FEET = 930, PILE_S = 0.88;

const monkeysHtml = COLORS.map((c, i) => `<div class="monkey" id="mk${i}" style="left:${BASE_L}px;top:${FEET - MH}px">
  <img class="p-jump" src="art/${c}_jump.png"/><img class="p-fall" src="art/${c}_fall.png"/><img class="p-hurt" src="art/${c}_hurt.png"/></div>`).join("");

const tagsHtml = [5, 4, 3, 2, 1].map((n) => Array.from({ length: n }, (_, j) =>
  `<div class="tag" id="tg${n}_${j}" style="left:${cx(n, j) - 40}px;top:${FEET - MH - 50}px">${j + 1}</div>`).join("")).join("");
const T = [];
const add = (s) => T.push(s);
const seen = new Set();
function fromTo(sel, from, to, t) {
  const ir = seen.has(sel) ? ", immediateRender:false" : "";
  seen.add(sel);
  add(`tl.fromTo("${sel}", ${from}, {${to}${ir}}, ${r(t)});`);
}
const to = (sel, vars, t) => add(`tl.to("${sel}", {${vars}}, ${r(t)});`);
const set = (sel, vars, t) => add(`tl.set("${sel}", {${vars}}, ${r(t)});`);
const onBeat = (t) => C.beat0 + Math.round((t - C.beat0) / B) * B;

// intro
fromTo("#title", "{y:-60, opacity:0, scale:.8}", "y:0, opacity:1, scale:1, duration:.9, ease:'back.out(1.6)'", 0.4);
to("#title", "y:-40, opacity:0, duration:.6, ease:'power2.in'", C.verses[0].count - 1.2);
for (let i = 0; i < 5; i++) {
  const t = onBeat(3 + i * B * 2);
  fromTo(`#mk${i}`, `{x:${cx(5, i) - 960}, y:-1100}`, `x:${cx(5, i) - 960}, y:0, duration:${r(B * 0.9)}, ease:'bounce.out'`, t - B * 0.9);
}
fromTo("#counter", "{opacity:0, scale:.5, rotation:-10}", "opacity:1, scale:1, rotation:0, duration:.6, ease:'back.out(2)'", C.verses[0].count - 0.8);
set("#cnt5", "opacity:1", C.verses[0].count - 0.8);

function bounce(ids, from, until) {
  from = onBeat(from);
  const n = Math.floor((until - from) / B);
  if (n < 1) return;
  ids.forEach((id, j) => {
    const h = j % 2 ? 110 : 150;
    add(`tl.to("#${id}", {y:-${h}, duration:${r(B / 2)}, ease:"power2.out", yoyo:true, repeat:${2 * n - 1}}, ${r(from)});`);
  });
}

let alive = [0, 1, 2, 3, 4];
C.verses.forEach((v, k) => {
  const n = 5 - k, pile = PILE[k];
  const f = pile.side > 0 ? alive[alive.length - 1] : alive[0];
  // counting: a number pops over each monkey, left to right, on half beats
  alive.forEach((i, j) => {
    const t = v.count + j * (B / 2);
    fromTo(`#tg${n}_${j}`, "{opacity:0, scale:.3}", "opacity:1, scale:1, duration:.2, ease:'back.out(3)'", t);
    to(`#tg${n}_${j}`, "opacity:0, duration:.25", v.count + n * (B / 2) + 1.2);
  });
  const tSlip = v.bump - 1.95, tOff = v.bump - 1.45;
  bounce(alive.map((i) => `mk${i}`), v.count + n * (B / 2) + 0.3, tSlip);
  // slip, flip, land
  const x0 = cx(n, alive.indexOf(f)) - 960, xEdge = x0 + 90 * pile.side, x1 = pile.x - 960;
  to(`#mk${f}`, `x:${xEdge}, rotation:${14 * pile.side}, duration:.25, ease:"power2.out"`, tSlip);
  set(`#mk${f} .p-jump`, "opacity:0", tOff);
  set(`#mk${f} .p-fall`, "opacity:1", tOff);
  const up = (v.bump - tOff) * 0.5;
  to(`#mk${f}`, `x:${r((xEdge + x1) / 2)}, y:-200, rotation:${-20 * pile.side}, duration:${r(up)}, ease:"power2.out"`, tOff);
  to(`#mk${f}`, `x:${x1}, y:${PILE_FEET - FEET}, rotation:0, scale:${PILE_S}, duration:${r(v.bump - tOff - up)}, ease:"power2.in"`, tOff + up);
  set(`#mk${f} .p-fall`, "opacity:0", v.bump);
  set(`#mk${f} .p-hurt`, "opacity:1", v.bump);
  fromTo(`#mk${f}`, `{scaleY:${PILE_S * 0.8}}`, `scaleY:${PILE_S}, duration:.45, ease:"elastic.out(1,.4)"`, v.bump);
  fromTo("#bump", `{x:${x1}, y:${PILE_FEET - FEET - 60}, opacity:0, scale:.2, rotation:-20}`, "opacity:1, scale:1, rotation:0, duration:.25, ease:'back.out(3)'", v.bump);
  to("#bump", "opacity:0, scale:1.3, duration:.3", v.bump + 1.1);
  fromTo(`#mk${f}`, "{rotation:-4}", `rotation:4, duration:${r(B / 2)}, yoyo:true, repeat:3, ease:"sine.inOut"`, v.bump + 0.8);
  // math
  fromTo("#eq", "{opacity:0, x:-30}", "opacity:1, x:0, duration:.35, ease:'back.out(2)'", v.bump + 0.2);
  set(`#eqr${n}`, "opacity:1", v.bump + 0.2);
  fromTo(`#eqc${n}`, "{scale:2, opacity:0}", "scale:1, opacity:1, duration:.35, ease:'back.out(3)'", v.bump + 1.2);
  // mama phones, doctor answers
  fromTo("#mama", "{scale:0, opacity:0}", "scale:1, opacity:1, duration:.45, ease:'back.out(1.8)'", v.mama - 0.2);
  fromTo("#mama", "{rotation:-4}", `rotation:4, duration:${r(B / 4)}, yoyo:true, repeat:13, ease:"sine.inOut"`, v.mama + 0.1);
  fromTo("#ring", "{opacity:0, scale:.6}", `opacity:1, scale:1.15, duration:${r(B / 2)}, yoyo:true, repeat:5`, v.mama + 0.1);
  to("#mama", "scale:0, opacity:0, duration:.3, ease:'back.in(2)'", v.doc - 0.1);
  fromTo("#doc", "{scale:0, opacity:0}", "scale:1, opacity:1, duration:.45, ease:'back.out(1.8)'", v.doc - 0.2);
  fromTo("#doc", "{rotation:-4}", `rotation:4, duration:${r(B / 2)}, yoyo:true, repeat:${Math.floor((v.nomore + 3.4 - v.doc) / (B / 2)) - 1}, ease:"sine.inOut"`, v.doc + 0.3);
  to("#doc", "scale:0, opacity:0, duration:.35, ease:'back.in(2)'", v.nomore + 3.6);
  const rest = alive.filter((i) => i !== f);
  rest.forEach((i, j) => fromTo(`#mk${i}`, "{rotation:0}", `rotation:${j % 2 ? -5 : 5}, duration:${r(B)}, yoyo:true, repeat:3, ease:"sine.inOut"`, v.nomore));
  // interlude: counter flips, survivors regroup
  const brk = v.nomore + 3.9;
  to(`#cnt${n}`, "opacity:0, scale:.3, duration:.25", brk);
  fromTo(`#cnt${n - 1}`, "{opacity:0, scale:1.7}", "opacity:1, scale:1, duration:.45, ease:'back.out(2.2)'", brk + 0.2);
  if (n > 1) { to("#eq", "opacity:0, duration:.3", brk + 1.2); set(`#eqr${n}`, "opacity:0", brk + 1.6); }
  rest.forEach((i, j) => to(`#mk${i}`, `x:${cx(rest.length, j) - 960}, rotation:0, duration:${r(B * 2)}, ease:"power2.inOut"`, brk + 0.2));
  alive = rest;
});

// ending: good night
to(".monkey", "opacity:0, duration:.5", C.ending - 0.3);
to("#counter", "opacity:0, duration:.4", C.ending - 0.3);
to("#eq", "opacity:0, duration:.3", C.ending - 0.3);
fromTo("#goodnight", "{opacity:0, scale:1.08}", "opacity:1, scale:1, duration:1.0, ease:'power2.out'", C.ending - 0.3);
for (let i = 0; i < 3; i++) fromTo(`#z${i}`, "{y:0, opacity:0, scale:.6}", "y:-70, opacity:1, scale:1.1, duration:1.6, ease:'sine.out'", C.ending + 0.5 + i * 0.4);
fromTo("#fade", "{opacity:0}", "opacity:1, duration:1.0", TOTAL - 1.1);

const cnts = [0, 1, 2, 3, 4, 5].map((n) => `<div class="cnt" id="cnt${n}"><div class="cn">${n}</div><div class="cw">${NUM[n]}</div></div>`).join("");
const eqs = [5, 4, 3, 2, 1].map((n) => `<div class="eqr" id="eqr${n}"><span>${n}</span><span class="op">−</span><span>1</span><span class="op">=</span><span class="eqc" id="eqc${n}">${n - 1}</span></div>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<title>Five Little Monkeys</title>
<script src="vendor/gsap.min.js"></script>
<style>
@font-face { font-family:"WenQuanYi Zen Hei"; src: local("WenQuanYi Zen Hei"); }
body { margin:0; background:#000; font-family:Nunito, "WenQuanYi Zen Hei", sans-serif; }
#root { position:relative; width:1920px; height:1080px; overflow:hidden; }
#stage { position:absolute; inset:0; }
#room { position:absolute; inset:0; width:1920px; height:1080px; }
.monkey { position:absolute; width:${MW}px; height:${MH}px; transform-origin:50% 100%; }
.monkey img { position:absolute; bottom:0; left:50%; transform:translateX(-50%); height:300px; filter: drop-shadow(0 8px 6px #3a1f0c40); }
.monkey .p-fall { height:310px; opacity:0; }
.monkey .p-hurt { height:250px; opacity:0; }
.tag { position:absolute; width:80px; height:80px; border-radius:50%; background:#fff6e4; box-shadow:0 6px 0 #c98a52, 0 10px 20px #0004;
  display:flex; align-items:center; justify-content:center; font-weight:900; font-size:54px; color:#e2553f; opacity:0; z-index:2; }
#bump { position:absolute; left:${960 - 90}px; top:${FEET - 120}px; width:180px; height:120px; display:flex; align-items:center; justify-content:center;
  font-weight:900; font-size:40px; color:#fff; background:#ff6b5a; opacity:0;
  clip-path: polygon(50% 0,61% 28%,95% 14%,73% 44%,100% 60%,68% 66%,78% 100%,50% 78%,22% 100%,32% 66%,0 60%,27% 44%,5% 14%,39% 28%); }
#goodnight { position:absolute; inset:0; width:1920px; height:1080px; opacity:0; }
.zzz { position:absolute; font-weight:900; font-size:66px; color:#fff; opacity:0; text-shadow:0 4px 0 #6b5bd6, 0 0 20px #0006; }
#fade { position:absolute; inset:0; background:#000; opacity:0; }
#title { position:absolute; left:460px; top:70px; width:1000px; padding:26px 0 30px; text-align:center; border-radius:60px; background:#fff6e4f2; box-shadow:0 12px 30px #0004; opacity:0; }
#title .t1 { font-weight:900; font-size:96px; color:#a0522d; line-height:1; }
#title .t2 { font-size:40px; color:#c46a3a; margin-top:10px; font-family:"WenQuanYi Zen Hei", sans-serif; }
#counter { position:absolute; left:60px; top:50px; width:180px; height:190px; border-radius:30px; background:#fff6e4f2; box-shadow: 0 10px 0 #c98a52, 0 16px 30px #0004; opacity:0; }
.cnt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; }
.cn { font-weight:900; font-size:116px; line-height:1; color:#e2553f; }
.cw { font-weight:900; font-size:32px; color:#8a4b1f; }
#eq { position:absolute; left:262px; top:96px; width:340px; height:96px; border-radius:48px; background:#fff6e4f2; box-shadow:0 8px 0 #c98a5288; opacity:0; }
.eqr { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:14px; font-weight:900; font-size:66px; color:#8a4b1f; opacity:0; }
.eqr .op { color:#4a8fd8; } .eqc { color:#e2553f; display:inline-block; }
.bubble { position:absolute; width:400px; height:400px; border-radius:50%; overflow:hidden; background:#fff6e4; box-shadow: 0 0 0 12px #fff6e4, 0 20px 40px #0005; opacity:0; }
.bubble img { width:100%; height:100%; object-fit:cover; }
#mama { left:90px; top:300px; } #mama img { object-position:50% 10%; }
#doc { left:1440px; top:90px; } #doc img { object-position:50% 20%; }
#ring { position:absolute; left:470px; top:290px; width:130px; height:130px; opacity:0; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${TOTAL}">
 <section id="stage" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="1">
  <img id="room" src="art/bedroom.jpg"/>
  ${monkeysHtml}
  ${tagsHtml}
  <div id="bump">BUMP!</div>
  <img id="goodnight" src="art/goodnight.jpg"/>
  <div class="zzz" id="z0" style="left:640px;top:420px">Z<small>z</small></div>
  <div class="zzz" id="z1" style="left:960px;top:400px">Z<small>z</small></div>
  <div class="zzz" id="z2" style="left:1260px;top:430px">Z<small>z</small></div>
  <div id="title"><div class="t1">Five Little Monkeys</div><div class="t2">五只小猴子 · 学数数</div></div>
  <div id="counter">${cnts}</div>
  <div id="eq">${eqs}</div>
  <div class="bubble" id="mama"><img src="art/mama.png"/></div>
  <svg id="ring" viewBox="0 0 120 120"><path d="M20 40 Q40 15 64 24" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M28 72 Q62 58 86 32" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M48 104 Q84 92 104 62" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/></svg>
  <div class="bubble" id="doc"><img src="art/doctor.png"/></div>
  <div id="fade"></div>
 </section>
 <audio id="song" src="assets/song.wav" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-volume="1"></audio>
</div>
<script>
 window.__timelines = window.__timelines || {};
 const tl = gsap.timeline({ paused: true });
 ${T.join("\n ")}
 window.__timelines["main"] = tl;
</script>
</body></html>`;
writeFileSync("index.html", html);
console.log("total", TOTAL, "tweens", T.length);
