// Builds timeline.json (for the audio mix) and index.html (the composition)
// from the voice clip durations. Run from the project root: node scripts/build.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { buildLines, NUM, NUM_ZH, WORDS } from "./lines.mjs";

const r = (x) => Math.round(x * 1000) / 1000;
const dur = (f) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// ---------- timeline ----------
const lines = buildLines();
let t = 1.6;
for (const l of lines) {
  l.start = r(t);
  l.dur = r(dur(`assets/voice/${l.id}.wav`));
  l.end = r(l.start + l.dur);
  t = l.end + l.gap;
}
const TOTAL = Math.ceil(t + 0.5);
const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
const sfx = [];

// ---------- art ----------
const FUR = "#8a5428", FUR_D = "#6b3d1a", PEACH = "#f6cfa0", INK = "#2b1a10";
const SHIRTS = ["#ff6b6b", "#ffa94d", "#ffd43b", "#51cf66", "#4dabf7"];

function monkeySvg({ shirt, label, sleeping = false, extra = "", id = "" }) {
  const eyes = sleeping
    ? `<path d="M58 60 Q66 66 74 60" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M86 60 Q94 66 102 60" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<circle cx="67" cy="58" r="7" fill="${INK}"/><circle cx="93" cy="58" r="7" fill="${INK}"/><circle cx="69.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="95.5" cy="55.5" r="2.4" fill="#fff"/>`;
  const mouth = sleeping
    ? `<ellipse cx="80" cy="90" rx="5" ry="4" fill="${INK}"/>`
    : `<path d="M66 86 Q80 100 94 86" stroke="${INK}" stroke-width="4.5" fill="#e8736b" stroke-linecap="round"/>`;
  return `<svg ${id ? `id="${id}"` : ""} viewBox="0 0 160 210" width="150" height="197" xmlns="http://www.w3.org/2000/svg">
  <path d="M112 176 C152 178 158 124 132 116 C116 112 110 132 126 134" stroke="${FUR_D}" stroke-width="10" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="196" rx="17" ry="11" fill="${FUR}"/><ellipse cx="100" cy="196" rx="17" ry="11" fill="${FUR}"/>
  <path d="M50 132 Q26 112 22 86" stroke="${FUR}" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M110 132 Q134 112 138 86" stroke="${FUR}" stroke-width="14" fill="none" stroke-linecap="round"/>
  <circle cx="22" cy="82" r="10" fill="${PEACH}"/><circle cx="138" cy="82" r="10" fill="${PEACH}"/>
  <ellipse cx="80" cy="150" rx="39" ry="45" fill="${shirt}"/>
  <ellipse cx="80" cy="158" rx="22" ry="26" fill="#fff" opacity="0.28"/>
  <text x="80" y="170" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="36" fill="#fff">${label}</text>
  <circle cx="28" cy="62" r="21" fill="${FUR}"/><circle cx="28" cy="62" r="12" fill="${PEACH}"/>
  <circle cx="132" cy="62" r="21" fill="${FUR}"/><circle cx="132" cy="62" r="12" fill="${PEACH}"/>
  <circle cx="80" cy="60" r="50" fill="${FUR}"/>
  <path d="M72 14 Q78 -2 86 12 Q84 4 78 6" fill="${FUR}"/>
  <ellipse cx="67" cy="58" rx="19" ry="22" fill="${PEACH}"/><ellipse cx="93" cy="58" rx="19" ry="22" fill="${PEACH}"/>
  <ellipse cx="80" cy="82" rx="33" ry="22" fill="${PEACH}"/>
  ${eyes}
  <ellipse cx="76" cy="76" rx="2.2" ry="3" fill="${INK}"/><ellipse cx="84" cy="76" rx="2.2" ry="3" fill="${INK}"/>
  ${mouth}
  <circle cx="52" cy="80" r="7" fill="#ff8fa3" opacity="0.55"/><circle cx="108" cy="80" r="7" fill="#ff8fa3" opacity="0.55"/>
  ${extra}
</svg>`;
}
const bandage = (id) =>
  `<g id="${id}" class="bandage"><rect x="88" y="10" width="44" height="14" rx="6" fill="#ffd6a5" stroke="#d9a066" stroke-width="2" transform="rotate(35 110 17)"/><rect x="88" y="10" width="44" height="14" rx="6" fill="#ffd6a5" stroke="#d9a066" stroke-width="2" transform="rotate(-35 110 17)"/></g>`;

function faceIcon(size, cls = "", id = "") {
  return `<svg ${id ? `id="${id}"` : ""} class="${cls}" viewBox="0 0 120 100" width="${size}" height="${(size * 100) / 120}">
  <circle cx="18" cy="48" r="16" fill="${FUR}"/><circle cx="18" cy="48" r="9" fill="${PEACH}"/>
  <circle cx="102" cy="48" r="16" fill="${FUR}"/><circle cx="102" cy="48" r="9" fill="${PEACH}"/>
  <circle cx="60" cy="50" r="40" fill="${FUR}"/>
  <ellipse cx="50" cy="46" rx="15" ry="17" fill="${PEACH}"/><ellipse cx="70" cy="46" rx="15" ry="17" fill="${PEACH}"/>
  <ellipse cx="60" cy="66" rx="26" ry="17" fill="${PEACH}"/>
  <circle cx="50" cy="46" r="5.5" fill="${INK}"/><circle cx="70" cy="46" r="5.5" fill="${INK}"/>
  <path d="M49 69 Q60 79 71 69" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;
}

const ICONS = {
  monkey: faceIcon(130),
  bed: `<svg viewBox="0 0 140 100" width="150" height="107"><rect x="10" y="20" width="20" height="70" rx="6" fill="#a0673a"/><rect x="26" y="50" width="104" height="26" rx="8" fill="#4dabf7"/><rect x="34" y="38" width="30" height="16" rx="8" fill="#fff"/><rect x="118" y="56" width="12" height="34" rx="4" fill="#a0673a"/><rect x="26" y="72" width="8" height="18" fill="#a0673a"/></svg>`,
  jump: `<svg viewBox="0 0 140 110" width="150" height="118"><path d="M70 8 L92 34 H78 V58 H62 V34 H48 Z" fill="#ffd43b"/><circle cx="70" cy="76" r="18" fill="${FUR}"/><ellipse cx="70" cy="80" rx="11" ry="9" fill="${PEACH}"/><path d="M30 104 Q70 84 110 104" stroke="#4dabf7" stroke-width="8" fill="none" stroke-linecap="round"/></svg>`,
  head: `<svg viewBox="0 0 120 110" width="140" height="128"><circle cx="60" cy="58" r="50" fill="none" stroke="#ffd43b" stroke-width="6" stroke-dasharray="10 8"/>${faceIcon(100).replace("<svg ", '<svg x="10" y="16" ')}</svg>`,
  doctor: `<svg viewBox="0 0 120 110" width="140" height="128"><rect x="20" y="16" width="80" height="80" rx="20" fill="#fff"/><rect x="50" y="30" width="20" height="52" rx="4" fill="#fa5252"/><rect x="34" y="46" width="52" height="20" rx="4" fill="#fa5252"/></svg>`,
};

// ---------- layout ----------
const STAND_TOP = 458; // monkey top when standing on the mattress (feet at ~655)
const MW = 150;
const layoutX = (count, i) => 960 + (i - (count - 1) / 2) * 170 - MW / 2; // left px
const BASE_LEFT = 960 - MW / 2;
const pileX = (k) => 1480 + k * 82 - MW / 2; // k = 0..4
const PILE_Y = 900 - 655; // y offset so feet land at y=900
const PILE_SCALE = 0.6;

// ---------- html pieces ----------
const monkeys = SHIRTS.map((c, i) =>
  `<div class="monkey" id="mk${i}" style="left:${BASE_LEFT}px;top:${STAND_TOP}px">${monkeySvg({ shirt: c, label: i + 1, extra: bandage(`bd${i}`) })}</div>`
).join("\n");

const sleepers = SHIRTS.map((c, i) =>
  `<div class="sleeper" id="sl${i}" style="left:${layoutX(5, i)}px;top:${488}px">${monkeySvg({ shirt: c, label: i + 1, sleeping: true })}</div>`
).join("\n");

const counterNums = [0, 1, 2, 3, 4, 5].map((n) =>
  `<div class="cnum" id="cn${n}"><span class="big">${n}</span><span class="cword">${NUM[n]} · ${NUM_ZH[n]}</span></div>`
).join("");
const counterFaces = [0, 1, 2, 3, 4].map((i) => faceIcon(56, "cface", `cf${i}`)).join("");

const wordOrder = [5, 4, 3, 2, 1];
const bankRows = wordOrder.map((n, i) =>
  `<div class="bank-row" id="bank${i}"><span class="bank-dot">${i + 1}</span><span class="bank-en">${WORDS[n].en}</span><span class="bank-zh">${WORDS[n].zh}</span></div>`
).join("");

const mathCards = [5, 4, 3, 2, 1].map((n) => {
  const faces = Array.from({ length: n }, (_, i) => faceIcon(52, "mface", `mf${n}_${i}`)).join("");
  return `<div class="card-over math" id="math${n}">
    <div class="card-tag">Math · 数学</div>
    <div class="mfaces">${faces}</div>
    <div class="eq"><span id="eqa${n}">${n}</span><span id="eqb${n}" class="op">−</span><span id="eqc${n}">1</span><span id="eqd${n}" class="op">=</span><span id="eqe${n}" class="ans">${n - 1}</span></div>
    <div class="eq-zh">${n} 减 1 等于 ${n - 1}</div>
  </div>`;
}).join("\n");

const wordCards = [5, 4, 3, 2, 1].map((n) => {
  const w = WORDS[n];
  const letters = [...w.en].map((ch, i) => `<span class="lt" id="lt${n}_${i}">${ch}</span>`).join("");
  return `<div class="card-over word" id="word${n}">
    <div class="card-tag">New word · 新单词</div>
    <div class="w-icon">${ICONS[w.en]}</div>
    <div class="w-en">${letters}</div>
    <div class="w-zh">${w.zh}</div>
  </div>`;
}).join("\n");

const highlight = (en) =>
  en.replace(/\b(Five|Four|Three|Two|One|Zero|five|four|three|two|one|zero|\d)\b/g, '<b class="hl-n">$1</b>')
    .replace(/\b(monkey|bed|jump|head|doctor)\b/gi, (m) => `<b class="hl-w">${m}</b>`);

const subs = lines.map((l) =>
  `<div class="sub" id="sub_${l.id}"><div class="sub-en">${highlight(l.en)}</div><div class="sub-zh">${l.zh}</div></div>`
).join("\n");

const countdown = [5, 4, 3, 2, 1, 0].map((n) => `<div class="cd" id="cd${n}">${n}</div>`).join("");
const review = wordOrder.map((n, i) =>
  `<div class="rv" id="rv${i}"><div class="rv-ic">${ICONS[WORDS[n].en]}</div><div class="rv-en">${WORDS[n].en}</div><div class="rv-zh">${WORDS[n].zh}</div></div>`
).join("");

const stars = [[140, 470, 1], [300, 220, 0.7], [1700, 470, 0.8], [520, 120, 0.6], [1400, 150, 0.9], [760, 60, 0.5], [1180, 80, 0.7], [1840, 560, 0.6], [80, 640, 0.5], [640, 380, 0.4], [1300, 380, 0.5]]
  .map(([x, y, s], i) => `<div class="star" id="st${i}" style="left:${x}px;top:${y}px;transform:scale(${s})">★</div>`).join("");

const zzz = [0, 1, 2].map((i) => `<div class="zzz" id="z${i}" style="left:${640 + i * 260}px;top:${470 - (i % 2) * 20}px">Z<small>z</small>z</div>`).join("");

// ---------- timeline script ----------
const T = [];
const at = (s) => r(s);
T.push(`tl.fromTo("#title", {y:-60, opacity:0, scale:.8}, {y:0, opacity:1, scale:1, duration:.7, ease:"back.out(1.8)"}, 0.2);`);
T.push(`tl.fromTo("#title-sub", {opacity:0, y:20}, {opacity:1, y:0, duration:.5}, 0.7);`);
T.push(`tl.to("#title-wrap", {opacity:0, y:-40, duration:.5, ease:"power2.in"}, ${at(byId.intro1.end + 0.4)});`);
sfx.push({ name: "sparkle", t: 0.3 });

// monkeys pop in on the bed for the intro
for (let i = 0; i < 5; i++) {
  T.push(`tl.fromTo("#mk${i}", {x:${layoutX(5, i) - BASE_LEFT}, y:200, scale:.2, opacity:0}, {x:${layoutX(5, i) - BASE_LEFT}, y:0, scale:1, opacity:1, duration:.5, ease:"back.out(2)"}, ${at(0.9 + i * 0.12)});`);
}
sfx.push({ name: "pop", t: 0.9 });
T.push(`tl.fromTo(".card-left, .card-right", {opacity:0, y:-30}, {opacity:1, y:0, duration:.6, stagger:.15, ease:"power3.out"}, 1.4);`);
T.push(`tl.fromTo("#cn5", {opacity:0, scale:.5}, {opacity:1, scale:1, duration:.5, ease:"back.out(2)"}, 1.6);`);

function bounce(ids, from, to) {
  const half = 0.3;
  let halves = Math.floor((to - from) / half);
  if (halves % 2) halves -= 1;
  if (halves < 2) return;
  ids.forEach((id, j) =>
    T.push(`tl.to("#${id}", {y:-120, duration:${half}, ease:"power2.out", yoyo:true, repeat:${halves - 1}}, ${at(from + j * 0.07)});`)
  );
}
// intro bounce
bounce([0, 1, 2, 3, 4].map((i) => `mk${i}`), byId.intro1.start + 0.6, byId.intro1.end);

const showSub = (l) => {
  const out = l.end + l.gap - 0.12;
  T.push(`tl.fromTo("#sub_${l.id}", {opacity:0, y:16}, {opacity:1, y:0, duration:.2}, ${at(l.start - 0.1)});`);
  T.push(`tl.to("#sub_${l.id}", {opacity:0, duration:.12}, ${at(out)});`);
};
lines.forEach(showSub);

for (let n = 5; n >= 1; n--) {
  const v = (k) => byId[`v${n}${k}`];
  const a = v("a"), b = v("b"), c = v("c"), d = v("d"), e = v("e"), f = v("f");
  const alive = Array.from({ length: n }, (_, i) => `mk${i}`);
  const faller = n - 1, k = 5 - n;
  T.push(`tl.fromTo("#verse-chip", {scale:.6}, {scale:1, duration:.4, ease:"back.out(2)"}, ${at(a.start - 0.3)});`);
  T.push(`tl.to("#vcn${n + 1}", {opacity:0, duration:.15}, ${at(a.start - 0.3)});`);
  T.push(`tl.to("#vcn${n}", {opacity:1, duration:.15}, ${at(a.start - 0.3)});`);
  sfx.push({ name: "boing", t: a.start + 0.05 });
  // jumping
  const fallT = b.start + 0.25;
  bounce(alive, a.start, fallT);
  // fall: arc off the right side of the bed into the "ouch" pile on the floor
  const x0 = layoutX(n, faller) - BASE_LEFT, x1 = pileX(k) - BASE_LEFT;
  T.push(`tl.to("#mk${faller}", {x:${r((x0 + x1) / 2)}, y:-150, rotation:180, duration:.38, ease:"power2.out"}, ${at(fallT + 0.05)});`);
  T.push(`tl.to("#mk${faller}", {x:${x1}, y:${PILE_Y}, rotation:360, scale:${PILE_SCALE}, duration:.5, ease:"power2.in"}, ${at(fallT + 0.43)});`);
  const land = fallT + 0.93;
  T.push(`tl.set("#mk${faller}", {rotation:0}, ${at(land)});`);
  T.push(`tl.fromTo("#bonk", {x:${x1 + BASE_LEFT - 960 + 75}, scale:.2, opacity:0, rotation:-15}, {scale:1, opacity:1, rotation:0, duration:.25, ease:"back.out(3)"}, ${at(land)});`);
  T.push(`tl.to("#bonk", {opacity:0, scale:1.2, duration:.3}, ${at(land + 1.0)});`);
  T.push(`tl.fromTo("#bd${faller}", {opacity:0, scale:.3, transformOrigin:"110px 17px"}, {opacity:1, scale:1, duration:.3, ease:"back.out(3)"}, ${at(land + 0.15)});`);
  T.push(`tl.fromTo("#mk${faller}", {scaleY:${PILE_SCALE * 0.8}}, {scaleY:${PILE_SCALE}, duration:.35, ease:"elastic.out(1,.4)"}, ${at(land)});`);
  sfx.push({ name: "bonk", t: land });
  // the phone call
  T.push(`tl.fromTo("#call", {y:-360, opacity:0}, {y:0, opacity:1, duration:.55, ease:"back.out(1.4)"}, ${at(c.start - 0.2)});`);
  T.push(`tl.fromTo("#ring-txt", {opacity:0, scale:.6}, {opacity:1, scale:1, duration:.3, ease:"back.out(3)"}, ${at(c.start + 1.6)});`);
  T.push(`tl.fromTo("#mama", {rotation:-8}, {rotation:8, duration:.08, yoyo:true, repeat:9, ease:"none"}, ${at(c.start + 1.6)});`);
  T.push(`tl.to("#mama", {rotation:0, duration:.08}, ${at(c.start + 2.42)});`);
  T.push(`tl.to("#ring-txt", {opacity:0, duration:.2}, ${at(d.start - 0.2)});`);
  sfx.push({ name: "ring", t: c.start + 1.6 });
  T.push(`tl.fromTo("#doc-txt", {opacity:0, y:12}, {opacity:1, y:0, duration:.3}, ${at(d.start + 0.6)});`);
  T.push(`tl.fromTo("#doctor", {scale:1}, {scale:1.12, duration:.25, yoyo:true, repeat:3, ease:"sine.inOut"}, ${at(d.start + 0.6)});`);
  T.push(`tl.fromTo("#finger", {rotation:-18}, {rotation:18, duration:.22, yoyo:true, repeat:9, ease:"sine.inOut"}, ${at(d.start + 0.7)});`);
  T.push(`tl.to("#doc-txt", {opacity:0, duration:.2}, ${at(d.end + 0.3)});`);
  T.push(`tl.to("#call", {y:-360, opacity:0, duration:.45, ease:"power2.in"}, ${at(d.end + 0.35)});`);
  // math
  T.push(`tl.fromTo("#math${n}", {opacity:0, scale:.85}, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ${at(e.start - 0.2)});`);
  T.push(`tl.fromTo("#eqa${n}", {opacity:0, y:20}, {opacity:1, y:0, duration:.25}, ${at(e.start + 0.2)});`);
  T.push(`tl.fromTo("#eqb${n}, #eqc${n}", {opacity:0, y:20}, {opacity:1, y:0, duration:.25, stagger:.15}, ${at(e.start + 0.7)});`);
  T.push(`tl.to("#mf${n}_${n - 1}", {x:70, y:-40, rotation:40, opacity:0, duration:.5, ease:"power2.in"}, ${at(e.start + 0.8)});`);
  const ansT = e.start + Math.min(e.dur * 0.42, 1.9);
  T.push(`tl.fromTo("#eqd${n}", {opacity:0}, {opacity:1, duration:.2}, ${at(ansT - 0.2)});`);
  T.push(`tl.fromTo("#eqe${n}", {opacity:0, scale:2.2}, {opacity:1, scale:1, duration:.4, ease:"back.out(2.5)"}, ${at(ansT)});`);
  sfx.push({ name: "pop", t: ansT });
  // counter card updates to the new count
  T.push(`tl.to("#cn${n}", {opacity:0, scale:.4, duration:.25, ease:"power2.in"}, ${at(ansT)});`);
  T.push(`tl.fromTo("#cn${n - 1}", {opacity:0, scale:1.6}, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ${at(ansT + 0.2)});`);
  T.push(`tl.to("#cf${n - 1}", {opacity:.18, scale:.8, duration:.3}, ${at(ansT + 0.2)});`);
  // remaining monkeys re-centre on the bed
  for (let i = 0; i < n - 1; i++) {
    T.push(`tl.to("#mk${i}", {x:${layoutX(n - 1, i) - BASE_LEFT}, duration:.6, ease:"power2.inOut"}, ${at(e.start + 0.4 + i * 0.05)});`);
  }
  T.push(`tl.to("#math${n}", {opacity:0, duration:.25}, ${at(f.start - 0.3)});`);
  // new word
  T.push(`tl.fromTo("#word${n}", {opacity:0, scale:.85}, {opacity:1, scale:1, duration:.4, ease:"back.out(2)"}, ${at(f.start - 0.25)});`);
  T.push(`tl.fromTo("#word${n} .lt", {opacity:0, y:30}, {opacity:1, y:0, duration:.25, stagger:.08, ease:"back.out(2)"}, ${at(f.start + 0.6)});`);
  T.push(`tl.fromTo("#word${n} .w-icon", {rotation:-10}, {rotation:10, duration:.3, yoyo:true, repeat:5, ease:"sine.inOut"}, ${at(f.start + 0.6)});`);
  sfx.push({ name: "chime", t: f.start + 0.6 });
  T.push(`tl.to("#word${n}", {opacity:0, duration:.3}, ${at(f.end + f.gap - 0.35)});`);
  const bi = 5 - n;
  T.push(`tl.fromTo("#bank${bi}", {opacity:.25}, {opacity:1, duration:.3}, ${at(f.end + f.gap - 0.35)});`);
  T.push(`tl.fromTo("#bank${bi} .bank-dot", {scale:1.6}, {scale:1, duration:.4, ease:"back.out(3)"}, ${at(f.end + f.gap - 0.3)});`);
}

// outro
const o1 = byId.out1, o2 = byId.out2, o3 = byId.out3;
T.push(`tl.to("#vcn1", {opacity:0, duration:.15}, ${at(o1.start - 0.3)});`);
T.push(`tl.to("#vcn0", {opacity:1, duration:.15}, ${at(o1.start - 0.3)});`);
T.push(`tl.to("#night", {opacity:.5, duration:1.2}, ${at(o1.start - 0.3)});`);
T.push(`tl.to(".monkey", {opacity:0, duration:.6}, ${at(o1.start)});`);
T.push(`tl.fromTo(".sleeper", {y:80, opacity:0}, {y:0, opacity:1, duration:.6, stagger:.12, ease:"power2.out"}, ${at(o1.start + 0.3)});`);
T.push(`tl.fromTo("#blanket", {y:120, opacity:0}, {y:0, opacity:1, duration:.6, ease:"power2.out"}, ${at(o1.start + 0.3)});`);
for (let i = 0; i < 3; i++) {
  const s = o1.start + 1.2 + i * 0.5;
  const reps = Math.max(0, Math.floor((o3.end + 1.2 - s) / 1.6) - 1);
  T.push(`tl.fromTo("#z${i}", {y:0, opacity:0, scale:.6}, {y:-60, opacity:1, scale:1.1, duration:1.6, repeat:${reps}, ease:"sine.out"}, ${at(s)});`);
}
T.push(`tl.fromTo("#lamp-glow", {opacity:1}, {opacity:.25, duration:.8}, ${at(o1.start)});`);
const cdStart = o2.start + Math.min(1.55, o2.dur * 0.4);
const cdStep = (o2.end - 0.15 - cdStart) / 5.4;
T.push(`tl.to("#window", {opacity:0, duration:.4}, ${at(o2.start - 0.3)});`);
T.push(`tl.fromTo("#countdown", {opacity:0}, {opacity:1, duration:.3}, ${at(o2.start)});`);
[5, 4, 3, 2, 1, 0].forEach((n, i) => {
  T.push(`tl.fromTo("#cd${n}", {opacity:.15, scale:.7}, {opacity:1, scale:1.25, duration:.2, ease:"back.out(3)"}, ${at(cdStart + i * cdStep)});`);
  T.push(`tl.to("#cd${n}", {scale:1, duration:.2}, ${at(cdStart + i * cdStep + 0.2)});`);
  sfx.push({ name: "tick", t: cdStart + i * cdStep });
});
T.push(`tl.to("#countdown", {opacity:0, duration:.3}, ${at(o3.start - 0.35)});`);
T.push(`tl.fromTo("#review", {opacity:0}, {opacity:1, duration:.3}, ${at(o3.start - 0.25)});`);
const rvStep = Math.min(0.5, (o3.dur * 0.55) / 5);
for (let i = 0; i < 5; i++) {
  T.push(`tl.fromTo("#rv${i}", {opacity:0, y:40, scale:.7}, {opacity:1, y:0, scale:1, duration:.35, ease:"back.out(2.4)"}, ${at(o3.start + 0.05 + i * rvStep)});`);
}
const jobT = o3.start + o3.dur * 0.62;
T.push(`tl.fromTo("#great", {opacity:0, scale:.3, rotation:-8}, {opacity:1, scale:1, rotation:0, duration:.6, ease:"back.out(2.5)"}, ${at(jobT)});`);
T.push(`tl.fromTo(".star", {opacity:.5}, {opacity:1, scale:1.4, duration:.4, stagger:.05, yoyo:true, repeat:1}, ${at(jobT)});`);
sfx.push({ name: "sparkle", t: jobT });
// gentle star twinkle through the whole piece
T.push(`tl.fromTo("#sky-stars", {opacity:.55}, {opacity:1, duration:2, yoyo:true, repeat:${Math.floor(TOTAL / 2) - 1}, ease:"sine.inOut"}, 0);`);

// every fromTo after the first one on the same target must not render its "from" at build time
{
  const seen = new Set();
  for (let i = 0; i < T.length; i++) {
    const m = T[i].match(/^tl\.fromTo\("([^"]+)", (\{[^}]*\}), \{/);
    if (!m) continue;
    if (seen.has(m[1])) T[i] = T[i].replace(/, \{([^}]*)\}, ([\d.]+)\);$/, ", {$1, immediateRender:false}, $2);");
    seen.add(m[1]);
  }
}
writeFileSync("timeline.json", JSON.stringify({ total: TOTAL, lines: lines.map(({ id, start, dur, en, zh }) => ({ id, start, dur, en, zh })), sfx }, null, 2));

// ---------- html ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<title>Five Little Monkeys</title>
<script src="vendor/gsap.min.js"></script>
<style>
  :root { --night:#1e2a5a; --ink:#2b1a10; --sun:#ffd43b; --coral:#ff6b6b; --cream:#fff8e7; }
  @font-face { font-family:"WenQuanYi Zen Hei"; src: local("WenQuanYi Zen Hei"); }
  body { margin:0; background:#000; font-family:Nunito, "WenQuanYi Zen Hei", sans-serif; }
  #root { position:relative; width:1920px; height:1080px; overflow:hidden; }
  #stage { position:absolute; inset:0; }
  .fill { position:absolute; inset:0; }
  #wall { background: radial-gradient(ellipse at 50% 30%, #3b4c9b 0%, #26336e 55%, #1a2350 100%); }
  #paper { background-image: radial-gradient(rgba(255,255,255,.07) 2px, transparent 2.5px); background-size: 48px 48px; }
  #floor { position:absolute; left:0; right:0; top:800px; bottom:0; background: repeating-linear-gradient(90deg, #b07a4a 0 160px, #a46f40 160px 164px); }
  #floor::after { content:""; position:absolute; inset:0; background:linear-gradient(#0003, #0000 40%); }
  #rug { position:absolute; left:470px; top:830px; width:980px; height:90px; border-radius:50%; background:#e8590c; box-shadow: inset 0 0 0 10px #ff922b, inset 0 0 0 20px #e8590c, inset 0 0 0 26px #ffd8a8; }
  #window { position:absolute; left:820px; top:96px; width:280px; height:250px; border-radius:140px 140px 18px 18px; background:linear-gradient(#0d1438, #233172); border:14px solid #f1e3c8; box-sizing:border-box; overflow:hidden; }
  #window::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:10px; margin-left:-5px; background:#f1e3c8; }
  #moon { position:absolute; left:150px; top:40px; width:70px; height:70px; border-radius:50%; background:#fff3bf; box-shadow: 0 0 40px 10px #fff3bf55; }
  #moon::after { content:""; position:absolute; left:-20px; top:-8px; width:70px; height:70px; border-radius:50%; background:#1a2560; }
  #sky-stars { position:absolute; inset:0; }
  .star { position:absolute; color:#ffe066; font-size:40px; line-height:1; text-shadow:0 0 14px #ffe06688; }
  #headboard { position:absolute; left:520px; top:470px; width:880px; height:220px; border-radius:60px 60px 0 0; background:linear-gradient(#c98b55, #a0673a); box-shadow: inset 0 -12px 0 #8a5530; }
  #headboard::before { content:""; position:absolute; left:40px; right:40px; top:30px; height:120px; border-radius:40px; background:#b47845; box-shadow: inset 0 4px 10px #0003; }
  #pillow { position:absolute; left:580px; top:600px; width:220px; height:70px; border-radius:36px; background:#fff; box-shadow: inset 0 -8px 0 #dee2e6; }
  #mattress { position:absolute; left:500px; top:648px; width:920px; height:44px; border-radius:16px; background:#fff; }
  #quilt { position:absolute; left:500px; top:668px; width:920px; height:120px; border-radius:18px 18px 26px 26px; background-color:#4dabf7; background-image: radial-gradient(#fff 9px, transparent 10px), radial-gradient(#ffd43b 9px, transparent 10px); background-size:80px 80px; background-position:0 0, 40px 40px; box-shadow: inset 0 -14px 0 #339af0; }
  .bedleg { position:absolute; top:780px; width:34px; height:50px; background:#8a5530; border-radius:0 0 8px 8px; }
  #nightstand { position:absolute; left:330px; top:650px; width:150px; height:170px; border-radius:12px; background:#c98b55; box-shadow: inset 0 -10px 0 #a0673a; }
  #nightstand::before { content:""; position:absolute; left:20px; right:20px; top:70px; height:40px; border-radius:8px; background:#b47845; }
  #lamp { position:absolute; left:360px; top:520px; width:90px; height:130px; }
  #lamp-shade { position:absolute; left:0; top:0; width:90px; height:70px; background:#ffd43b; clip-path:polygon(20% 0, 80% 0, 100% 100%, 0 100%); }
  #lamp-base { position:absolute; left:38px; top:70px; width:14px; height:60px; background:#f1e3c8; }
  #lamp-glow { position:absolute; left:230px; top:440px; width:360px; height:360px; border-radius:50%; background:radial-gradient(#ffe06655, #ffe06600 70%); }
  .monkey, .sleeper { position:absolute; width:150px; height:197px; transform-origin:50% 100%; }
  .monkey svg, .sleeper svg { display:block; }
  .bandage { opacity:0; }
  #blanket { position:absolute; left:500px; top:610px; width:920px; height:180px; border-radius:40px 40px 26px 26px; background-color:#9775fa; background-image: radial-gradient(#ffe066 8px, transparent 9px); background-size:70px 70px; box-shadow: inset 0 -14px 0 #7950f2, inset 0 18px 0 #fff; opacity:0; }
  #night { background:#0b1033; opacity:0; }
  .zzz { position:absolute; font-family:Nunito; font-weight:900; font-size:72px; color:#e5dbff; opacity:0; text-shadow:0 4px 0 #5f3dc4; }
  .zzz small { font-size:48px; }

  .card { position:absolute; top:44px; width:400px; height:350px; box-sizing:border-box; border-radius:32px; background:var(--cream); box-shadow: 0 10px 0 #0003, 0 0 0 8px #fff inset; padding:24px 28px; }
  .card-left { left:56px; }
  .card-right { left:1464px; }
  .card-tag { font-weight:900; font-size:26px; color:#fff; background:var(--coral); display:inline-block; padding:4px 16px; border-radius:20px; }
  .card-tag.blue { background:#339af0; }
  .cnum { position:absolute; left:0; right:0; top:70px; display:flex; flex-direction:column; align-items:center; opacity:0; }
  .cnum .big { font-weight:900; font-size:150px; line-height:1; color:var(--ink); }
  .cnum .cword { font-weight:900; font-size:38px; color:#e8590c; }
  .cfaces { position:absolute; left:24px; right:24px; bottom:20px; display:flex; justify-content:space-between; }
  .bank-row { display:flex; align-items:center; gap:14px; height:50px; opacity:.25; }
  .bank-list { margin-top:12px; }
  .bank-dot { width:38px; height:38px; border-radius:50%; background:#51cf66; color:#fff; font-weight:900; font-size:22px; display:flex; align-items:center; justify-content:center; }
  .bank-en { font-weight:900; font-size:34px; color:var(--ink); width:150px; }
  .bank-zh { font-weight:900; font-size:30px; color:#868e96; }
  .card-over { position:absolute; inset:0; border-radius:32px; background:var(--cream); padding:24px 28px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; opacity:0; }
  .card-over .card-tag { align-self:flex-start; }
  .word .card-tag { background:#7950f2; }
  .math .card-tag { background:#339af0; }
  .mfaces { display:flex; gap:6px; height:60px; margin-top:20px; }
  .eq { display:flex; gap:16px; align-items:center; font-weight:900; font-size:96px; color:var(--ink); margin-top:8px; line-height:1.1; }
  .eq .op { color:#339af0; }
  .eq .ans { color:#e8590c; display:inline-block; }
  .eq-zh { font-weight:900; font-size:30px; color:#868e96; }
  .w-icon { height:130px; display:flex; align-items:center; margin-top:4px; }
  .w-en { font-weight:900; font-size:84px; color:#5f3dc4; line-height:1; display:flex; }
  .lt { display:inline-block; }
  .w-zh { font-weight:900; font-size:40px; color:#e8590c; margin-top:6px; }

  #title-wrap { position:absolute; left:440px; top:70px; width:1040px; height:300px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  #title { font-weight:900; font-size:92px; color:var(--sun); text-shadow: 0 6px 0 #c2410c, 0 12px 24px #0006; letter-spacing:1px; }
  #title-sub { font-weight:900; font-size:40px; color:#fff; background:#ff6b6b; padding:6px 28px; border-radius:30px; margin-top:10px; }

  #call { position:absolute; left:500px; top:40px; width:920px; height:300px; border-radius:36px; background:#fff; box-shadow:0 10px 0 #0003; opacity:0; }
  .portrait { position:absolute; top:30px; width:170px; height:170px; border-radius:50%; overflow:hidden; display:flex; justify-content:center; }
  .portrait svg { margin-top:14px; }
  #mama { left:40px; background:#ffd6e7; transform-origin:50% 50%; }
  #doctor { right:40px; background:#d0ebff; }
  .p-label { position:absolute; top:212px; width:210px; margin:0 -20px; white-space:nowrap; text-align:center; font-weight:900; font-size:28px; color:var(--ink); }
  #wire { position:absolute; left:220px; right:220px; top:112px; height:0; border-top:8px dashed #ced4da; }
  #ring-txt, #doc-txt { position:absolute; left:215px; right:215px; top:60px; text-align:center; font-weight:900; color:var(--ink); opacity:0; }
  #ring-txt { font-size:56px; color:#e8590c; top:60px; background:#fff; padding:8px 0; border-radius:20px; }
  #doc-txt { font-size:36px; line-height:1.2; top:40px; background:#fff; padding:10px; border-radius:20px; }
  #ring-txt .dz, #doc-txt .dz { font-size:30px; color:#868e96; display:block; margin-top:6px; }
  #finger { position:absolute; right:30px; top:150px; width:44px; height:70px; transform-origin:50% 100%; }

  #bonk { position:absolute; left:860px; top:670px; width:200px; height:150px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:38px; color:#fff; background:#fa5252; clip-path:polygon(50% 0,61% 30%,95% 15%,72% 45%,100% 60%,68% 66%,78% 100%,50% 76%,22% 100%,32% 66%,0 60%,28% 45%,5% 15%,39% 30%); opacity:0; }

  #sub-band { position:absolute; left:40px; right:40px; top:930px; height:130px; border-radius:30px; background:#1a2350e6; box-shadow:0 0 0 4px #ffffff22 inset; }
  .sub { position:absolute; left:220px; right:60px; top:930px; height:130px; display:flex; flex-direction:column; justify-content:center; opacity:0; }
  .sub-en { font-weight:900; font-size:50px; color:#fff; line-height:1.15; }
  .sub-zh { font-weight:500; font-size:32px; color:#c5d0ff; margin-top:4px; font-family:"WenQuanYi Zen Hei", sans-serif; }
  .hl-n { color:var(--sun); }
  .hl-w { color:#b197fc; }
  #verse-chip { position:absolute; left:64px; top:952px; width:136px; height:86px; border-radius:22px; background:#ff6b6b; color:#fff; font-weight:900; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  #verse-chip .vc-l { font-size:22px; opacity:.9; }
  #verse-chip .vc-stack { position:relative; width:100%; height:42px; }
  #verse-chip .vc-n { font-size:34px; position:absolute; left:0; right:0; text-align:center; }

  #countdown, #review { position:absolute; left:440px; top:70px; width:1040px; height:300px; display:flex; align-items:center; justify-content:center; gap:26px; opacity:0; }
  .cd { width:140px; height:140px; border-radius:50%; background:var(--sun); color:var(--ink); font-weight:900; font-size:96px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 0 #c2410c; }
  .rv { width:180px; height:250px; border-radius:26px; background:var(--cream); display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 8px 0 #0003; }
  .rv-ic { height:120px; display:flex; align-items:center; transform:scale(.8); }
  .rv-en { font-weight:900; font-size:38px; color:#5f3dc4; }
  .rv-zh { font-weight:900; font-size:28px; color:#e8590c; }
  #great { position:absolute; left:560px; top:395px; width:800px; height:110px; border-radius:60px; background:#51cf66; color:#fff; font-weight:900; font-size:64px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 0 #2b8a3e; opacity:0; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${TOTAL}">
  <section id="stage" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="1">
    <div id="wall" class="fill"></div>
    <div id="paper" class="fill"></div>
    <div id="sky-stars">${stars}</div>
    <div id="window"><div id="moon"></div></div>
    <div id="floor"></div>
    <div id="rug"></div>
    <div id="lamp-glow"></div>
    <div id="nightstand"></div>
    <div id="lamp"><div id="lamp-shade"></div><div id="lamp-base"></div></div>
    <div id="headboard"></div>
    <div id="pillow"></div>
    ${sleepers}
    <div id="mattress"></div>
    <div id="quilt"></div>
    <div id="blanket"></div>
    <div class="bedleg" style="left:520px"></div><div class="bedleg" style="left:1366px"></div>
    ${monkeys}
    <div id="bonk">BONK!</div>
    <div id="night" class="fill"></div>
    ${zzz}

    <div class="card card-left">
      <div class="card-tag">How many? · 有几只？</div>
      ${counterNums}
      <div class="cfaces">${counterFaces}</div>
    </div>
    <div class="card card-right">
      <div class="card-tag blue">My Words · 我的单词</div>
      <div class="bank-list">${bankRows}</div>
      ${mathCards}
      ${wordCards}
    </div>

    <div id="title-wrap"><div id="title">Five Little Monkeys</div><div id="title-sub">Sing · Count · Learn &nbsp;唱儿歌 · 学数数 · 学英语</div></div>

    <div id="call">
      <div class="portrait" id="mama">${monkeySvg({ shirt: "#f783ac", label: "♥", extra: '<path d="M60 8 L80 18 L100 8 L100 30 L80 22 L60 30 Z" fill="#e64980"/>' })}</div>
      <div class="p-label" style="left:40px">Mama · 妈妈</div>
      <div class="portrait" id="doctor">${monkeySvg({ shirt: "#ffffff", label: "+", extra: '<circle cx="80" cy="26" r="13" fill="#adb5bd" stroke="#868e96" stroke-width="3"/><path d="M58 112 Q80 140 102 112" stroke="#495057" stroke-width="4" fill="none"/><text x="80" y="170" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="40" fill="#fa5252">+</text>' }).replace('fill="#fff">+</text>', 'fill="#fff"></text>')}</div>
      <div class="p-label" style="right:40px">Doctor · 医生</div>
      <svg id="finger" viewBox="0 0 44 70"><rect x="14" y="0" width="16" height="44" rx="8" fill="${PEACH}" stroke="${FUR_D}" stroke-width="3"/><rect x="4" y="34" width="36" height="34" rx="12" fill="${PEACH}" stroke="${FUR_D}" stroke-width="3"/></svg>
      <div id="wire"></div>
      <div id="ring-txt">Ring, ring!<span class="dz">叮铃铃～</span></div>
      <div id="doc-txt">“Beds are for sleeping, not for jumping!”<span class="dz">床是用来睡觉的，不是用来跳的！</span></div>
    </div>

    <div id="countdown">${countdown}</div>
    <div id="review">${review}</div>
    <div id="great">Great job! 你真棒！</div>

    <div id="sub-band"></div>
    <div id="verse-chip"><span class="vc-l">Verse</span><span class="vc-stack">${[6,5,4,3,2,1,0].map((k) => `<span class="vc-n" id="vcn${k}" style="opacity:${k === 6 ? 1 : 0}">${k === 6 ? "Hi!" : k === 0 ? "★" : `${6 - k} / 5`}</span>`).join("")}</span></div>
    ${subs}
  </section>
  <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-volume="1"></audio>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });
  ${T.join("\n  ")}
  window.__timelines["main"] = tl;
</script>
</body>
</html>
`;
writeFileSync("index.html", html);
console.log("total", TOTAL, "s; lines", lines.length, "; sfx", sfx.length);
