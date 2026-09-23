# Scene recipes, timing, score

Each recipe: what happens, camera, kit calls, duration. Chain 8 to 14 of them.
Recipes A to M come from the fruit-fly film, N to Z from the flipbook, the
paper boat and the website. `examples/four-looks.html` implements N, O, P, S,
U, W, X and A in 13.5 seconds; `examples/fly-style.html` implements A, B, C,
D, E, G and H.

## Ink look

**A. Establishing shot on a textured surface (1.5 to 2.5 s).** Ground is a
huge circle far below the frame (top edge at about a third of the height),
`surface` with a light hatch layer, a blush cross-hatch layer through a second
clip circle, grain, wobbly rim. Puppet at 1.6 to 1.9x with `construction`
overlay. `cam` push-in from 1.15 to 1.3 with `easeIO`. `pulse(i, 8)` twitch.

**B. Ink blot into blueprint (0.6 to 0.8 s).** `L1` = the current frame,
`L2` = the same composition in blueprint mode. `blot(c, L2, cx, cy, R, seed)`
with `R = lerp(0, 1000, sm(t0, t0 + .8, tau, easeOut))` centred on the subject.

**C. Spark, construction, self-drawing outline (1.2 s).** `aster` with `g`
0 to 1 over 0.3 s; `construction` alpha ramp over 0.4 s; `selfDraw` over
0.4 s; `hexLattice` fades in inside the shape.

**D. Doubling particles (1.5 to 2 s).** Cue times every 0.3 s, count `2^k`,
seeded positions inside the shape, spindle lines between siblings for 0.15 s
after each cue, a lineage tree in a corner.

**E. Bands (0.8 to 1.2 s).** Count 1 to 7 every ~0.11 s, flat accent rects
plus grain inside `clip(shape)` in the shape's local frame.

**F. Macro insert (2 drawn frames).** Same scene, `cam` zoom 4 to 6 on a
detail. Hard cut in, hard cut out.

**G. Camera-follow travel (2 to 3 s).** Cubic Bézier path, heading from the
derivative, camera centre = position + 120 px lead, `speedLines` seeded by
frame, `loops` fixed seed, hatched shadow, ghost limbs, cached background.

**H. POV mosaic (0.6 to 1.2 s).** Scene in a layer, `iris` clip,
`mosaic(c, L, s)` with `s` from 40 down to 13, chalk rim; optionally
`flicker(i)` with the clean frame.

**I. Network (1 to 1.5 s).** Thousands of particles on seeded arcs, two
accent clusters with `aster`, slow `cam` rotation, night background.

**J. Impact (0.5 s).** `flash` for one frame, then a filled blob and 30
droplets, then a hold with red `construction` circles.

**K. Vibration (1 s).** Zig-zag polyline (thick dark under thin chalk),
concentric circles from the source every 3 drawn frames.

**L. Time passing (1 to 2 s).** Sun disc on an arc, tally marks one per 3
drawn frames, `flicker` between day and dusk paper.

**M. Coda (1.5 s).** Night, two `aster` sparks, the subject as a hatched
silhouette fading.

## Riso look

**N. Seed dot and ripples (1.5 to 2.5 s).** `paper`, `seedDot` at centre. A
new ring is born every 4 drawn frames and travels outward at ~260 px/s:
`crayon(c, ellPts(cx, cy, r, r, 0, 48), ink, 4, seed + b, true)` alternating
two accents. Rings past the frame are dropped. Optionally `iris` opens on the
first card during the last 0.7 s, with a wobbly ring on its edge.

**O. Card montage (2 to 8 s).** `montage(c, CARDS, tau, .25, i)`: one card
per 3 drawn frames, hard cuts, the seed dot drawn on top of every card. Each
card is a `risoCard`: three plates (blue, pink, yellow) drawn in black on
white, printed with `printPlate` at angles 15, 75 and 0 degrees. Design a card
as silhouettes with knockouts: the subject white on the plates that should not
tint it, the sky on one plate only, gradients only as radial glows. A card
must read at 120 px. Eight cards are enough for a beat; the reference uses
about forty.

**P. Badge gallery (1.5 s).** `badges(c, CARDS, {progress, scale})` on a
paper with a faint yellow `dotScreen` (density 0.16). Badges grow in over
0.5 s (`easeOut`), hold, then the whole ring scales to the seed dot over 0.5 s
(`easeIn`). Cards render once and are cached.

**Q. Duotone beat (0.5 to 1 s).** `usePalette(duotone(inkA, inkB))` for
one or two cards, then back. Same cards, two inks: the audience reads it as a
print run.

**R. Starfield with circled dots (1.5 s).** `night` in the purple-navy,
`grain` in three accent colours, twenty small dots with `dashedRing`s that
expand from the seed, a few `aster`s. Constellation logic: connect two dots
with a thin line for one drawn frame.

**S. Sign-off (1.5 s).** `signOff(c, 'name', 'second', {progressA, progressB})`
on paper with faint `ripples`. Letters appear over 0.6 s, the second word
over the next 0.6 s, hold. Font varies by machine, check the render.

## Screen look

**T. Constant protagonist (whole film).** One puppet, drawn the same size at
the same spot, while the world cuts around it 20 to 30 times. Each world is
2 to 5 flat shapes with `surface` dot screens and one accent. Never move the
protagonist between shots; move the horizon.

**U. Flat landscape, day and night (1 to 2.5 s each).** Day: `paper`, sun
disc with a dot screen, mountains as one `polyPath` with `dotScreen` in a
neighbour fill, a band of reeds (dot screen plus 90 thin `wob` stalks),
water as a rect with a darker dot screen, white wake dashes. Night: `night`,
moon with a chalk-dim screen, a hill silhouette, a window with a radial
`dotScreen` glow (`density: (x, y) => 1 - dist / r`), water in the darkest
fill. The cut between them is the beat.

**V. Origami setup and payoff (1.5 s each).** On a desk (orange fill with
40 wobbly grain lines), a sheet with `squiggleText` lines; fold states as
hard cuts every 3 drawn frames: sheet, triangle, diamond, boat. At the end
the boat unfolds back into the written sheet, same cuts reversed.

## Pencil look

**W. Page with torn sections (2 to 3 s).** `paper`, a `squiggleText` wall of
6 rows, a small `handText` label, a `stickyNote` with a spiral, then
`section(c, y, PAL.fills[0])` rising from the bottom over 0.8 s with `plant`s
on its floor, then a second `section` in `PAL.night` rising with `dottedArc`s
around a centre, `dotBurst`s and a thin blueprint puppet. `thread` over
everything.

**X. Dark section devices (1.5 s).** On `PAL.night`: `dottedArc` rings every
42 px around a still centre (`aster` or a boat), `dotBurst`s of 12 rays in an
accent, a line-drawn figure in `PAL.chalk` at 0.9 px, a `handText` caption
in `chalkDim`. Stars are `grain` at alpha 0.5.

**Y. Pattern sampler (1.5 s).** A grid of 4 x 4 cells, each a different
lattice or mark (`hexLattice`, `dotScreen`, `dottedArc`, `squiggleText`,
`hatch` at four angles). Cells fill one per drawn frame.

**Z. Enso (1.5 s).** `selfDraw` of a thick circle around a thin figure
outline, then `paper` colour dims to `chalk` over the last 0.5 s.

## Doodle look

Full method in `doodle.md`; these are the shot types. Each is 1.5 to 4 s: the
object alone for a few frames, drawings arrive from several pens, a gag in the
last third.

**AA. The object becomes a vehicle.** Photo rotated if needed (`rot`), mast,
sail and crew placed with `on(pl, u, v)` so they bob with it, water drawn over
the hull (`fill` then `wash`), foam along the waterline. `shadow: 0`.
**AB. Someone lives inside.** Characters drawn after the photo, then
`photoFront` with a lip path lays the front wall back over them. They rise
into view with `y + (1 - up) * 70`.
**AC. The object does its job, at last.** It tips over its base (`pivot`,
`rot`), rings, pours or lights; the drawn world responds: a stream from the
spout tip, steam that turns into a heart, a character with a cup.
**AD. Time passes on it.** A drawn hand sweeps a real dial (`brush` from the
hub, angle from `tau`), a drawn sun crosses the sky with it, the character
falls asleep at the end.
**AE. Night falls.** `photo`, `nightfall`, `glow` on the flame,
`chalkPalette()`, stars, then a second character walks in already drawn
(`start: -9`, x from `sm`).
**AG. The light escapes.** `nightShot` with one light on the runaway. It
hops out of the lamp (`hop(a, b, t, height)`), the pool goes with it and the
lamp goes dark behind it.
**AH. Along the edge.** Both runners take `rim(pl, side, v)` with a delay
between them, a note or a mark pops where each step lands, the camera
follows the midpoint.
**AI. Inside the tube.** The runner disappears into the object; only the
light travels along it (`on(pl, .5, v)`), then it bursts out of the far end
with a recoil of the photo, rings, a big word and a zoom kick.
**AJ. The object looks back.** Two small red lights behind the eye and the
jaw of a helmet, a roar (shake, zigzags, the camera punches in), the
follower's quills stand up, then the runaway pops out laughing.
**AK. Getaway.** The photo itself gallops (x from `tau`, bounce from
`|sin|`), dust puffs and speed lines behind it, the view travels with it and
drawn milestones pass by.
**AL. Caught, then let go.** The light dims in the jar (`r` shrinks), one
held beat with no music, the lid tips (`pivot`, `rot`), it shoots up and `k`
starts to fall.
**AM. Sunrise.** A semicircular object rises behind a drawn hill that is
painted over it, rays draw on, `k` goes to 0.
**AF. Prints on a line.** The last frame of every scene rendered once into a
layer, hung as small prints on a drawn string, then `signOff`.

## Timing and editing

- Write the beat sheet first, as a table in a comment above the timeline:
  start, duration, scene, look, camera, what changes, kit calls, sound cue.
- Durations: establishing 2 to 2.5 s; interludes 0.6 to 1.2 s; action 1.5 to
  3 s; montage cards 0.25 s; screen-look worlds 0.5 to 1 s; inserts 2 drawn
  frames; sign-off 1.5 s. Total 15 to 30 s.
- All cue times on the 1/12 s grid. Cuts on drawn-frame boundaries.
- Camera eases (`easeIO`); particles move linearly; reveals use `easeOut`;
  collapses use `easeIn`.
- One flash at most twice per film. Never two transition devices in a row.
- A look change lands on a hard cut and lasts at least 1 s.

## Score

The score reads the timeline, so it cannot drift. `note(ac, master, hz, t0,
t, dur, type, gain)` is the building block; `pentHz(octave, step)` gives a
pentatonic pitch; `noiseBurst` is for impacts.

| scene type | motif |
|---|---|
| establishing, sea | slow pentatonic plucks, triangle, one every 0.5 s |
| blueprint interlude | 55 Hz sawtooth swell plus a sine an octave up |
| doubling, cues, cards | one short note per cue, rising through the pentatonic; squares at low gain for cards |
| travel | 1/8-note square arpeggio plus a sine pulse every 0.5 s |
| page, pencil | sparse sines an octave down, one per 0.75 s |
| impact | `noiseBurst` plus a 55 Hz sine |
| gallery, sign-off | a long sine dyad, 1 s release |

Master gain ≤ 0.6, every note released exponentially to 0.0008. Mux with
`ffmpeg -i out.mp4 -i score.wav -c:v copy -c:a aac -shortest final.mp4`.
