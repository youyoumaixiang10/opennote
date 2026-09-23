# Found motion: real movement, redrawn stroke by stroke

The doodle look takes an object out of the world. This takes a movement out of
it. A sequence of frames (a public-domain motion study, a clip, a video the
user shot) is traced into vector strokes by `scripts/roto.py`, and the film
redraws those strokes with the core's brush, one pose per drawn frame. The
motion is real; every line on screen is still drawn by code.

Worked example: `examples/gallop.html` with `examples/gallop-clips.js`.

Read this file whenever the brief says a real animal or person has to move,
or names rotoscope, Muybridge, motion study, or "make my video a cartoon".

## Where motion comes from

| source | licence | what you get |
|---|---|---|
| Eadweard Muybridge, *Descriptive Zoopraxography* (1893), animated GIFs on Wikimedia Commons | public domain | 12 poses per clip, drawn in pen from his photographs for the zoopraxiscope discs: horse, elephant, kangaroo, pigeons, elk, camel, lion, dancers, athletes |
| Muybridge, *Animal Locomotion* (1887) plates and their animations | public domain | photographs, use `--kind dark` |
| Marey's chronophotography | public domain | one plate, several exposures; cut the poses apart first |
| the user's own video | theirs | `ffmpeg -i clip.mp4 -vf fps=12 frames/%03d.png`, then `--kind dark` or `--kind light` |

Wikimedia rate-limits bulk downloads: fetch one file at a time with a real
User-Agent and pauses, and stop on a 429 rather than retrying in a loop.
Record the file page and licence of everything you use.

## Tracing a clip

```bash
ffmpeg -v error -i horse.gif -vsync 0 work/horse/%03d.png
python3 roto.py work/horse --name horse --kind disc --drop-last \
  --credit "Eadweard Muybridge, Descriptive Zoopraxography (1893), public domain" \
  --source https://commons.wikimedia.org/wiki/File:...
```

It appends one `registerClip("horse", {...})` line to `clips.js` and writes a
check sheet to `out/clip-horse.jpg`. Look at the sheet: every pose must be one
clean figure with its inner strokes, standing on the blue ground line.

| flag | what it is for |
|---|---|
| `--kind disc` | a zoopraxiscope disc window: several figures on a grey card, the disc's edge curving through it |
| `--kind dark` / `--kind light` | one figure, dark on light or light on dark, after `--thr` |
| `--thr 120` | ink threshold; lower it when the ground is dark (the buffalo card needs 80) |
| `--close 7` | how far apart outline strokes may be and still make one silhouette |
| `--drop-last` | the last GIF frame repeats the first pose (most Commons animations do) |
| `--no-ground` | flying things: there is no ground stroke to register on |
| `--tol`, `--maxlines`, `--minline` | simplification; raise `--tol` for fewer points |
| `--verbose` | says which sector was rejected and why |

What the disc mode does, in case it needs fixing: it fits a circle to the
disc's edge, measures the angle between neighbouring figures from the
autocorrelation of the angular ink histogram, finds the phase of the gaps in
every frame and follows it through the clip, keeps the sector that stays whole,
and rotates it upright about the disc centre. Then it finds the artist's own
ground stroke under the feet by a line fit, erases it, and registers every pose
on it, so a pose that is airborne really is airborne.

Clips that fail ("no figure stays whole through the clip") have figures that
touch on the card. Try `--thr` and `--close` first; if they still touch, pick
another clip rather than fighting it.

## Drawing with a clip

```js
rotoAt(c, 'horse', tau, { x: CX, y: CY + 260, h: 470, wash: PAL.fills[0], seed: 5 });
```

| call | what it does |
|---|---|
| `roto(c, name, k, o)` | pose `k` with its feet at `(x, y)`, `h` units tall. `o`: `flip`, `rot`, `fill` (gouache body, `null` for none), `wash` (watercolour), `ink`, `weight`, `al`, `maxLines`, `p` (0..1 draws the strokes on, longest first), `seed` |
| `rotoSprite(name, k, h, o)` + `drawSprite(c, sp, x, y, o)` | the pose rendered once into a cached layer; use it for many small copies (a contact sheet, a disc, a crowd) |
| `rotoGap(name, k)` | how far pose `k` is off the ground, in clip pixels |
| `rotoAirborne(name)` | the pose that is highest off the ground |
| `rotoPose(name, k)` | the raw `{ outer, lines }` of a pose, for feeding another engine (the sand film runs the horse's silhouette through `sandLive`) |

- **Time-based playback.** rotoAt(c,name,seconds,{speed,offset,loop,...})
  samples using the clip's source fps. offset is seconds, speed defaults to 1,
  loop defaults to true. Use loop:false to clamp at the ends. roto(c,name,k)
  still takes a pose index; passing legacy i assumes the clip is 12 fps.
- **The clip keeps its own ground.** `y` is where the feet touch; a pose in the
  air lifts itself. Never re-centre a pose by hand.
- **It is a drawing, not a cut-out.** Give it a `wash` in the film's palette,
  or `fill: null` for a wiry line, and it belongs to the same world as the rest.
- **`p` draws it on.** Strokes arrive longest first, so a pose can be drawn in
  front of the viewer in half a second.

## What to make of it

The strength of the method is that the motion is a fact and the story is about
that fact. The example film asks Muybridge's question (do all four hooves leave
the ground), lets the poses answer it, then puts them back on the disc and
spins it until the horse runs again. Other true stories that come with their
own motion: an elephant's walk, a bird's wingbeat, a child's run, a dancer.

- One pose per shot as a still is worth as much as the loop. The airborne frame
  is a poster.
- Twelve poses tile into a card gallery, a disc, a strip, a flipbook.
- A real stroboscope: spin a disc of the 12 poses by exactly one pose per drawn
  frame and the figures stand still and run on the spot. That is arithmetic,
  not an effect.
- Two clips at different speeds in one frame make the scale of two animals felt.

## Defects specific to this method

- a pose re-centred by hand, so the figure bobs on a flat ground;
- source cadence accidentally doubled or halved; choose exposure deliberately;
- silhouettes with no `wash` or `fill` over a busy background;
- a source with no recorded licence, or a Wikimedia fetch that hammers the API;
- a check sheet never looked at: the commonest failure is two figures merged
  into one and nobody noticed.

## Tracing limits

Dark/light threshold tracing produces external silhouettes, not reconstructed
facial features or anatomy. roto now outlines these silhouettes when no internal
lines are present. Disc mode retains traced internal strokes. Neither mode
provides semantic tracking or automatically corresponding strokes across frames.
Inspect topology changes and occlusions; redraw key views when tracing fails.
Do not interpolate unrelated contour vertices. Source motion is useful timing
reference, not a guarantee of good character design.
