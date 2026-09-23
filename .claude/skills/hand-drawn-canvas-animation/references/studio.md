# Production helpers

Load `core.js`, then `studio.js` and `materials.js`. These optional modules work
on Canvas 2D without runtime libraries. For the default redrawn character
workflow, also load `cels.js` and read [redrawn-animation.md](redrawn-animation.md).
`examples/weight-study.html` is a contact/IK mechanism study; its assembled
character is not the aesthetic reference for a pencil cartoon.

## Exposure and drawings

```js
const actingTime = exposureTrack([
  {at:0, on:2}, {at:1.5, on:1}, {at:3.5, on:2}, {at:6, hold:true}
]);
const faceDrawing = drawingTrack([{at:0,id:'three-quarter'}, {at:2,id:'profile'}]);
// In a scene:
const t = actingTime(tau);
const pose = actorAt(t);
cameraAt(tau);
drawActor(pose, faceDrawing(t));
```

Exposure keys are seconds aligned to output frames (24 fps by default). `on:2`
holds each pose two frames; `hold:true` freezes at that segment's start until
the next segment. Every segment restarts its own cadence. `drawingTrack` swaps
whole authored drawings; it does not interpolate incompatible silhouettes.
Keep camera/root/drawing exposure decisions explicit in tracking shots.

`motionPath(points,{smooth,closed})` builds a rest-space arc-length table.
`.at(u)` returns `{p,tangent}`; animate `u` with the intended spacing. This
separates shape of path from speed. `morphPoints(a,b,t)` requires matching point
counts and semantic correspondence; equal counts alone are not enough.

## Contacts

```js
const limb = solveLimb(shoulder, cupGrip, upperArmLength, forearmLength, 1);
// limb.root, limb.joint, limb.end; limb.error and limb.reachable
```

The solver preserves lengths and clamps unreachable targets. Choose bend side
per limb, inspect its entire path, and stage the body so contact targets remain
reachable. The zero-distance case is defined, but a limb folded exactly onto
its root has an ambiguous direction; avoid it in acting or author that pose.
Foot targets stay in ground coordinates; hand targets follow the prop. Switch
targets only at the planned contact/release frame. Never hide an IK error with
an unplanned elastic arm.

## Stable strokes

```js
const cheek = makeStroke([[0,0],[8,6],[18,5]], {
  id:'hero/cheek', width:2.5,
  pressure:[[0,.2],[.3,1],[.75,.8],[1,.15]], rough:.15
});
// Build once, draw repeatedly:
drawStroke(c, cheek, {color:PAL.ink, material:'ink', map:p=>deformCheek(p)});
```

`makeStroke` samples rest-space arc length once. `drawStroke` builds a variable
width ribbon, with optional pencil/dry deposits, progress and bounded redraw
variation (`boil`). Curves, width and grain preserve identities under `map`.
Apply object placement through the Canvas transform; `map` is for local
deformation. Width remains in local drawing units. Extreme deformations require
new drawings or an explicit width profile, not arbitrary stretching.

`smearPose(points,directionRadians,amount,pivot)` creates a directional stretched
shape. Author and inspect that single drawing at speed. It is different from
legacy `smear`, which composites ghost copies. No helper chooses the right smear
or fixes a poor key pose automatically.

## Materials

- `formHatch(c,path,restBox,{tone,direction,seed,spacing,length,width,opacity,color})`:
  persistent grid ids, nested density and short strokes following a direction
  field. `tone(x,y)` is 0..1, `direction(x,y)` is radians. Keep `restBox` fixed.
- `graphite(c,path,restBox,{tone,direction,seed,softness,color})`: layered thin
  hatching; an approximation, not a physical graphite solver.
- `screenFill(c,path,restBox,{color,paper,seed,wear})`: opaque print with restrained
  substrate-coloured imperfections. Use `wear:0` for clean solids.
- `pigmentWash(c,path,restBox,{color,seed,opacity,granulation,edge,blend})`: pigment
  spots and darkened boundary. Use `source-over` on dark backgrounds where
  multiply would hide the wash. Does not simulate wet pigment transport.
- `printPlate(c,plate,{offset:[x,y],rotation,mottling,...})`: whole-plate
  registration and spatial coverage variation, in logical units/radians.

A rest-space texture can be cached in a local layer and deformed together with
its object. Do not recompute a sampling grid from the animated bounding box.
SVG `d` can initialize `Path2D`, but retain editable point data separately when
animating curves. This is not a general SVG document importer.

## Review workflow

Render at the film's intended aspect ratio, with a smaller output width during
iteration. `--grid N` samples the film; `--strip START,COUNT` shows consecutive
output-frame indices. Review at normal speed too. Look at contact frames, fast
turns, a static hold and a camera push. Test both PNG detail and the compressed
MP4. Render after a backward seek to catch state-dependent drawings.

`node scripts/verify.mjs` runs browser regressions for timebases, scaled plates,
contacts, seeded marks, sand seeking and renderer revisions. These prove
mechanisms; visual quality still requires looking at the output.
