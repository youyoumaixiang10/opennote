// Shared, DOM-free: turns an episode script + voice durations into absolute times.
// Time specs inside a shot: number (s from shot start) | "L2" (start of line 2) | "L2e" (end of line 2), with "+0.3"/"-0.2".

export function lineKey(si, li) { return `${si}_${li}`; }

export function buildTimeline(ep, durs) {
  const shots = [];
  let T = 0;
  ep.shots.forEach((sh, si) => {
    const lines = [];
    let prevEnd = 0;
    (sh.lines || []).forEach((ln, li) => {
      const who = Array.isArray(ln.who) ? ln.who : [ln.who];
      const d = Math.max(...who.map(w => durs[`${lineKey(si, li)}_${w}`] ?? estimate(ln.text)));
      let at;
      if (typeof ln.at === 'number') at = ln.at;
      else if (typeof ln.at === 'string' && ln.at.startsWith('+')) at = prevEnd + parseFloat(ln.at.slice(1));
      else at = prevEnd + (li === 0 ? 0.4 : 0.3);
      lines.push({ ...ln, who, at, end: at + d, d, key: lineKey(si, li) });
      prevEnd = at + d;
    });
    const R = spec => resolve(spec, lines);
    let dur = sh.dur === undefined ? 0 : R(sh.dur);
    const lastEnd = lines.length ? Math.max(...lines.map(l => l.end)) : 0;
    dur = Math.max(dur, lastEnd + (sh.tail ?? 0.6));
    const fixKeys = arr => arr.map(([t, ...v]) => [R(t), ...v]);
    const actors = {};
    for (const [id, keys] of Object.entries(sh.actors || {})) actors[id] = fixKeys(keys);
    const props = {};
    for (const [id, keys] of Object.entries(sh.props || {})) props[id] = fixKeys(keys);
    const out = {
      i: si, t0: T, dur, cam: fixKeys(sh.cam), actors, props, lines,
      sfx: (sh.sfx || []).map(e => ({ ...e, at: R(e.at) })),
      music: sh.music || 'theme', star: sh.star ? sh.star.map(R) : null,
      title: sh.title || null, mantra: sh.mantra || null, order: sh.order || null,
      over: sh.over || null, wash: sh.wash || null, caption: sh.caption !== false,
    };
    shots.push(out);
    T += dur;
  });
  // absolute events for the mixer
  const voice = [], sfx = [];
  for (const sh of shots) {
    for (const l of sh.lines) for (const w of l.who) voice.push({ t: sh.t0 + l.at, file: `${l.key}_${w}`, who: w, text: l.text, d: l.d, gain: l.gain ?? 1 });
    for (const e of sh.sfx) sfx.push({ ...e, t: sh.t0 + e.at });
    if (sh.star) sfx.push({ t: sh.t0 + sh.star[0], s: 'ding' });
    // footsteps from walking segments
    for (const [id, keys] of Object.entries(sh.actors)) {
      for (let k = 1; k < keys.length; k++) {
        const a = keys[k - 1], b = keys[k];
        const dx = Math.abs((b[1].x ?? a[1].x) - (a[1].x ?? 0));
        if (b[1].x !== undefined && a[1].x !== undefined && dx > 30 && b[1].walk !== false) {
          const big = ['mama', 'baba', 'nainai', 'tumama'].includes(id);
          for (let t = a[0] + 0.1; t < b[0]; t += big ? 0.42 : 0.3) sfx.push({ t: sh.t0 + t, s: 'step', g: big ? 0.8 : 0.55 });
        }
      }
    }
  }
  return { shots, DUR: T, voice, sfx, music: shots.map(s => ({ t0: s.t0, t1: s.t0 + s.dur, state: s.music })) };
}

function estimate(text) { return 0.28 * [...text.replace(/[，。！？、……—\s]/g, '')].length + 0.4; }

export function resolve(spec, lines) {
  if (typeof spec === 'number') return spec;
  const m = /^L(\d+)(e?)([+-][\d.]+)?$/.exec(spec);
  if (!m) throw new Error('bad time spec ' + spec);
  const l = lines[+m[1]];
  if (!l) throw new Error('no line ' + spec);
  return (m[2] ? l.end : l.at) + (m[3] ? parseFloat(m[3]) : 0);
}
