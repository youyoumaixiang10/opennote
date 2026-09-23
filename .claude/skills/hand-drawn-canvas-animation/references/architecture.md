# Architecture, API, drawings, rendering, pitfalls

## Files of a film

```
my-film/
  core.js            copied from assets/, never edited per film
  studio.js          optional motion/construction helpers
  cels.js            whole-pose stroke drawings and exposure sheets
  materials.js       optional material helpers
  my-film.html       original drawings and scenes; see sketchbook-bird.html
  render.mjs         copied from scripts/
  package.json       copied from scripts/, then npm i
  out/               my-film-frames/, my-film.mp4, my-film-contact.jpg
```

`my-film.html` contains the brief/beat sheet, palette, drawing data, exposure
sheets, scenes, optional score and the `defineFilm` call. Keep authoring data
separate from the brush and runtime so poses can be revised directly.

## Format and resolution

The frame is logical: the short side is always 1080 units and the long side
follows the aspect ratio, so a 16:9 film is 1920 x 1080 units and a 9:16 film
is 1080 x 1920. Scenes draw in these units and place things relative to `CX`,
`CY`, `W` and `H`, never at literal pixel positions, and review composition again for each aspect ratio. Output resolution is a separate choice made at render
time: `--width 1920` scales everything by `S` on the way to the canvas, lines
and dots included, so a 4K render is as crisp as a 1080 one.

```bash
node render.mjs film.html --grid 24 --ar 9:16              # vertical, short side 1080
node render.mjs film.html --ar 16:9 --width 3840           # 4K landscape
```

`defineFilm({ format: { ar: '16:9', width: 1920 } })` sets the film's default;
the query string (`?ar=16:9&w=1920`) overrides it. `layer()` canvases made at
file scope follow the format automatically. Output height is forced even, as
libx264 needs it.

## Invariants

- `drawFrame(i)` is a pure function of the drawn-frame index. Scenes keep no
  state between frames and never read the clock. Same `i`, same pixels in the same pinned browser/font runtime. Cross-machine pixels may differ. Every motion helper (`key`, `spring`, `settle`, `drift`...) is
  a pure function of time for the same reason.
- A film draws at 24 fps by default, or explicitly 12 for archival timing. The
  `i` a scene receives is always the frame index on the 12 fps grid, so
  `pulse`, `boil` and `flicker` keep their meaning; `tau` is continuous in a
  24 fps film unless the scene is marked `twos: true`. `twos(tau)` snaps a
  time to the grid for a character's pose.
- A scene is `sceneX(c, tau, i)`: `c` a 2D context (main canvas or a layer),
  `tau` seconds since the scene started, `i` the global drawn frame.
- The timeline is `[{name, dur, fn}]`. Boundaries are the cuts. Duration and
  frame count derive from it.
- World units are pixels at zoom 1. `cam(c, x, y, zoom, rot)` puts world
  point `(x, y)` at the frame centre. Puppets draw in local coordinates,
  origin at the body centre, forward = up (negative y); place them with
  `translate`, `rotate`, `scale`.
- Compositing uses layers: render A into `L1`, B into `L2`, compose on the
  main context (`blot`, `iris`, `mosaic`, `flicker`, `blit`). Make layers once
  with `layer()` at file scope; draw a layer full-frame with `blit(c, L)`, not
  `drawImage(L, 0, 0)`, because layers live in output pixels.
- `PAL` is global and mutable through `usePalette`. A scene that needs a
  different look calls `usePalette` at its top; the next scene sets its own.
- Hooks for the renderer: `window.__frame(i)` returns the frame as a PNG data
  URL straight from the canvas (no screenshot, so CSS and device pixel ratio
  never matter), `window.__grid(n)` returns a sheet of n evenly spaced frames,
  `window.__NDRAW`, `window.__size`, `window.__ready`; query string
  `?frame=N&bare=1&ar=16:9&w=1920&grid=24`.

## API index (assets/core.js)

| section | names |
|---|---|
| config | `W`, `H`, `CX`, `CY`, `S`, `OUT_W`, `OUT_H`, `SHORT`, `setFormat({ar, width})`, `FPS_DRAW`, `FPS_OUT`, `TAU`, `HAND_FONT` |
| colour | `lerp`, `clamp`, `parseColor`, `toHex`, `mix`, `tint`, `shade`, `alpha`, `hsl`, `withHsl`, `rotateHue`, `saturate`, `lighten`, `ramp`, `harmony` |
| palettes | `PALETTES`, `PAL`, `usePalette`, `makePalette`, `derivePalette`, `duotone` |
| random, easing | `rng(seed)`, `hash(k, seed)`, `noise1(x, seed)`, `drift(t, seed, {amp, freq})`, `easeIO` (cubic), `easeOut`, `easeIn`, `easeOutQuint`, `easeInOutQuint`, `easeInOutSine`, `easeOutExpo`, `easeOutBack`, `easeInBack`, `easeOutElastic`, `sm(a, b, t, ease)`, `flicker(i, period)`, `pulse(i, every, hold)`, `twos(tau)` |
| motion | `key(t, keys, ease)`, `keyPath(t, keys, {ease})`, `spring(t, {freq, damp})`, `settle(t, t0, {amp, freq, decay, phase})`, `anticipate(a, b, t, {back, hold, e})`, `arc(a, b, u, lift)`, `squash(k)`, `breathe(t, period, phase)`, `camKeys(c, tau, keys, {ease, hand, seed})`, `smear(c, n, span, draw)` (see `motion.md`) |
| geometry | `ellPts`, `ellPath`, `circPath`, `rectPath`, `rectPts`, `roundRectPath`, `polyPath`, `pathLength`, `bez`, `layer(w, h)`, `cam`, `resetT`, `blit(c, layer)` |
| organic forms | `blob(cx, cy, rx, ry, seed, {amp, rot, n})`, `smoothPts(pts, close, step, corner)`, `curvePath(pts, close, corner)`, `warp(pts, seed, amp, close, step)` |
| marks | `wob(c, pts, amp, seed, close, {pressure, smooth, corner, freq})`, `crayon`, `hatch(c, path, box, opts)` (`flow`, `curve`), `grain`, `scribble`, `cross`, `construction`, `squiggleText`, `handText` |
| finishes | `surface(c, path, box, opts)`, `dotScreen`, `plate()`, `printPlate`, `paper`, `night` |
| lattices, particles | `hexPath`, `hexCells`, `hexLattice`, `aster`, `dotBurst`, `speedLines`, `loops` |
| motifs | `seedDot`, `ripples`, `dashedRing`, `dottedArc`, `plant`, `tornEdge`, `section`, `stickyNote`, `thread`, `signOff` |
| reveals, composition | `selfDraw`, `blot`, `iris`, `mosaic`, `montage`, `badges`, `flash`, `smear` |
| photos, doodles | `registerPhoto`, `PHOTOS`, `place`, `on`, `onAll`, `photo`, `photoFront`, `photoSheet`, `backdrop`, `nightfall`, `glow`, `chalkPalette`, `pastel`, `PASTELS`, `spline`, `splinePath`, `brush`, `wash`, `gouache`, `boil`, `doodle`, `pen`, `nightShot`, `rim`, `setView`, `viewT`, `whip` (see `doodle.md`) |
| found motion (`assets/roto.js`) | `registerClip`, `CLIPS`, `roto`, `rotoPose`, `rotoSprite`, `drawSprite`, `rotoGap`, `rotoAirborne` (see `found-motion.md`) |
| sand (`assets/sand.js`) | `sandFilm`, `sandFrame`, `sandAdvance`, `sandImage`, `sandRender`, `sandLive`, `sandLook`, `sandTint`, `sandToScreen`, `sandScale`, `G.*`, `scanFill`, `circlePts`, `spiralPts` (see `sand.md`) |
| paper in space (`assets/paper3d.js`) | `cam3`, `proj3`, `tex3`, `quad3`, `shadeOf`, `shadow3`, `shadowsBegin`, `shadowsEnd`, `book3`, `V3` (see `paper3d.md`) |
| sheets | `styleSheet`, `paletteSheet` |
| runtime | `defineFilm({palette, timeline, score, format, fps})`, `gridSheet(n, cellW)`, `note`, `noiseBurst`, `pentHz`; hooks `window.__frame(i)` (PNG data URL, cached when the frame equals the last one), `window.__grid(n)`, `window.__size`, `window.__fps`, `window.__wav()` (base64 WAV of the score), `window.__ready` (set after every registered photo has decoded) |

Signatures worth knowing by heart:

```js
surface(c, path, box, { finish, color, seed, density, angle, gap, len, alpha, width, grain, cell })
hatch(c, path, box, { angle, gap, len, jitter, color, alpha, width, seed })
dotScreen(c, path, box, { cell, color, density /* number or (x,y)=>0..1 */, angle, jitter, seed, alpha, square })
printPlate(c, plateCanvas, { cell, ink, angle, jitter, seed, gain, maxCov, blend, al })
scribble(c, path, cx, cy, { colors, amp, alpha, width, seed })
construction(c, cx, cy, R, seed, color, alpha)
blot(c, srcLayer, cx, cy, R, seed, fringeColor)     // screen coords
iris(c, cx, cy, r, fn, outsideColor)                // fn(c) draws inside the circle
montage(c, cards, tau, per, i)                      // cards: [(c, tau, i) => void]
badges(c, cards, { cx, cy, r0, gap, size, ring, seed, progress, count, scale })
signOff(c, a, b, { x, y, size, ink, ink2, progressA, progressB })
```

`box` is `[x, y, w, h]` bounding the path in the same coordinates as the
path. It bounds the hatch or dot grid; a box that is too small leaves bare
patches, one too large only costs time.

## Building a character

For the default hand-drawn character, read [redrawn-animation.md](redrawn-animation.md)
and `examples/sketchbook-bird.html`. Author complete keys and breakdowns with
semantic stroke ids and an exposure sheet. Keep gesture, contour, overlaps and
local hatching together in each drawing. `cels.js` compiles graphite/ink marks;
assisted inbetweens require matching landmarks and topology.

A rig can support construction, repeated travel and contact solving. Redraw the
visible outline around bent limbs and changing views; rotating oval pieces with
grain over them does not satisfy the default sketch direction. The bug template
and weight study remain useful rig/API examples. Use them as the visual model
only for an explicitly chosen cutout or procedural-puppet treatment.

Keep each exposed drawing and its material pattern stable for the hold. Camera
movement is separate; inspect their combined screen motion. Blueprint and
construction-line modes are optional story devices.

## Riso plates

```js
function card(c) {
  paper(c);
  const inks = PAL.inks.slice(0, 3), angles = [.26, 1.31, 0];
  inks.forEach((ink, k) => {
    const P = plate(), g = P.getContext('2d');   // white plate, draw coverage in black
    g.fillStyle = '#000';
    if (k === 0) { /* blue shapes */ }
    if (k === 1) { /* pink shapes */ }
    if (k === 2) { /* yellow shapes */ }
    printPlate(c, P, { cell: 7, ink, angle: angles[k], seed: 30 + k });
  });
}
```

Grey on a plate is partial coverage; a canvas gradient on a plate becomes a
dot-size ramp; white on a plate is a knockout. Print order is the palette's
`inks` order; the darkest ink last. Overlaps multiply, so blue over yellow is
green and pink over blue is purple, which is how the reference gets six
colours from three inks.

## Performance budget (offline render)

| thing | budget |
|---|---|
| one drawn frame | 50 to 300 ms |
| hatch or dot screen layer | one `beginPath` + one `stroke`/`fill`, up to ~50k segments |
| `printPlate` | one `getImageData` on a 160 px coverage map plus ~25k arcs per plate; three plates per card is fine |
| grain | ≤ 8k rects per layer |
| mosaic cell | ≥ 12 px |
| static heavy layer | draw once per scene into a cached layer, then `drawImage` |

Cache pattern:

```js
const cache = {};
function sceneRoom(c, tau, i) {
  if (!cache.room) { cache.room = layer(); drawRoomStatic(cache.room.getContext('2d')); }
  resetT(c); c.drawImage(cache.room, 0, 0);
  // moving things on top
}
```

## Rendering

- One frame in a browser: open `<film>.html?frame=37` (with the player),
  `<film>.html?grid=24` (a sheet of 24 evenly spaced frames), or add
  `&bare=1` for the canvas alone.
- First look without a window: `node render.mjs <film>.html --grid 24` writes
  `out/<film>-grid.jpg` in a few seconds. Look at it before anything else.
- Spot check: `node render.mjs <film>.html --only 0,37,74` writes
  `out/<film>-frames/NNNN.png` and stops.
- Full render: `node render.mjs <film>.html`. One headless Chrome through
  `puppeteer-core`, every frame exported from the canvas, then ffmpeg packs a 24 fps
  mp4 (duplicating only an explicitly 12 fps film) and builds `out/<film>-contact.jpg` with two tiles per second.
  A frame that throws is reported with its number and time, and no mp4 is
  built. If the film defines a score, the page renders it through an
  `OfflineAudioContext` and the script writes `out/<film>-score.wav` and
  `out/<film>-final.mp4`.
- Photos for the doodle look are data URLs inside `photos.js`. A photo loaded
  from a file path would taint the canvas and `toDataURL` would throw.
- Frames come from `canvas.toDataURL`, not from screenshots. Do not spawn one
  Chrome per frame with `--screenshot`; it hangs on the second frame.
- Manual packing of PNGs exported from the page:
  `ffmpeg -framerate 12 -i %04d.png -r 24 -pix_fmt yuv420p -crf 18 out.mp4`.
- Remotion, if the project already uses it: call `drawFrame` from a component
  on a canvas ref with `useCurrentFrame()`; `fps: 24` and
  `drawFrame(Math.min(__NDRAW - 1, Math.floor(frame * __fps / compositionFps)))`.
  At 24 fps in both places, pass `frame` directly.

## Pitfalls

- `Math.random` anywhere → boiling textures. Use `rng(seed)`.
- A `stroke()` per hatch segment → seconds per frame. One path per layer.
- Forgetting `resetT(c)` (or `paper`/`night`, which reset) before a
  full-frame fill → the background lands in world space.
- `clip` without `save`/`restore` → every later draw is clipped.
- `selfDraw` needs the real perimeter for the dash pattern; `pathLength`
  computes it.
- `getImageData` fails on a canvas that ever drew a cross-origin image. Use embedded or same-origin assets and await image decoding.
- Ghost copies at alpha 0.34 each stack to near-opaque; divide by the count.
- The in-page PNG export needs a click (File System Access API); automated
  renders go through `render.mjs`.
- `blot`, `iris`, `mosaic`, `badges` work in screen coordinates and reset the
  transform themselves; pass screen-space centres.
- A mosaic of a navy blueprint frame samples mostly navy; mosaic the colour
  frame.
- Plates without knockouts tint the subject with every sky; paint the
  subject white on the plates that should not touch it.
- `printPlate` with `maxCov` 1 and three plates gives a muddy full-bleed;
  keep the default 0.78 and leave paper in every card.
- `handText` and `signOff` depend on the host's fonts (`HAND_FONT` falls
  back to `cursive`); check the render on the machine that produces the
  final file.
- A literal `540` in a scene is a bug waiting for the first vertical render;
  use `CX`, `CY`, `W`, `H`.
- `drawImage(layer, 0, 0)` draws the layer at output-pixel size; under a
  scaled format it lands wrong. Use `blit(c, layer)` or pass `W, H`.
- Loading `core.js` twice, or redefining `W`, `H`, `PAL` in the film, throws
  at load: top-level `const`s are shared across classic scripts. The same for
  a film's own `key`, `arc`, `drift`, `spring`, `hash` or any other core name:
  the page never sets `__ready` and `render.mjs` waits until it times out.
- `wob` on a rectangle keeps the corners; `wob` on a dense polyline curves
  it. A polyline that must stay angular (a lightning bolt, a saw) passes
  `{ smooth: false }`.
- `pressure` strokes one segment at a time. Fine for outlines, wrong for a
  hatch or a lattice: those stay single-path.
- `drift` and `breathe` through `twos()` step visibly. Choose exposure deliberately; do not quantize twice.

## Optional production modules and verification

Copy assets/studio.js and assets/cels.js beside core.js for whole drawings.
Add assets/materials.js when using the optional material helpers. Their signatures and constraints are in studio.md. The
frame callback's `i` remains a 12 Hz compatibility index; use tau or an exposure
track for new actions. Existing no-fps films now sample at 24 fps; set fps:12
explicitly to preserve their previous cadence. Runtime resets the base palette
on every frame, so a palette switch must be explicit in each scene.

The renderer supports --strip START,COUNT for consecutive-frame QA. Full renders
stage new frames, limit encoded duration and replace only the named film's
outputs after success. Failed staging directories are retained for diagnosis.
The -render.json sidecar records dimensions, frame counts, cadence and duration.
--ar is an override, not a default that replaces defineFilm.format.

Run node scripts/verify.mjs for regression checks. Preserve a pinned Chrome and
font environment when comparing exact pixels. Numerical checks do not certify
acting or drawing quality.
