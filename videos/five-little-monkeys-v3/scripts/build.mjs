// Five Little Monkeys v3 — animates the ChatGPT picture-book art (art/*) to the v2 song.
import { readFileSync, writeFileSync } from "node:fs";

const S = JSON.parse(readFileSync("song.json", "utf8"));
const B = S.beat;
const TOTAL = Math.ceil(S.total);
const r = (x) => Math.round(x * 1000) / 1000;
const ev = Object.fromEntries(S.events.map((e) => [e.name, e.t]));
const L = Object.fromEntries(S.lines.map((l) => [l.tag, l]));
const word = (tag, i) => L[tag].words[i];

const NUM = { 0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" };
const ZH = {
  l1: (n) => `${"零一二三四五"[n]}只小猴子在床上，蹦得高高！`,
  l2: () => "一只掉下来——哎呀！咚！哎哟哟！",
  l3: () => "妈妈给医生打电话：叮铃铃铃铃！",
  l4: () => "不许再跳啦，小猴子！床是用来睡觉的！",
  end1: "床上没有小猴子在蹦啦。",
  end2: "五只困困的小猴子，都躺进被窝啦。",
  end3: "晚安！",
};

const COLORS = ["red", "yellow", "green", "blue", "purple"];
const MW = 300, MH = 330;            // monkey box
const FEET = 820;                    // standing on the quilt
const cx = (count, i) => 960 + (i - (count - 1) / 2) * 212;
const BASE_L = 960 - MW / 2;
// where each fallen monkey ends up on the floor (side, x centre)
const PILE = [
  { side: 1, x: 1560 }, { side: 1, x: 1700 }, { side: 1, x: 1830 }, { side: -1, x: 300 }, { side: -1, x: 140 },
];
const PILE_FEET = 930, PILE_S = 0.88;

const monkeysHtml = COLORS.map((c, i) => `<div class="monkey" id="mk${i}" style="left:${BASE_L}px;top:${FEET - MH}px">
  <img class="p-jump" src="art/${c}_jump.png"/><img class="p-fall" src="art/${c}_fall.png"/><img class="p-hurt" src="art/${c}_hurt.png"/></div>`).join("");

// ---------------- timeline ----------------
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

// intro: title, monkeys drop onto the bed on the beat
fromTo("#title", "{y:-60, opacity:0, scale:.8}", "y:0, opacity:1, scale:1, duration:.9, ease:'back.out(1.6)'", 0.3);
to("#title", "y:-40, opacity:0, duration:.6, ease:'power2.in'", ev.verse5 - 0.8);
for (let i = 0; i < 5; i++) {
  const t = 2 * S.bar + i * B;
  fromTo(`#mk${i}`, `{x:${cx(5, i) - 960}, y:-1100}`, `x:${cx(5, i) - 960}, y:0, duration:${r(B * 0.9)}, ease:'bounce.out'`, t - B * 0.9);
}
// slow push-in on the room through each verse
for (const n of [5, 4, 3, 2, 1]) {
  fromTo("#world", "{scale:1}", `scale:1.05, duration:${r(ev[`break${n}`] + S.bar - ev[`verse${n}`] - 0.3)}, ease:"sine.inOut"`, ev[`verse${n}`]);
}

// karaoke
for (const l of S.lines) {
  const id = `ly_${l.tag}`;
  fromTo(`#${id}`, "{opacity:0, y:24}", "opacity:1, y:0, duration:.25", l.start - 0.35);
  to(`#${id}`, "opacity:0, duration:.2", l.end - 0.05);
  l.words.forEach((w, i) => {
    add(`tl.to("#${id}_w${i}", {color:"#ffd45e", scale:1.08, duration:.12}, ${r(w.start)});`);
    add(`tl.to("#${id}_w${i}", {scale:1, duration:.2}, ${r(w.start + 0.14)});`);
  });
}

// counter
fromTo("#counter", "{opacity:0, scale:.5, rotation:-10}", "opacity:1, scale:1, rotation:0, duration:.6, ease:'back.out(2)'", ev.verse5 - 0.6);
set("#cnt5", "opacity:1", ev.verse5 - 0.6);

function bounce(ids, from, until) {
  const n = Math.floor((until - from) / B);
  if (n < 1) return;
  ids.forEach((id, j) => {
    const h = j % 2 ? 110 : 150;
    add(`tl.to("#${id}", {y:-${h}, duration:${r(B / 2)}, ease:"power2.out", yoyo:true, repeat:${2 * n - 1}}, ${r(from)});`);
  });
}

let alive = [0, 1, 2, 3, 4];
for (let n = 5; n >= 1; n--) {
  const k = 5 - n, pile = PILE[k];
  const f = pile.side > 0 ? alive[alive.length - 1] : alive[0];
  const l1 = L[`v${n}l1`], l2 = L[`v${n}l2`], l3 = L[`v${n}l3`], l4 = L[`v${n}l4`];
  const tFell = word(`v${n}l2`, 1).start, tOff = word(`v${n}l2`, 2).start, tBump = word(`v${n}l2`, 5).start, tMy = word(`v${n}l2`, 7).start;
  bounce(alive.map((i) => `mk${i}`), l1.start, l2.start);
  // slip, flip and fall to the floor
  const x0 = cx(n, alive.indexOf(f)) - 960, xEdge = x0 + 90 * pile.side, x1 = pile.x - 960;
  to(`#mk${f}`, `x:${xEdge}, rotation:${14 * pile.side}, duration:.25, ease:"power2.out"`, tFell);
  set(`#mk${f} .p-jump`, "opacity:0", tOff);
  set(`#mk${f} .p-fall`, "opacity:1", tOff);
  const up = (tBump - tOff) * 0.5;
  to(`#mk${f}`, `x:${r((xEdge + x1) / 2)}, y:-200, rotation:${-20 * pile.side}, duration:${r(up)}, ease:"power2.out"`, tOff);
  to(`#mk${f}`, `x:${x1}, y:${PILE_FEET - FEET}, rotation:0, scale:${PILE_S}, duration:${r(tBump - tOff - up)}, ease:"power2.in"`, tOff + up);
  set(`#mk${f} .p-fall`, "opacity:0", tBump);
  set(`#mk${f} .p-hurt`, "opacity:1", tBump);
  fromTo(`#mk${f}`, `{scaleY:${PILE_S * 0.8}}`, `scaleY:${PILE_S}, duration:.45, ease:"elastic.out(1,.4)"`, tBump);
  fromTo("#bump", `{x:${x1}, y:${PILE_FEET - FEET - 60}, opacity:0, scale:.2, rotation:-20}`, "opacity:1, scale:1, rotation:0, duration:.25, ease:'back.out(3)'", tBump);
  to("#bump", "opacity:0, scale:1.3, duration:.3", tBump + 0.9);
  fromTo(`#mk${f}`, "{rotation:-4}", `rotation:4, duration:${r(B / 2)}, yoyo:true, repeat:3, ease:"sine.inOut"`, tMy);
  // math
  fromTo("#eq", "{opacity:0, x:-30}", "opacity:1, x:0, duration:.35, ease:'back.out(2)'", tBump);
  set(`#eqr${n}`, "opacity:1", tBump);
  fromTo(`#eqc${n}`, "{scale:2, opacity:0}", "scale:1, opacity:1, duration:.35, ease:'back.out(3)'", tMy);
  set(`#eqr${n}`, "opacity:0", ev[`break${n}`] + S.bar - 0.05);
  // mama phones the doctor
  fromTo("#mama", "{scale:0, opacity:0}", "scale:1, opacity:1, duration:.5, ease:'back.out(1.8)'", l3.start - 0.25);
  const tRing = word(`v${n}l3`, 4).start;
  fromTo("#mama", "{rotation:-4}", `rotation:4, duration:${r(B / 4)}, yoyo:true, repeat:15, ease:"sine.inOut"`, tRing);
  fromTo("#ring", "{opacity:0, scale:.6}", `opacity:1, scale:1.15, duration:${r(B / 2)}, yoyo:true, repeat:7`, tRing);
  to("#mama", "scale:0, opacity:0, duration:.35, ease:'back.in(2)'", l4.start + 0.2);
  // the doctor's advice
  fromTo("#doc", "{scale:0, opacity:0}", "scale:1, opacity:1, duration:.5, ease:'back.out(1.8)'", l4.start - 0.25);
  fromTo("#doc", "{rotation:-3}", `rotation:3, duration:${r(B / 2)}, yoyo:true, repeat:7, ease:"sine.inOut"`, l4.start + 0.3);
  to("#doc", "scale:0, opacity:0, duration:.35, ease:'back.in(2)'", l4.end + 0.1);
  // remaining monkeys listen (stop and sway gently)
  const rest = alive.filter((i) => i !== f);
  rest.forEach((i, j) => fromTo(`#mk${i}`, "{rotation:0}", `rotation:${j % 2 ? -5 : 5}, duration:${r(B)}, yoyo:true, repeat:3, ease:"sine.inOut"`, l3.start));
  // break: counter flips, survivors recentre
  const brk = ev[`break${n}`];
  to(`#cnt${n}`, "opacity:0, scale:.3, duration:.25", brk + 0.05);
  fromTo(`#cnt${n - 1}`, "{opacity:0, scale:1.7}", "opacity:1, scale:1, duration:.45, ease:'back.out(2.2)'", brk + 0.25);
  to("#eq", "opacity:0, duration:.3", brk + S.bar - 0.4);
  rest.forEach((i, j) => to(`#mk${i}`, `x:${cx(rest.length, j) - 960}, rotation:0, duration:${r(B * 1.5)}, ease:"power2.inOut"`, brk + 0.1));
  alive = rest;
}

// ending: everyone ends up asleep in bed (ChatGPT good-night illustration)
const e1 = L.end1, e2 = L.end2, e3 = L.end3;
to(".monkey", "opacity:0, duration:.6", e1.start + 0.3);
to("#counter", "opacity:0, duration:.4", e2.start - 0.3);
fromTo("#goodnight", "{opacity:0, scale:1.08}", `opacity:1, scale:1, duration:1.4, ease:"power2.out"`, e2.start - 0.5);
fromTo("#goodnight", "{scale:1}", `scale:1.06, duration:${r(TOTAL - e2.start - 1)}, ease:"sine.inOut"`, e2.start + 0.9);
for (let i = 0; i < 3; i++) {
  const s0 = e2.start + 1 + i * 0.6;
  const reps = Math.max(0, Math.floor((TOTAL - 0.3 - s0) / 1.8) - 1);
  fromTo(`#z${i}`, "{y:0, opacity:0, scale:.6}", `y:-70, opacity:1, scale:1.1, duration:1.8, repeat:${reps}, ease:"sine.out"`, s0);
}
fromTo("#fade", "{opacity:0}", "opacity:1, duration:1.2", TOTAL - 1.3);

// ---------------- html ----------------
const lyricsHtml = S.lines.map((l) => {
  const words = l.words.map((w, i) => `<span class="w" id="ly_${l.tag}_w${i}">${w.text}</span>`).join(" ");
  const m = l.tag.match(/^v(\d)l(\d)$/);
  const zh = m ? ZH[`l${m[2]}`](Number(m[1])) : ZH[l.tag];
  return `<div class="lyric" id="ly_${l.tag}"><div class="en">${words}</div><div class="zh">${zh}</div></div>`;
}).join("\n");
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
#world { position:absolute; inset:0; transform-origin:50% 60%; }
#room { position:absolute; inset:0; width:1920px; height:1080px; }
.monkey { position:absolute; width:${MW}px; height:${MH}px; transform-origin:50% 100%; }
.monkey img { position:absolute; bottom:0; left:50%; transform:translateX(-50%); height:300px; filter: drop-shadow(0 8px 6px #3a1f0c40); }
.monkey .p-fall { height:310px; opacity:0; }
.monkey .p-hurt { height:250px; opacity:0; }
#bump { position:absolute; left:${960 - 90}px; top:${FEET - 120}px; width:180px; height:120px; display:flex; align-items:center; justify-content:center;
  font-weight:900; font-size:40px; color:#fff; background:#ff6b5a; opacity:0;
  clip-path: polygon(50% 0,61% 28%,95% 14%,73% 44%,100% 60%,68% 66%,78% 100%,50% 78%,22% 100%,32% 66%,0 60%,27% 44%,5% 14%,39% 28%); }
#goodnight { position:absolute; inset:0; width:1920px; height:1080px; opacity:0; }
.zzz { position:absolute; font-weight:900; font-size:66px; color:#fff; opacity:0; text-shadow:0 4px 0 #6b5bd6, 0 0 20px #0006; }
#fade { position:absolute; inset:0; background:#000; opacity:0; }
#title { position:absolute; left:460px; top:70px; width:1000px; padding:26px 0 30px; text-align:center; border-radius:60px; background:#fff6e4f2; box-shadow:0 12px 30px #0004; }
#title .t1 { font-weight:900; font-size:96px; color:#a0522d; line-height:1; }
#title .t2 { font-size:40px; color:#c46a3a; margin-top:10px; font-family:"WenQuanYi Zen Hei", sans-serif; }
#counter { position:absolute; left:60px; top:50px; width:180px; height:190px; border-radius:30px; background:#fff6e4f2; box-shadow: 0 10px 0 #c98a52, 0 16px 30px #0004; opacity:0; }
.cnt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; }
.cn { font-weight:900; font-size:116px; line-height:1; color:#e2553f; }
.cw { font-weight:900; font-size:32px; color:#8a4b1f; }
#eq { position:absolute; left:262px; top:96px; width:340px; height:96px; border-radius:48px; background:#fff6e4f2; box-shadow:0 8px 0 #c98a5288; opacity:0; }
.eqr { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:14px; font-weight:900; font-size:66px; color:#8a4b1f; opacity:0; }
.eqr .op { color:#4a8fd8; } .eqc { color:#e2553f; display:inline-block; }
.bubble { position:absolute; width:380px; height:380px; border-radius:50%; overflow:hidden; background:#fff6e4; box-shadow: 0 0 0 12px #fff6e4, 0 20px 40px #0005; opacity:0; }
.bubble img { width:100%; height:100%; object-fit:cover; }
#mama { left:90px; top:300px; } #mama img { object-position:50% 10%; }
#doc { left:1460px; top:90px; } #doc img { object-position:50% 20%; }
#ring { position:absolute; left:450px; top:290px; width:130px; height:130px; opacity:0; }
.lyric { position:absolute; left:160px; right:160px; top:935px; height:130px; border-radius:40px; background:#2b1a10c4; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; }
.lyric .en { font-weight:900; font-size:58px; color:#fff; line-height:1.1; }
.lyric .w { display:inline-block; }
.lyric .zh { font-size:28px; color:#ffe7c2cc; margin-top:4px; font-family:"WenQuanYi Zen Hei", sans-serif; }
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${TOTAL}">
 <section id="stage" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="1">
  <div id="world">
   <img id="room" src="art/bedroom.jpg"/>
   ${monkeysHtml}
   <div id="bump">BUMP!</div>
  </div>
  <img id="goodnight" src="art/goodnight.jpg"/>
  <div class="zzz" id="z0" style="left:640px;top:420px">Z<small>z</small></div>
  <div class="zzz" id="z1" style="left:960px;top:400px">Z<small>z</small></div>
  <div class="zzz" id="z2" style="left:1260px;top:430px">Z<small>z</small></div>
  <div id="title"><div class="t1">Five Little Monkeys</div><div class="t2">五只小猴子 · 唱儿歌学数数</div></div>
  <div id="counter">${cnts}</div>
  <div id="eq">${eqs}</div>
  <div class="bubble" id="mama"><img src="art/mama.png"/></div>
  <svg id="ring" viewBox="0 0 120 120"><path d="M20 40 Q40 15 64 24" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M28 72 Q62 58 86 32" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M48 104 Q84 92 104 62" stroke="#e2553f" stroke-width="8" fill="none" stroke-linecap="round"/></svg>
  <div class="bubble" id="doc"><img src="art/doctor.png"/></div>
  ${lyricsHtml}
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
