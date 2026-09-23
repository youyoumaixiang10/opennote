'use strict';
// ============================================================
// roto.js: FOUND MOTION. Real movement, taken from public-domain motion studies (or any video),
// turned into vector pen strokes by roto.py and redrawn here with the core's brush, frame by frame.
// The motion is real, every line on screen is drawn by code. Load after core.js; clips.js after this file.
//
//   registerClip(name, meta)            written by roto.py into clips.js
//   roto(c, name, k, { x, y, h, flip, rot, fill, wash, ink, weight, seed, p })   draw pose k with its feet at (x, y)
//   rotoSprite(name, k, h, opts)        the same pose rendered once into a cached layer (for many small copies)
//   rotoGap(name, k)                    how far the lowest point of pose k is above the ground, in clip px
//   rotoAirborne(name)                  the pose that is highest off the ground
// ============================================================
const CLIPS = {};
function registerClip(name, meta) { if (!meta.frames?.length || !(meta.fps > 0)) throw new Error('Clip needs frames and source fps'); meta.name = name; meta.n = meta.frames.length; CLIPS[name] = meta; }
function rotoAt(c, name, seconds, o = {}) { const cl = CLIPS[name]; if (!cl) throw new Error('Unknown clip: ' + name); const k = (seconds * (o.speed ?? 1) + (o.offset ?? 0)) * cl.fps; return roto(c, name, o.loop === false ? clamp(k, 0, cl.n - 1) : k, o); }
const rotoPose = (name, k) => { const cl = CLIPS[name]; if (!cl) throw new Error('unknown clip: ' + name + ' (is clips.js loaded after roto.js?)'); return cl.frames[((Math.floor(k) % cl.n) + cl.n) % cl.n]; };
function rotoGap(name, k) { let low = -1e9; for (const c0 of rotoPose(name, k).outer) for (const q of c0) if (q[1] > low) low = q[1]; return -low; }
function rotoAirborne(name) { let best = 0, gap = -1; for (let k = 0; k < CLIPS[name].n; k++) { const g = rotoGap(name, k); if (g > gap) { gap = g; best = k; } } return best; }
// roto: one pose. (x, y) is the ground point under the middle of the figure, h the height of the tallest pose in frame units.
// fill = body colour under the lines (null for none), wash = a watercolour off the register, p = 0..1 draws the strokes on, longest first.
function roto(c, name, k, o = {}) { const { x = CX, y = CY, h = 300, flip = false, rot = 0, fill = PAL.light, wash: washCol = null, ink = PAL.ink, weight = 1, seed = 1, p = 1, washOff = 7, washAl = .55, al = 1, amp = .5, maxLines = 9999 } = o;
  const cl = CLIPS[name], fr = rotoPose(name, k), s = h / cl.h, dir = flip ? -1 : 1, ca = Math.cos(rot), sa = Math.sin(rot), T = q => { const X = q[0] * s * dir, Y = q[1] * s; return [x + X * ca - Y * sa, y + X * sa + Y * ca]; };
  if (fill || washCol) { const path = new Path2D(); for (const c0 of fr.outer) { c0.forEach((q, i) => { const t = T(q); i ? path.lineTo(t[0], t[1]) : path.moveTo(t[0], t[1]); }); path.closePath(); }
    if (fill) { c.save(); c.globalAlpha = al * Math.min(1, p * 5); c.fillStyle = fill; c.fill(path, 'evenodd'); c.restore(); }
    if (washCol) wash(c, path, washCol, { al: washAl * al * Math.min(1, p * 2.5), off: washOff, seed: seed + 3 }); }
  const lines = fr.lines.length ? fr.lines : fr.outer.map((pts, i) => ({ p: [...pts, pts[0]], w: 1.4, id: 'outline-' + i }));
  const n = Math.min(lines.length, maxLines), upto = p * n; c.save(); c.globalAlpha = al;
  for (let i = 0; i < n && i < upto; i++) { const l = lines[i]; brush(c, l.p.map(T), { w: Math.max(1.1, l.w * s * weight), color: ink, amp, seed: seed + i * 7, taper: .45, p: clamp(upto - i, 0, 1), smooth: l.p.length > 2 }); }
  c.restore(); }
// rotoSprite: a pose drawn once into its own layer. Returns { canvas, w, h, ox, oy }: draw it with drawSprite so its ground point lands where you say.
const _sprites = new Map();
function rotoSprite(name, k, h, o = {}) { const cl0 = CLIPS[name]; if (!cl0) throw new Error('Unknown clip: ' + name); k = ((Math.floor(k) % cl0.n) + cl0.n) % cl0.n; const key = JSON.stringify([name, k, h, o, PAL, S]); if (_sprites.has(key)) return _sprites.get(key);
  const cl = CLIPS[name], s = h / cl.h; let x0 = 1e9, x1 = -1e9, y0 = 1e9; for (const fr of cl.frames) for (const c0 of fr.outer) for (const q of c0) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; }
  const pad = 14, w = Math.ceil((x1 - x0) * s + pad * 2), hh = Math.ceil(-y0 * s + pad * 2), cv = document.createElement('canvas'); cv.width = Math.round(w * S); cv.height = Math.round(hh * S); const g = cv.getContext('2d'); g.setTransform(S, 0, 0, S, 0, 0);
  const ox = -x0 * s + pad, oy = hh - pad; roto(g, name, k, { ...o, x: ox, y: oy, h }); const sp = { canvas: cv, w, h: hh, ox, oy }; _sprites.set(key, sp); return sp; }
function drawSprite(c, sp, x, y, o = {}) { const { scale = 1, rot = 0, al = 1, flip = false } = o; c.save(); c.translate(x, y); c.rotate(rot); c.scale(scale * (flip ? -1 : 1), scale); c.globalAlpha *= al; c.drawImage(sp.canvas, -sp.ox, -sp.oy, sp.w, sp.h); c.restore(); }
