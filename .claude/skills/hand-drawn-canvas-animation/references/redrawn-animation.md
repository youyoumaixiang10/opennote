# Drawings that move

Use this workflow when the brief calls for a living sketch, pencil cartoon or
visible hand-drawn strokes. Start with the complete drawing of a pose. A rig can
help locate joints and contacts, but the finished silhouette, overlaps and marks
belong to that pose. The default character example is
[`sketchbook-bird.html`](../examples/sketchbook-bird.html).

## Author the performance

Choose a short action with an intention and a consequence. Draw its resting pose,
anticipation, change of balance, extreme, contact and recovery. Draw important
breakdowns too: where the head leads, how a wing unfolds, which hand passes in
front. Preserve character proportions while allowing the contour to change.

Work in three passes:

1. **Drawing:** silhouette, gesture, overlapping forms and gaze. Inspect the
   keys together at delivery size. A bent limb is a new continuous outline with
   creases and overlaps; visible rotating capsules will read as a cutout puppet.
2. **Timing:** place whole drawings on an exposure sheet. Inspect playback with
   the camera locked and sound off. Add only the inbetweens that improve spacing
   and clarity. Don't ease to a stop at every drawing or apply a spring to every
   recovery. Slow sections may hold one drawing; fast passages can use ones.
3. **Marks:** give contours pressure, taper, interruptions and selected second
   passes. Hatch according to volume and material. Recheck timing after marks
   are present: a detailed drawing has different visual weight from a silhouette.

Repeated whole-character transforms are useful for placement. Rotation of rigid
parts alone does not deliver this drawing language. Redraw head angles, hands,
compressed torsos and changes in occlusion. More noise cannot replace that work.

## Inbetweens and substitutions

Give corresponding strokes stable semantic ids, such as `back`, `near-eyelid`
and `wing/primary-3`. Match landmarks and point order deliberately. A point index
must represent the same part of the form on both drawings. Arc-shaped travel may
need a separately authored breakdown; straight interpolation can shrink a turn.

`inbetweenCel(a,b,u)` offers **assisted geometric inbetweens** between compatible
stroke drawings. Author the spacing values explicitly, inspect the results and
replace weak intermediates. It is not a learned animator, anatomical model or
automatic correspondence solver. Equal point counts do not establish a good
morph. New visible parts, a closed eye, a reversed overlap or a smear usually
need a separately authored cel, not a crossfade or transparent duplicate.

The bird example has nine whole-body keys, assisted inbetweens, a replacement
blink and a fixed background. It is a focused code-authored pencil/ink study;
it does not establish feature-film quality or performance in every medium.

## Make marks behave like marks

Use a few purposeful mark families: long contour gestures, short describing
strokes, local shadow hatching and sparse searching lines. Vary their length,
weight and density. Leave the illuminated side quieter. A regular field of
parallel curves around every shape looks like a wire mesh.

`compileCel` and `drawCel` in `cels.js` supply a graphite brush made of narrow,
interrupted passes, or a darker ink brush. There is no solid ribbon below the
graphite. They preserve authored corners and pressure. The existing
`makeStroke`/`drawStroke` remain useful for clean brush-pen ribbons; adding their
pencil deposits alone does not turn rigid vector geometry into a redrawn sketch.

Hold both geometry and marks for the entire exposure. A new drawing may change
pressure and a few edges, while the landmarks remain deliberate. Use a finite
set of redrawn hold variants only when the chosen reference calls for it. Never
feed the output frame number into every stroke seed to manufacture liveliness.
Paper stays registered to its chosen surface. Excessive grain can hide the line
in the compressed delivery even when a large PNG looks attractive.

## Cel API

Load `core.js`, `studio.js`, then `cels.js`. Geometry uses the core's logical
coordinates. The camera/output transform belongs to the caller.

```js
const rawA = {strokes: [
  {id:'back', points:[[0,0],[12,-8],[29,-5],[42,3]], width:1.8,
   opacity:.9, pressure:[[0,.1],[.3,1],[1,.1]]}
]};
const rawB = {strokes: [
  {id:'back', points:[[0,0],[10,-13],[29,-11],[44,0]], width:2,
   opacity:.9, pressure:[[0,.1],[.3,1],[1,.1]]}
]};
const drawings = {
  a: compileCel(rawA, {id:'a'}),
  ab: compileCel(inbetweenCel(rawA,rawB,.35), {id:'ab'}),
  b: compileCel(rawB, {id:'b'})
};
const sheet = exposureSheet([
  {id:'a',frames:12}, {id:'ab',frames:2}, {id:'b',frames:8}
], drawings, 24);
// In the scene: drawCel(c,sheet.at(tau).drawing,{material:'pencil'});
// Use sheet.duration for the scene duration.
```

- Stroke fields: unique `id`, `points`, optional `width`, `opacity`, `color`,
  `pressure`, `close`, `corner`. `corner` is the angular threshold in radians:
  default `Math.PI` is smooth; smaller values retain sharp turns such as a beak.
- `exposureSheet` uses integer output-frame counts. `atFrame(f)` or `at(seconds)`
  returns `{id,drawing,start,end}`. End is exclusive; out-of-range finite times
  clamp to the first/last drawing. Changing the frame rate changes duration.
- `compileCel` samples a drawing once. Its `id` seeds material marks, with no
  time argument. Reuse the compiled cel throughout a hold.
- `inbetweenCel` interpolates points, width and opacity. Stroke ids/order, point
  counts, closure, corners, pressure and colors must agree. Other topology or
  style changes should be authored as replacement cels.
- `drawCel` supports `material:'pencil'|'ink'`, global `color` and `opacity`.
  It draws strokes only. Add deliberately designed fills/print separations in
  the film when the medium calls for them; it does not import SVG documents.

Cache rendered cels when needed, keyed by drawing, material and output scale.
Keep the cache bounded for long films. Release cels from completed shots instead
of accumulating full-resolution layers for the entire production.

## Check the result

Inspect a still and consecutive strips, then the complete encoded action at
normal speed. Look for legible strokes at delivery size, convincing volume,
clean overlaps, held contacts and a clear change of intention. Watch with sound
off once; music can conceal awkward timing. A changing silhouette and visible
grain are not sufficient if the acting still feels mechanical.

For automated checks, verify exposure boundaries, unchanged held drawings,
deterministic forward/backward seeking and rejection of incompatible morphs.
These establish runtime behavior, not artistic quality. If normal-speed visual
review was unavailable, report that separately from successful MP4 export.
