# Sand on a light table

Every other method redraws the frame from nothing. This one does not: the film
is a bed of sand on a backlit sheet of glass, and it remembers. A hand pours
sand, sprinkles it, wipes it away with a fingertip, sweeps it with the palm,
combs it, and wind blows it sideways. Sand pushed aside piles into ridges beside
the stroke and slumps into cones. One picture becomes the next without a cut,
because it is made out of the one before it.

Worked examples: `examples/one-seed.html` (everything the medium does: a camera
over a table wider than the frame, wind, rain, snow, seasons in the lamp),
`examples/one-year.html` (the plain case, one take at a fixed camera) and
`examples/paper-horse.html` (a page of a book that is a light table).

Read this file whenever the brief says sand, sand animation, a hand drawing in
something, one continuous take, or a film with no cuts at all.

## How it works

A `Float32Array` of sand thickness, `N` by `N` cells over a square table of
`world` units. Gestures are declared once, with times in seconds; the bed steps
at a fixed 1/48 s. `drawFrame` stays a pure function of the frame number because
a request for an earlier time rebuilds the bed from the first gesture.

```js
sandFilm({ gestures: [ ... ], N: 540, world: 1080 });          // at file scope
function scene(c, tau, i) { sandFrame(c, tau); }                // the whole scene
```

Nothing else is needed for a plain film: with the default camera, world units
are frame units.

A film can also start on a table that is already covered:

```js
sandFilm({ gestures, N: 1300, world: 3000, init: sandCover({ box: [220, 560, 2100, 2460], amount: 1.9, grain: .7 }) });
```

That is the strongest opening the medium has. A dark table under a cold lamp, a
fingertip taking a picture out of it in light, then the palm wiping it all back
to bright glass. `examples/one-seed.html` opens this way for five and a half
seconds before its story starts. Keep the covered box inside what the wipes
will clear, or its edges show up later when the camera pulls back.

## Gestures

```js
G.pour(t0, t1, pts, { r: 10, amount: 1.6 })      a stream from the fist: dark lines, trunks, letters
G.sprinkle(t0, t1, pts, { r: 120, amount: 1.2 }) a cloud from the fingers: skies, ground, crowns
G.finger(t0, t1, pts, { r: 9, strength: 1 })     a fingertip clearing a line down to the light
G.palm(t0, t1, pts, { r: 70, streaks: .4, keep: 1 })  a sweep; keep < 1 carries sand off the table
G.comb(t0, t1, pts, { fingers: 4, spacing: 26 }) several fingers at once: water, fields, fur
G.dab(t, x, y, { r: 6, hand: null })             one touch; hand: null for a mark nobody makes
G.fill(t0, t1, poly, { tool: 'pour' | 'finger' })  a snake that covers a polygon
G.wind(t0, t1, { box, vx, vy, strength, lift, turb })   the top layer creeps; no hand in shot
G.fly(t0, t1, pts, { r, light, wob, land })      a grain, a seed, a flake in the air; it lands as a pour
G.move(t0, t1, pts, { hand: 'palm' })            the hand goes somewhere and touches nothing
```

A film is easier to keep in order with a running clock:

```js
let T = 0; const go = (dur, make, gap = .08) => { const g = make(T, T + dur); T += dur + gap; return g; }, at = t => { T = t; return []; };
const GESTURES = [ at(.2), go(.6, (a, b) => G.sprinkle(a, b, row(110, 1), { r: 240 })), go(.7, (a, b) => G.pour(a, b, TRUNK, { r: 15 })) ];
```

`scanFill(poly, spacing, angle)`, `circlePts`, `spiralPts` and `sandPath` /
`sandPoint` build the paths. A word is poured as one stroke per letter: the
examples carry a little single-stroke alphabet, copy it.

## Rules of the medium

- **Dark is sand, light is glass.** To make something dark, pour or sprinkle it.
  To make something light, wipe it. A light shape on a light sky is invisible,
  so put a dark sky behind it first.
- **Draw by taking away.** A line wiped out of a covered table glows, gets a
  soft dark berm on both sides and a ragged edge where grains break off
  unevenly. It is the picture people remember from sand animation. A layer of
  about 2 reads as dark sand and still shows its grain; 3 and more is flat black.
- **Nothing disappears.** Sand a fingertip moves ends up beside the stroke. Plan
  those ridges as part of the picture: a swept sky leaves the horizon, a swept
  ground leaves a dune. When you really want sand gone, sweep with
  `keep: .05` and the hand carries it off the table.
- **Sprinkle for air, pour for line.** `sprinkle` is a cloud of grains with soft
  edges; `pour` is a solid stream that reads as ink.
- **The hand is the clock.** It is a soft shadow, it travels between gestures,
  and it lifts between them. Two gestures in different corners 0.2 s apart look
  wrong, because one hand cannot be in both places.
- **Watch the frame, not the plan.** Render `--grid 24` often: the bed's state
  is the sum of everything before it, and one heavy sprinkle changes every shot
  that follows.

## Camera, colour, air

| call | what it does |
|---|---|
| `sandLook(x, y, w)` | the window of the table that fills the frame, in world units. Make `world` bigger than the frame (2600, say) and the camera can push into a single grain and pull back to a whole landscape. `sandLook(null)` is the whole table. |
| `sandTint([r, g, b])` | multiplies the lamp under the glass. `[1, 1, 1]` is neutral, `[1.05, .9, .72]` is candlelight, `[.62, .72, 1.1]` is night. |
| `G.wind(...)` | drama without a hand: the top layer creeps along, thin sand first, and drifts pile up against whatever stands in the way. |
| `G.fly(...)` | a seed, a spark or a flake drawn over the bed while it travels; it lands as a small pour and is part of the bed from then on. Snow over a dark sky wants `light: true`. |
| `sandImage(w, h, live)` | the bed as an `ImageData` of any size, which is how a page of the pop-up book becomes a light table. |
| `sandLive(polys, ridgeW, lines)` | a shape that runs through the sand without changing it. The silhouette is cleared and its strokes are heaped. Feed it `rotoPose(...)` and a found-motion animal runs through the sand. |

The camera makes the medium cinematic, and it is the one thing to plan first. A
push from a whole table down to a 300-unit window costs nothing and turns a flat
drawing into a shot.

A gust fades out over `feather` units at the edges of its box (160 by default).
Without that it cuts a straight line through whatever it reaches, which is the
first thing that goes wrong with wind. Give a gust across a drawing a feather of
300 or more, and keep the box well outside what it blows.

Wind takes the top layer only, so its strength has to be small or it eats the
drawing: `strength: .08` with `lift: .85` thins a sprinkled crown over two
seconds and leaves the poured branches standing, while `strength: .4` strips the
whole tree. A second, faster wind in the empty air above carries what the first
one lifted, and that is what reads as a gust.

## Score

Sand is loud. Give every gesture a hiss: white noise through a bandpass, opened
and closed on the gesture's own times, quiet for a fingertip (3600 Hz), broad
and low for a palm (1800 Hz), thin for a pour (5200 Hz). Both examples do this
in six lines, copy them. Under it a slow piano on the pentatonic, and silence
where the hand stops.

## Defects specific to this method

- a shape wiped into pale sand where nothing shows;
- a stroke that leaves a ridge across something that was already drawn;
- a hand that teleports between gestures, or a gesture with the hand still in
  the way of the payoff;
- the table swept clean without `keep`, leaving black bars;
- camera motion that weakens readability or exposes insufficient material detail;
- letters poured with a wide `r` (they close up and turn into blobs);
- repeated unnecessary backward seeking during sequential rendering. The engine
  retains up to 12 two-second state checkpoints to make interactive seeking cheaper.

## Material and verification

The output cadence defaults to 24 fps while simulation stays at fixed 1/48 s.
Grain is sampled in table coordinates, so a camera move no longer leaves a
screen-fixed grain overlay behind. It is a procedural microstructure, not a
tracked simulation of individual grains under wind. Wipe redistribution is
normalised; keep controls the fraction retained, with material carried off at
table boundaries when there is no receiving region. Check mass away from edges.

sandLive is an artistic overlay that does not move the bed. Use it for a magical
transformation, not as evidence of physical grain transport. Test close-up pour,
wipe, residue and camera movement before expanding a continuous story.
