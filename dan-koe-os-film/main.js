const q = new URLSearchParams(location.search);
const mod = await import('./film.js');
await document.fonts.load('46px SUB', '字幕');
const F = await mod.build(q);
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = [...F.ev, { t: 0, type: 'cues', ...F.cues }]; window.SUBS = F.subs;
window.TEXTS = F.texts;
window.render = t => F.render(ctx, t);
window.READY = true;
