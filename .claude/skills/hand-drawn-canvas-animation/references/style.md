# Art direction by medium

Choose a material and a drawing language separately. The default character
language is visible strokes and whole redrawn poses; see
[redrawn-animation.md](redrawn-animation.md). Keep the palette deliberate;
clean shapes, aligned fills, pure light accents and several materials in one shot
are allowed when the chosen reference calls for them. Procedural roughness is
optional. The original Kevin Ngo films remain references for particular graphic
looks; their montage structures and signatures are not rules for every film.

## Ink

Prioritize construction and silhouette, then line hierarchy and form shading.
Use pressure-shaped contour gestures and lighter internal detail. Let stroke
endings and selected overlaps remain visible. Redraw the contour for each pose;
keep long edges confident rather than roughening every millimetre. Break a line only where
light, overlap or gesture motivates it. `drawCel(...,{material:'ink'})` draws authored cels;
`makeStroke`/`drawStroke` preserve an
authored pressure profile. `formHatch` takes tone and direction fields; run it in
fixed local bounds and turn/deform the result with the object. Add cross-hatching
in the shadow instead of darkening every surface equally. Clean ink need not boil.

Reject: uniformly hairy outlines, the same hatch angle on every body part,
search lines everywhere, flickering hatch identities. Test: a head turn and an
arm lifting weight, viewed both as silhouette and as finished ink.

## Pencil

Start with `cels.js` and `drawCel(...,{material:'pencil'})`: narrow interrupted
passes with pressure, authored as whole drawings. Use `graphite` for additional
tonal strokes when needed. The older `drawStroke` pencil option adds deposits
to a filled ribbon; that alone is insufficient for an open pencil sketch. Separate outline, broad side-of-pencil shading and sparse
construction lines. Vary pressure along a deliberate drawing gesture; do not
map the character's travelling speed to pencil pressure. Several quieter passes
usually read better than a thick noisy contour. Held redraw variants should
preserve landmarks, proportions and endpoints.

These helpers approximate graphite with layered marks; they do not simulate
paper fibres or graphite deposition physically. Add a custom rest-space paper
mask when a close-up needs visible tooth. Test: gaze, blink, small head turn and
breathing, with no music. A scrolling pencil webpage is a layout reference,
not an acting reference.

## Riso

Design two to four ink separations from deliberately drawn shapes. Preserve
selected brush or pencil marks in the plate artwork; avoid turning the whole
character into clean geometric masses by default. Redraw changing silhouettes
and internal overlaps before separating the inks. `plate()` supplies an opaque white coverage
canvas at the correct scale; draw coverage in grey/black, knockouts in white.
`printPlate` supports a whole-plate `offset`, `rotation` and low-frequency
`mottling`. Keep these stable through a held print. The raster belongs to the
sheet unless the art direction explicitly says otherwise. Avoid independent
per-dot shaking. Preserve negative space and inspect overlap colours.

Multiply is a useful approximation, not a calibrated physical ink model. Full
solids are valid. Select regular or custom stochastic screens to match the
reference; do not force a coarse dot pattern onto every element. Test: overlapping
inks during motion and a camera push, including the encoded delivery size.

## Screen print

Draw the key silhouettes and preserve deliberate brush edges, uneven terminals
and occasional open marks. Redraw those shapes through the action rather than
rotating a stack of unchanged parts. Use strong, carefully balanced flat masses,
opaque ink and occasional small
coverage imperfections (`screenFill`). Halftone is optional. Keep the shape's
edge and the grain quiet enough that facial features survive reduction. Separate
this look from riso with density, edge treatment and colour interaction, not
merely a different dot angle. Use depth planes only where they help staging.

Test: a boat on a cresting wave, with a stable hull silhouette and controlled
phase differences between wave, boat and background. Reject: texture obscuring
the drawing, arbitrary noisy edges and every layer set to multiply.

## Doodle on photos

Read `doodle.md` for source preparation and anchor coordinates. Give each image
an actual role in the action. A grip, foot plant, shadow and correct occlusion
make a drawn actor share the photographed space. Store attachment points in
object coordinates and rebuild them through `on(pl,u,v)` after every transform.
Use whole drawn gesture poses, expressive brush strokes and restrained washes (`pigmentWash`); draw-on
should leave enough time for the action and reaction. A draw-on reveal is a
separate device from character animation: after the reveal, poses still need
redrawing, substitutions and deliberate exposure.

A rotating flat photo does not reveal a new side. Choose another view or stage
around that limitation. Test: a character catches a handle, climbs over a rim
and disappears behind its front edge. Reject: sliding hands, halos, floating
feet, and drawn decoration that never interacts with the object.

## Rhythm, light and texture

Use exposure by action rather than a style-wide frame-rate restriction. Twos
are often useful; fast turns and fine gestures may need ones. Light and camera
usually sample every output frame. Check the combination rather than assuming
that independent smooth tracks produce smooth screen motion.

Paper may be a world surface, a cel or a fixed graphic background. Decide where
its texture lives. Add intentional boil only to designated strokes. Grain is
not a universal overlay. Controlled gradients, masks and soft shadows are valid
when they describe the medium or lighting; avoid indiscriminate blur as a finish.

Blueprint, construction guides, badges, seed dots, whip cuts and sign-offs are
available in `core.js` and `scenes.md`. Select them for the story rather than
using them as evidence that the film is hand-drawn.
