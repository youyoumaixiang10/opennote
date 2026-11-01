// node tools/lines.mjs ep1  → prints [{key, who, text}] for TTS
const ep = (await import(`../episodes/${process.argv[2]}.mjs`)).default;
const out = [];
ep.shots.forEach((sh, si) => (sh.lines || []).forEach((ln, li) => {
  for (const w of (Array.isArray(ln.who) ? ln.who : [ln.who])) out.push({ key: `${si}_${li}_${w}`, who: w, text: ln.text });
}));
console.log(JSON.stringify(out, null, 1));
