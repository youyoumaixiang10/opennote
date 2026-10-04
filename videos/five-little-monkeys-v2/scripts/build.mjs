// Five Little Monkeys v2 — picture-book scene driven by song.json timings.
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

// ---------------- art ----------------
const PJ = [
  ["#ff8a80", "#ff5f56"], ["#ffd166", "#f4a923"], ["#7bdcb5", "#3fbf8f"], ["#82c7ff", "#4a9df0"], ["#c9a7ff", "#9b6cf0"],
];
const defs = `<svg width="0" height="0" style="position:absolute"><defs>
  <radialGradient id="fur" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#b9783f"/><stop offset=".7" stop-color="#93582b"/><stop offset="1" stop-color="#6e3f1c"/></radialGradient>
  <radialGradient id="face" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffe6c7"/><stop offset="1" stop-color="#f3c492"/></radialGradient>
  <radialGradient id="eye" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#4a2c1a"/><stop offset="1" stop-color="#1c0f08"/></radialGradient>
  ${PJ.map(([a, b], i) => `<linearGradient id="pj${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <pattern id="st${i}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><rect width="22" height="9" fill="#ffffff" opacity=".35"/></pattern>`).join("")}
  <linearGradient id="pjMama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9fc4"/><stop offset="1" stop-color="#f06a9f"/></linearGradient>
  <linearGradient id="pjDoc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7ef"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3a1f0c" flood-opacity=".25"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .55 0"/></filter>
</defs></svg>`;

function monkey({ id, pj, stripes, label = "", extra = "", front = "" }) {
  // viewBox 200x240, feet at y≈236
  return `<svg viewBox="0 0 200 240" width="180" height="216" filter="url(#soft)">
  <path d="M138 196 C190 204 196 140 166 128 C146 120 138 146 156 150" stroke="#7a4520" stroke-width="12" fill="none" stroke-linecap="round"/>
  <ellipse cx="74" cy="226" rx="22" ry="13" fill="url(#fur)"/><ellipse cx="126" cy="226" rx="22" ry="13" fill="url(#fur)"/>
  <ellipse cx="74" cy="228" rx="13" ry="6" fill="#f3c492"/><ellipse cx="126" cy="228" rx="13" ry="6" fill="#f3c492"/>
  <g class="arms">
    <path d="M62 162 Q34 140 30 108" stroke="url(#fur)" stroke-width="17" fill="none" stroke-linecap="round"/>
    <path d="M138 162 Q166 140 170 108" stroke="url(#fur)" stroke-width="17" fill="none" stroke-linecap="round"/>
    <circle cx="30" cy="102" r="12" fill="url(#face)"/><circle cx="170" cy="102" r="12" fill="url(#face)"/>
  </g>
  <path d="M100 128 C150 128 158 176 150 204 C144 222 56 222 50 204 C42 176 50 128 100 128 Z" fill="url(#${pj})"/>
  ${stripes ? `<path d="M100 128 C150 128 158 176 150 204 C144 222 56 222 50 204 C42 176 50 128 100 128 Z" fill="url(#${stripes})"/>` : ""}
  <path d="M84 132 L100 146 L116 132" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" opacity=".9"/>
  ${label ? `<text x="100" y="196" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="34" fill="#fff" opacity=".95">${label}</text>` : ""}
  ${front}
  <circle cx="36" cy="82" r="25" fill="url(#fur)"/><circle cx="36" cy="82" r="15" fill="#f7b9a0"/>
  <circle cx="164" cy="82" r="25" fill="url(#fur)"/><circle cx="164" cy="82" r="15" fill="#f7b9a0"/>
  <circle cx="100" cy="78" r="62" fill="url(#fur)"/>
  <path d="M92 18 Q100 -4 112 16 Q106 8 100 12" fill="#93582b"/>
  <path d="M100 52 C84 30 50 40 54 74 C56 96 70 112 100 116 C130 112 144 96 146 74 C150 40 116 30 100 52 Z" fill="url(#face)"/>
  <ellipse cx="100" cy="100" rx="34" ry="21" fill="#ffecd6"/>
  <g class="eyes-open"><ellipse cx="82" cy="72" rx="10" ry="12" fill="url(#eye)"/><ellipse cx="118" cy="72" rx="10" ry="12" fill="url(#eye)"/>
    <circle cx="85" cy="67" r="4" fill="#fff"/><circle cx="121" cy="67" r="4" fill="#fff"/><circle cx="79" cy="77" r="1.8" fill="#fff"/><circle cx="115" cy="77" r="1.8" fill="#fff"/></g>
  <g class="eyes-hurt" opacity="0"><path d="M74 64 L90 72 L74 80" stroke="#1c0f08" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M126 64 L110 72 L126 80" stroke="#1c0f08" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M70 86 Q66 98 72 102 Q78 98 74 86 Z" fill="#7fd3ff"/></g>
  <ellipse cx="94" cy="92" rx="3" ry="2.4" fill="#4a2c1a"/><ellipse cx="106" cy="92" rx="3" ry="2.4" fill="#4a2c1a"/>
  <g class="mouth-happy"><path d="M84 102 Q100 122 116 102 Z" fill="#c2453d"/><path d="M92 112 Q100 120 108 112 Q100 108 92 112 Z" fill="#ff8a80"/></g>
  <g class="mouth-oh" opacity="0"><ellipse cx="100" cy="108" rx="7" ry="8" fill="#c2453d"/></g>
  <circle cx="66" cy="94" r="8" fill="#ff8f8f" opacity=".45"/><circle cx="134" cy="94" r="8" fill="#ff8f8f" opacity=".45"/>
  ${extra}
</svg>`;
}
const bandage = `<g class="bandage" opacity="0" transform="translate(126 26) rotate(30)"><rect x="-26" y="-9" width="52" height="18" rx="8" fill="#ffd9a8" stroke="#d6a36a" stroke-width="2"/><rect x="-26" y="-9" width="52" height="18" rx="8" fill="#ffd9a8" stroke="#d6a36a" stroke-width="2" transform="rotate(90)"/><circle r="5" fill="#e9b47c"/></g>`;

function sleeper(i) {
  return `<svg viewBox="0 0 200 150" width="180" height="135">
  <circle cx="36" cy="82" r="25" fill="url(#fur)"/><circle cx="36" cy="82" r="15" fill="#f7b9a0"/>
  <circle cx="164" cy="82" r="25" fill="url(#fur)"/><circle cx="164" cy="82" r="15" fill="#f7b9a0"/>
  <circle cx="100" cy="78" r="62" fill="url(#fur)"/>
  <path d="M100 52 C84 30 50 40 54 74 C56 96 70 112 100 116 C130 112 144 96 146 74 C150 40 116 30 100 52 Z" fill="url(#face)"/>
  <ellipse cx="100" cy="100" rx="34" ry="21" fill="#ffecd6"/>
  <path d="M72 74 Q82 82 92 74" stroke="#1c0f08" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M108 74 Q118 82 128 74" stroke="#1c0f08" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="94" cy="92" rx="3" ry="2.4" fill="#4a2c1a"/><ellipse cx="106" cy="92" rx="3" ry="2.4" fill="#4a2c1a"/>
  <path d="M92 106 Q100 112 108 106" stroke="#7a3a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="66" cy="94" r="8" fill="#ff8f8f" opacity=".45"/><circle cx="134" cy="94" r="8" fill="#ff8f8f" opacity=".45"/>
  <path d="M60 30 Q100 -6 140 30 L136 40 Q100 14 64 40 Z" fill="${PJ[i][1]}"/><circle cx="142" cy="20" r="10" fill="#fff"/>
</svg>`;
}

// ---------------- layout ----------------
const MW = 180, MH = 216;
const FEET = 652;                      // mattress surface
const cx = (count, i) => 960 + (i - (count - 1) / 2) * 158;
const BASE_L = 960 - MW / 2;
const pileCx = (k) => 1430 + k * 92;   // k = 0..4 (fallen order)
const PILE_FEET = 905, PILE_S = 0.62;

const monkeysHtml = [0, 1, 2, 3, 4].map((i) =>
  `<div class="monkey" id="mk${i}" style="left:${BASE_L}px;top:${FEET - MH + 4}px">${monkey({ id: i, pj: `pj${i}`, stripes: `st${i}`, label: i + 1, extra: bandage })}</div>`
).join("");
const sleepersHtml = [0, 1, 2, 3, 4].map((i) =>
  `<div class="sleeper" id="sl${i}" style="left:${cx(5, i) - 90}px;top:${478}px">${sleeper(i)}</div>`
).join("");

const phone = `<g transform="translate(150 70) rotate(-25)"><rect x="-12" y="-34" width="24" height="68" rx="10" fill="#ff5f56"/><rect x="-18" y="-40" width="36" height="20" rx="9" fill="#ff5f56"/><rect x="-18" y="20" width="36" height="20" rx="9" fill="#ff5f56"/></g>`;
const bow = `<path d="M70 22 L100 34 L130 22 L130 50 L100 40 L70 50 Z" fill="#ff5fa2"/><circle cx="100" cy="37" r="8" fill="#ff86bc"/>`;
const apron = `<path d="M74 150 Q100 158 126 150 L130 206 Q100 214 70 206 Z" fill="#fff" opacity=".9"/><circle cx="100" cy="176" r="10" fill="#ffb3cf"/>`;
const mamaSvg = monkey({ pj: "pjMama", stripes: null, extra: bow + phone, front: apron }).replace('<g class="arms">', '<g class="arms" id="mama-arms">');
const docExtra = `<circle cx="100" cy="26" r="15" fill="#dfe7ef" stroke="#9fb0c0" stroke-width="4"/><circle cx="100" cy="26" r="6" fill="#fff"/>
  <circle cx="82" cy="72" r="15" fill="none" stroke="#3b3b3b" stroke-width="4"/><circle cx="118" cy="72" r="15" fill="none" stroke="#3b3b3b" stroke-width="4"/><path d="M97 72 L103 72" stroke="#3b3b3b" stroke-width="4"/>`;
const docFront = `<path d="M70 140 Q100 196 130 140" stroke="#5c6b7a" stroke-width="5" fill="none"/><circle cx="100" cy="182" r="9" fill="#9fb0c0"/>
  <rect x="112" y="150" width="22" height="22" rx="4" fill="#ff5f56"/><rect x="119" y="153" width="8" height="16" fill="#fff"/><rect x="115" y="157" width="16" height="8" fill="#fff"/>`;
const docSvg = monkey({ pj: "pjDoc", stripes: null, extra: docExtra, front: docFront });

const stars = [[180, 120], [420, 70], [1500, 90], [1760, 180], [640, 160], [1300, 60], [90, 380], [1850, 420]]
  .map(([x, y], i) => `<div class="tw" id="tw${i}" style="left:${x}px;top:${y}px">✦</div>`).join("");

// ---------------- timeline ----------------
const T = [];
const add = (s) => T.push(s);
const seen = new Set();
// fromTo helper that keeps later fromTos from rendering early
function fromTo(sel, from, to, t) {
  const ir = seen.has(sel) ? ", immediateRender:false" : "";
  seen.add(sel);
  add(`tl.fromTo("${sel}", ${from}, {${to}${ir}}, ${r(t)});`);
}
const to = (sel, vars, t) => add(`tl.to("${sel}", {${vars}}, ${r(t)});`);
const set = (sel, vars, t) => add(`tl.set("${sel}", {${vars}}, ${r(t)});`);

// intro: title + monkeys hop in on the beat
fromTo("#title", "{y:-80, opacity:0, scale:.7}", "y:0, opacity:1, scale:1, duration:.8, ease:'back.out(1.7)'", 0.3);
fromTo("#title-zh", "{opacity:0, y:20}", "opacity:1, y:0, duration:.5", 1.0);
to("#title-wrap", "opacity:0, y:-60, duration:.6, ease:'power2.in'", ev.verse5 - 0.9);
for (let i = 0; i < 5; i++) {
  const t = 2 * S.bar + i * B;
  fromTo(`#mk${i}`, `{x:${cx(5, i) - 960}, y:-900, opacity:1}`, `x:${cx(5, i) - 960}, y:0, duration:${r(B * 0.9)}, ease:'bounce.out'`, t - B * 0.9);
}

// karaoke lines
for (const l of S.lines) {
  const id = `ly_${l.tag}`;
  fromTo(`#${id}`, "{opacity:0, y:24}", "opacity:1, y:0, duration:.25", l.start - 0.35);
  to(`#${id}`, "opacity:0, duration:.2", l.end - 0.05);
  l.words.forEach((w, i) => {
    add(`tl.to("#${id}_w${i}", {color:"#ffc93c", scale:1.08, duration:.12}, ${r(w.start)});`);
    add(`tl.to("#${id}_w${i}", {scale:1, duration:.2}, ${r(w.start + 0.14)});`);
  });
}

// counter block
fromTo("#counter", "{opacity:0, scale:.5, rotation:-12}", "opacity:1, scale:1, rotation:0, duration:.6, ease:'back.out(2)'", ev.verse5 - 0.6);
set("#cnt5", "opacity:1", ev.verse5 - 0.6);

function bounce(ids, from, until) {
  const n = Math.floor((until - from) / B);
  if (n < 1) return;
  ids.forEach((id, j) => {
    const h = j % 2 ? 95 : 125;
    add(`tl.to("#${id}", {y:-${h}, duration:${r(B / 2)}, ease:"power2.out", yoyo:true, repeat:${2 * n - 1}}, ${r(from)});`);
  });
}

const fallOrder = [4, 3, 2, 1, 0];
for (let n = 5; n >= 1; n--) {
  const k = 5 - n, f = fallOrder[k];
  const alive = Array.from({ length: n }, (_, i) => `mk${i}`);
  const l1 = L[`v${n}l1`], l2 = L[`v${n}l2`], l3 = L[`v${n}l3`], l4 = L[`v${n}l4`];
  const tFell = word(`v${n}l2`, 1).start, tOff = word(`v${n}l2`, 2).start, tBump = word(`v${n}l2`, 5).start, tMy = word(`v${n}l2`, 7).start;
  // bounce on the beat from line 1 until "One"
  bounce(alive, l1.start, l2.start);
  // the slip and the fall
  const x0 = cx(n, f) - 960, xEdge = x0 + 70, x1 = pileCx(k) - 960;
  to(`#mk${f}`, `x:${xEdge}, rotation:18, duration:.25, ease:"power2.out"`, tFell);
  to(`#mk${f} .eyes-open`, "opacity:0, duration:.05", tOff);
  to(`#mk${f} .eyes-hurt`, "opacity:1, duration:.05", tOff);
  to(`#mk${f} .mouth-happy`, "opacity:0, duration:.05", tOff);
  to(`#mk${f} .mouth-oh`, "opacity:1, duration:.05", tOff);
  const up = (tBump - tOff) * 0.5;
  to(`#mk${f}`, `x:${r((xEdge + x1) / 2)}, y:-170, rotation:200, duration:${r(up)}, ease:"power2.out"`, tOff);
  to(`#mk${f}`, `x:${x1}, y:${PILE_FEET - FEET}, rotation:360, scale:${PILE_S}, duration:${r(tBump - tOff - up)}, ease:"power2.in"`, tOff + up);
  set(`#mk${f}`, "rotation:0", tBump);
  fromTo("#bump", `{x:${x1}, y:${PILE_FEET - FEET - 120}, opacity:0, scale:.2, rotation:-20}`, "opacity:1, scale:1, rotation:0, duration:.25, ease:'back.out(3)'", tBump);
  to("#bump", "opacity:0, scale:1.3, duration:.3", tBump + 1.0);
  fromTo(`#mk${f}`, `{scaleY:${PILE_S * 0.75}}`, `scaleY:${PILE_S}, duration:.4, ease:"elastic.out(1,.4)"`, tBump);
  to(`#mk${f} .bandage`, "opacity:1, duration:.2", tMy);
  // others look shocked
  alive.filter((id) => id !== `mk${f}`).forEach((id) => {
    to(`#${id} .mouth-happy`, "opacity:0, duration:.05", tOff);
    to(`#${id} .mouth-oh`, "opacity:1, duration:.05", tOff);
    to(`#${id} .mouth-happy`, "opacity:1, duration:.05", l4.end);
    to(`#${id} .mouth-oh`, "opacity:0, duration:.05", l4.end);
  });
  // math moment: equation beside the counter
  fromTo("#eq", "{opacity:0, x:-30}", "opacity:1, x:0, duration:.35, ease:'back.out(2)'", tBump);
  set(`#eqr${n}`, "opacity:1", tBump);
  fromTo(`#eqc${n}`, "{scale:2, opacity:0}", "scale:1, opacity:1, duration:.35, ease:'back.out(3)'", tMy);
  set(`#eqr${n}`, "opacity:0", ev[`break${n}`] + S.bar - 0.05);
  // mama calls the doctor — camera pans to the doorway
  to("#world", "x:170, y:-20, scale:1.18, duration:.9, ease:'power2.inOut'", l3.start - 0.5);
  fromTo("#mama", "{y:240, opacity:0}", "y:0, opacity:1, duration:.5, ease:'back.out(1.6)'", l3.start - 0.2);
  const tRing = word(`v${n}l3`, 4).start;
  fromTo("#mama", "{rotation:-5}", `rotation:5, duration:${r(B / 4)}, yoyo:true, repeat:${Math.floor((B * 4) / (B / 4)) - 1}, ease:"sine.inOut"`, tRing);
  fromTo("#ringlines", "{opacity:0, scale:.6}", `opacity:1, scale:1.15, duration:${r(B / 2)}, yoyo:true, repeat:7`, tRing);
  to("#mama", "y:240, opacity:0, duration:.4, ease:'power2.in'", l4.start + 0.4);
  to("#world", "x:0, y:0, scale:1, duration:.8, ease:'power2.inOut'", l4.start - 0.2);
  // the doctor's advice
  fromTo("#doc", "{scale:0, opacity:0}", "scale:1, opacity:1, duration:.45, ease:'back.out(2)'", l4.start - 0.2);
  fromTo("#finger", "{rotation:-20}", `rotation:20, duration:${r(B / 2)}, yoyo:true, repeat:5, ease:"sine.inOut"`, l4.start);
  fromTo("#bedtime", "{opacity:0, y:20}", "opacity:1, y:0, duration:.3", word(`v${n}l4`, 4).start);
  to("#doc", "scale:0, opacity:0, duration:.35, ease:'back.in(2)'", l4.end + 0.1);
  to("#bedtime", "opacity:0, duration:.25", l4.end + 0.1);
  // break bar: counter flips to the new count, others recentre
  const brk = ev[`break${n}`];
  to(`#cnt${n}`, "opacity:0, scale:.3, duration:.25", brk + 0.05);
  fromTo(`#cnt${n - 1}`, "{opacity:0, scale:1.7}", "opacity:1, scale:1, duration:.45, ease:'back.out(2.2)'", brk + 0.25);
  to("#eq", "opacity:0, duration:.3", brk + S.bar - 0.4);
  for (let i = 0; i < n - 1; i++) to(`#mk${i}`, `x:${cx(n - 1, i) - 960}, duration:${r(B * 1.5)}, ease:"power2.inOut"`, brk + 0.1);
}

// ending: lights down, everyone tucked in
const e1 = L.end1, e2 = L.end2, e3 = L.end3;
to(".monkey", "opacity:0, duration:.6", e1.start + 0.2);
to("#cnt0", "opacity:0, duration:.4", e2.start - 0.2);
to("#counter", "opacity:0, duration:.4", e2.start - 0.2);
to("#night", "opacity:.42, duration:1.6", e2.start - 0.6);
to("#lampglow", "opacity:.35, duration:1.6", e2.start - 0.6);
fromTo(".sleeper", "{y:90, opacity:0}", `y:0, opacity:1, duration:.5, stagger:${r(B)}, ease:"back.out(1.6)"`, e2.start);
fromTo("#blanket", "{y:130, opacity:0}", "y:0, opacity:1, duration:.6, ease:'power2.out'", e2.start);
fromTo("#moon", "{scale:1}", "scale:1.25, duration:1.2, ease:'sine.out'", e3.start);
fromTo("#moonglow", "{opacity:0}", "opacity:1, duration:1.2", e3.start);
for (let i = 0; i < 3; i++) {
  const s0 = e2.start + 1 + i * 0.6;
  const reps = Math.max(0, Math.floor((TOTAL - 0.3 - s0) / 1.8) - 1);
  fromTo(`#z${i}`, "{y:0, opacity:0, scale:.6}", `y:-70, opacity:1, scale:1.1, duration:1.8, repeat:${reps}, ease:"sine.out"`, s0);
}
// gentle twinkle all through
add(`tl.fromTo(".tw", {opacity:.35}, {opacity:1, duration:${r(B * 2)}, stagger:${r(B / 2)}, yoyo:true, repeat:${Math.floor(TOTAL / (B * 2)) - 4}, ease:"sine.inOut"}, 0);`);

// ---------------- html ----------------
const lyricsHtml = S.lines.map((l) => {
  const words = l.words.map((w, i) => `<span class="w" id="ly_${l.tag}_w${i}">${w.text}</span>`).join(" ");
  const m = l.tag.match(/^v(\d)l(\d)$/);
  const zh = m ? ZH[`l${m[2]}`](Number(m[1])) : ZH[l.tag];
  return `<div class="lyric" id="ly_${l.tag}"><div class="en">${words}</div><div class="zh">${zh}</div></div>`;
}).join("\n");
const cnts = [0, 1, 2, 3, 4, 5].map((n) => `<div class="cnt" id="cnt${n}"><div class="cn">${n}</div><div class="cw">${NUM[n]}</div></div>`).join("");

const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<title>Five Little Monkeys</title>
<script src="vendor/gsap.min.js"></script>
<style>
@font-face { font-family:"WenQuanYi Zen Hei"; src: local("WenQuanYi Zen Hei"); }
body { margin:0; background:#000; font-family:Nunito, "WenQuanYi Zen Hei", sans-serif; }
#root { position:relative; width:1920px; height:1080px; overflow:hidden; }
#stage { position:absolute; inset:0; }
#world { position:absolute; inset:0; transform-origin:50% 55%; }
.abs { position:absolute; }
#wall { position:absolute; inset:0; background: radial-gradient(ellipse at 50% 35%, #ffe9c9 0%, #f9d6a5 55%, #e9b97f 100%); }
#wallpaper { position:absolute; left:0; right:0; top:0; height:790px; opacity:.22;
  background-image: radial-gradient(circle at 12px 12px, #e48a5a 3px, transparent 4px), radial-gradient(circle at 42px 42px, #7bbf8f 3px, transparent 4px);
  background-size:60px 60px; }
#wainscot { position:absolute; left:0; right:0; top:690px; height:110px; background:#e7a96f; box-shadow: inset 0 8px 0 #f3c08a, inset 0 -6px 0 #c98a52; }
#floor { position:absolute; left:0; right:0; top:790px; bottom:0; background: repeating-linear-gradient(90deg, #b9774a 0 190px, #a8693f 190px 194px); }
#floor::after { content:""; position:absolute; inset:0; background: linear-gradient(#5a2e1066, #0000 45%); }
#rug { position:absolute; left:500px; top:850px; width:920px; height:120px; border-radius:50%; background: radial-gradient(ellipse, #7bdcb5 0 40%, #fff6e0 40% 46%, #3fbf8f 46% 70%, #fff6e0 70% 75%, #2e9d74 75%); opacity:.95; }
#window { position:absolute; left:790px; top:90px; width:340px; height:300px; border-radius:170px 170px 24px 24px; background: linear-gradient(#21306b, #3b5aa6); border:16px solid #fff3df; box-sizing:border-box; overflow:hidden; box-shadow: 0 10px 0 #0001; }
#window::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:12px; margin-left:-6px; background:#fff3df; }
#window::after { content:""; position:absolute; left:0; right:0; top:150px; height:12px; background:#fff3df; }
#moonglow { position:absolute; left:150px; top:20px; width:180px; height:180px; border-radius:50%; background: radial-gradient(#fff6c288, #fff6c200 70%); opacity:0; }
#moon { position:absolute; left:200px; top:46px; width:70px; height:70px; border-radius:50%; background:#fff3b0; box-shadow:0 0 30px 8px #fff3b066; }
.curtain { position:absolute; top:70px; width:120px; height:360px; background: repeating-linear-gradient(90deg, #ff8a80 0 24px, #ff7468 24px 30px); border-radius:0 0 50px 50px; }
#door { position:absolute; left:120px; top:250px; width:300px; height:540px; border-radius:150px 150px 0 0; background: linear-gradient(#ffe7a8, #ffc96b); box-shadow: inset 0 0 0 18px #c98a52; }
#doorleaf { position:absolute; left:370px; top:262px; width:70px; height:528px; background:#d99a5f; transform:skewY(-12deg); border-radius:0 8px 8px 0; }
#mama { position:absolute; left:180px; top:${790 - 216 * 1.05}px; width:180px; height:216px; transform-origin:50% 100%; opacity:0; }
#ringlines { position:absolute; left:330px; top:440px; width:120px; height:120px; opacity:0; }
#headboard { position:absolute; left:560px; top:420px; width:800px; height:260px; border-radius:90px 90px 0 0; background: linear-gradient(#8fd9b9, #5cbf98); box-shadow: inset 0 -16px 0 #48a883, inset 0 10px 0 #b3ead2; }
#headboard::before { content:""; position:absolute; left:60px; right:60px; top:40px; height:130px; border-radius:60px; background:#7acda9; }
#pillow { position:absolute; left:610px; top:590px; width:240px; height:80px; border-radius:40px; background:#fff; box-shadow: inset 0 -10px 0 #e9eef3; }
#mattress { position:absolute; left:540px; top:646px; width:840px; height:40px; border-radius:18px; background:#fff; }
#quilt { position:absolute; left:540px; top:668px; width:840px; height:130px; border-radius:20px 20px 34px 34px;
  background-color:#ffd166; background-image: linear-gradient(45deg, #ff8a80 25%, transparent 25%, transparent 75%, #ff8a80 75%), linear-gradient(45deg, #ff8a80 25%, transparent 25%, transparent 75%, #ff8a80 75%);
  background-size:80px 80px; background-position:0 0, 40px 40px; box-shadow: inset 0 -16px 0 #0001, inset 0 12px 0 #fff8; }
.leg { position:absolute; top:790px; width:40px; height:50px; background:#48a883; border-radius:0 0 10px 10px; }
#blanket { position:absolute; left:540px; top:600px; width:840px; height:200px; border-radius:60px 60px 34px 34px; background-color:#9b8cf0;
  background-image: radial-gradient(#fff3b0 9px, transparent 10px); background-size:70px 70px; box-shadow: inset 0 22px 0 #fff, inset 0 -16px 0 #0002; opacity:0; }
#nightstand { position:absolute; left:1430px; top:640px; width:160px; height:170px; border-radius:16px; background:#e9a96a; box-shadow: inset 0 -12px 0 #c98a52; }
#lamp { position:absolute; left:1460px; top:500px; width:100px; height:140px; }
#lampglow { position:absolute; left:1330px; top:400px; width:360px; height:360px; border-radius:50%; background: radial-gradient(#fff2b066, #fff2b000 70%); }
#books { position:absolute; left:1450px; top:610px; width:120px; height:30px; }
.monkey { position:absolute; width:180px; height:216px; transform-origin:50% 100%; }
.sleeper { position:absolute; width:180px; height:135px; opacity:0; }
.monkey svg, .sleeper svg, #mama svg { display:block; overflow:visible; }
#bump { position:absolute; left:${960 - 90}px; top:${FEET - 60}px; width:180px; height:120px; display:flex; align-items:center; justify-content:center;
  font-weight:900; font-size:40px; color:#fff; background:#ff5f56; opacity:0;
  clip-path: polygon(50% 0,61% 28%,95% 14%,73% 44%,100% 60%,68% 66%,78% 100%,50% 78%,22% 100%,32% 66%,0 60%,27% 44%,5% 14%,39% 28%); }
#night { position:absolute; inset:0; background:#141a4a; opacity:0; }
.tw { position:absolute; color:#fff6c2; font-size:34px; opacity:.35; text-shadow:0 0 12px #fff6c2; }
.zzz { position:absolute; font-weight:900; font-size:64px; color:#fff; opacity:0; text-shadow:0 4px 0 #7b6cf0; }
#grain { position:absolute; inset:0; opacity:.5; mix-blend-mode:multiply; pointer-events:none; }

/* overlays (screen space) */
#title-wrap { position:absolute; left:360px; top:120px; width:1200px; height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
#title { font-weight:900; font-size:110px; color:#fff; letter-spacing:2px; -webkit-text-stroke: 8px #8a4b1f; paint-order: stroke fill; text-shadow: 0 10px 0 #8a4b1f55; }
#title-zh { margin-top:8px; font-size:46px; font-weight:900; color:#8a4b1f; background:#fff8eaee; padding:8px 34px; border-radius:40px; font-family:"WenQuanYi Zen Hei", sans-serif; }
#counter { position:absolute; left:70px; top:60px; width:190px; height:200px; border-radius:30px; background: linear-gradient(#fff8ea, #ffe7c2); box-shadow: 0 10px 0 #c98a52, 0 16px 30px #0003; opacity:0; }
.cnt { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; }
.cn { font-weight:900; font-size:120px; line-height:1; color:#ff5f56; }
.cw { font-weight:900; font-size:34px; color:#8a4b1f; }
#eq { position:absolute; left:290px; top:110px; width:360px; height:100px; border-radius:50px; background:#fff8eaee; font-weight:900; font-size:72px; color:#8a4b1f; box-shadow:0 8px 0 #c98a5288; opacity:0; }
.eqr { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:16px; opacity:0; }
#eq .op { color:#4a9df0; } .eqc { color:#ff5f56; display:inline-block; }
#doc { position:absolute; left:1430px; top:50px; width:420px; height:420px; border-radius:50%; background: radial-gradient(#e8f4ff, #bfe0ff); box-shadow: 0 0 0 14px #fff, 0 20px 40px #0003; opacity:0; overflow:hidden; }
#doc-fig { position:absolute; left:80px; top:70px; width:260px; height:312px; }
#doc-fig svg { width:260px; height:312px; display:block; }
#finger { position:absolute; left:300px; top:150px; width:50px; height:80px; transform-origin:50% 100%; }
#bedtime { position:absolute; left:1460px; top:430px; width:360px; text-align:center; font-weight:900; font-size:30px; color:#fff; background:#4a9df0; border-radius:24px; padding:8px 0; opacity:0; }
#doc-wrap { position:absolute; inset:0; }
.lyric { position:absolute; left:160px; right:160px; top:935px; height:130px; border-radius:40px; background:#2b1a10cc; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; }
.lyric .en { font-weight:900; font-size:58px; color:#fff; line-height:1.1; }
.lyric .w { display:inline-block; }
.lyric .zh { font-size:28px; color:#ffe7c2cc; margin-top:4px; font-family:"WenQuanYi Zen Hei", sans-serif; }
</style></head>
<body>
${defs}
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${TOTAL}">
 <section id="stage" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="1">
  <div id="world">
   <div id="wall"></div><div id="wallpaper"></div><div id="wainscot"></div>
   <div id="window"><div id="moonglow"></div><div id="moon"></div></div>
   <div class="curtain" style="left:700px"></div><div class="curtain" style="left:1100px"></div>
   <div id="door"></div><div id="doorleaf"></div>
   <div id="mama">${mamaSvg}</div>
   <svg id="ringlines" viewBox="0 0 120 120"><path d="M20 30 Q40 10 60 20" stroke="#ff5f56" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M30 60 Q60 50 80 30" stroke="#ff5f56" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 90 Q80 80 100 56" stroke="#ff5f56" stroke-width="7" fill="none" stroke-linecap="round"/></svg>
   <div id="floor"></div><div id="rug"></div>
   <div id="lampglow"></div>
   <div id="nightstand"></div>
   <svg id="books" viewBox="0 0 120 30"><rect x="0" y="6" width="54" height="12" rx="3" fill="#4a9df0"/><rect x="6" y="18" width="60" height="12" rx="3" fill="#ff8a80"/><rect x="70" y="0" width="14" height="30" rx="3" fill="#7bdcb5"/></svg>
   <svg id="lamp" viewBox="0 0 100 140"><path d="M20 0 H80 L100 70 H0 Z" fill="#ffd166"/><path d="M20 0 H80 L84 14 H16 Z" fill="#fff3b0"/><rect x="44" y="70" width="12" height="54" fill="#fff3df"/><ellipse cx="50" cy="128" rx="30" ry="10" fill="#fff3df"/></svg>
   <div id="headboard"></div><div id="pillow"></div>
   ${sleepersHtml}
   <div id="mattress"></div><div id="quilt"></div><div id="blanket"></div>
   <div class="leg" style="left:560px"></div><div class="leg" style="left:1320px"></div>
   ${monkeysHtml}
   <div id="bump">BUMP!</div>
   <div class="zzz" id="z0" style="left:700px;top:440px">Z<small>z</small></div>
   <div class="zzz" id="z1" style="left:1000px;top:420px">Z<small>z</small></div>
   <div class="zzz" id="z2" style="left:1240px;top:450px">Z<small>z</small></div>
  </div>
  <div id="night"></div>
  ${stars}
  <svg id="grain" width="1920" height="1080"><rect width="1920" height="1080" filter="url(#grain)"/></svg>

  <div id="title-wrap"><div id="title">Five Little Monkeys</div><div id="title-zh">五只小猴子 · 唱儿歌学数数</div></div>
  <div id="counter">${cnts}</div>
  <div id="eq">${[5,4,3,2,1].map((n) => `<div class="eqr" id="eqr${n}"><span>${n}</span><span class="op">−</span><span>1</span><span class="op">=</span><span class="eqc" id="eqc${n}">${n - 1}</span></div>`).join("")}</div>
  <div id="doc"><div id="doc-fig">${docSvg}</div>
    <svg id="finger" viewBox="0 0 50 80"><rect x="16" y="0" width="18" height="50" rx="9" fill="#ffe6c7" stroke="#7a4520" stroke-width="3"/><rect x="4" y="40" width="42" height="38" rx="14" fill="#ffe6c7" stroke="#7a4520" stroke-width="3"/></svg></div>
  <div id="bedtime">Beds are for sleeping!</div>
  ${lyricsHtml}
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
