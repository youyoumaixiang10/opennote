# Motion: keys, exposure, spacing and contacts

A convincing action starts with readable drawings and intentional spacing.
`defineFilm({fps:24})` is now the default. `tau` is scene-local seconds sampled
at output cadence; `i` remains the global 12 Hz legacy index for old pulse/boil
calls. `fps:12` is still supported explicitly for an archival film.

## Whole drawings first

For a hand-drawn character use [redrawn-animation.md](redrawn-animation.md).
Plan complete keys and breakdowns, then expose those drawings. A skeleton or IK
solver may establish construction, but shoulders, bent limbs, hands and changing
views need contours designed for the pose. Smooth joint transforms alone will
read as a puppet even with rough outlines. Use substitutions for changes in
overlap and assisted inbetweens only where points genuinely correspond.

Hold the stroke pattern with the drawing. A quiet pause can remain completely
still; add another drawing when it expresses a small shift of thought or weight.
Unmotivated continuous boil does not create acting.

## Exposure

Use `studio.js`'s `exposureTrack` for mixed ones/twos/held drawings; see
`studio.md`. `twos(tau)` remains useful for a deliberately uniform passage.
A scene with `twos:true` quantizes the entire scene, including the camera.
Use that only when a held cel or deliberately stepped whole frame is intended.

A fast turn may need ones. A held drawing may stay for several frames. Exposure
is a directorial decision, not a test for whether animation looks handmade.
Quantize the pose once; motion helpers inside the pose receive that time.
Camera and lights generally use continuous `tau`, but inspect their interaction
with the subject. Root motion on twos under a following camera on ones may
produce alternating backward/forward screen motion. Adjust the shot's exposure
or tracking as a whole and recheck planted contacts.

## Plan the action

Draw keys and breakdowns before interpolating: where the weight rests, what
leads the gesture, where the head/eyes look, when a hand closes and when the
viewer understands the result. Include replacement drawings for a changed
view, silhouette topology or extreme expression. Match endpoints and landmarks
before morphing curves. More inbetweens cannot repair an unclear key.

Use anticipation, settle, overshoot and moving holds where the action calls for
them. A thrown object follows a ballistic arc; a motor can rotate at constant
speed; a rigid cup need not squash on every stop. Avoid applying the same spring
to every part. Keep secondary motion subordinate to the action and offset it
by a purposeful delay.

## Environmental force

When weather drives the action, choreograph its force and the character's
response together. A storm needs more than a rain overlay on a still setting.
Use a few authored gust envelopes: onset, peak, recovery. Let them affect branch
bend, debris travel, the character's bracing/skid and any camera response, with
small purposeful delays rather than unrelated noise on every element.

Separate distant, middle and near scenery. Their different travel speeds and
occlusions can reveal depth; move ground detail consistently with the camera.
Bend trees about their roots. Keep foreground debris brief enough that the
character remains readable. A temporary loss of contact needs a visible catch
and recovery, not just a floating sprite. Camera shake is optional and cannot
replace movement in the setting.

For repeating scenery, seed each object's world index. If a layer wraps by a
spacing interval, advance that index with the interval so a tree does not change
shape when it crosses the array boundary. Rain and leaves can leave an overscanned
frame before wrapping. Inspect both normal playback and the wrap frames.

See `stormForce` and `inkScene` in
[`media-scenes.js`](../examples/becoming-phoenix/media-scenes.js). The example
uses three forest depths and three gusts; their counts are not defaults for
other films. A quiet setting may deliberately remain still.

## Existing helpers

| helper | use |
|---|---|
| `key(t, [[time,value,...], ...], easing)` | numeric controls; each segment eases separately |
| `keyPath(t, keys, {ease})` | Catmull-Rom path through keys, with easing across the whole move |
| `motionPath(points).at(u)` from studio | travel sampled by arc length; choose speed through u |
| `arc(a,b,u,lift)` | parabolic jump, usually with linear u during flight |
| `squash(k)` | reciprocal x/y area scaling for an appropriate deformable subject |
| `settle(t,t0,{amp,freq,decay,phase})` | damped follow-through; inspect impact discontinuities |
| `spring(t,{freq,damp})` | step response for a purposeful spring-like action |
| `anticipate(a,b,t,{back,hold,e})` | preparation against the direction of the main move |
| `camKeys(c,tau,keys,{hand,seed})` | camera motion; handheld amount is optional and can be zero |
| `breathe`, `drift` | small local motion; choose exposure to match the drawing |
| `smear(c,n,span,draw)` | legacy transparent ghost trail |
| `smearPose(points,direction,amount,pivot)` from studio | authored directional deformation for a smear drawing |

Default ease-in/out at every numeric key creates a stop at every key. Use a
continuous trajectory where the action should pass through. `keyPath` smooths
positions, but does not promise constant speed for arbitrary control points.
`motionPath` separates path geometry from timing through its length table.

## Contact and weight

For a planted foot, the target stays on the ground while the hip moves. For a
grip, the target is derived from the prop transform. `solveLimb` preserves bone
lengths and reports unreachable targets. Choose the bend side, check the elbows
and knees at every key, and adjust the torso when reach fails. A hand target
and the drawn contact point must be the same point, not merely nearby formulas.

Animate weight transfer before the lift; let the body compensate for the load.
Release contacts at explicit times. A loop needs matching contact phase and
travel distance; a sine wave in the legs alone is not a walk cycle.

## Timing suggestions

These are starting points to test at 24 output fps, not mandatory durations:

- Blink: a short close, one or two held closed frames, a gentler reopening.
- Preparation: enough frames to read intention before a fast change.
- Landing: inspect the contact frame, compression, recovery and weight shift.
- Hold: long enough for the action to register, with restrained secondary motion.
- Camera: move for staging and stop when stillness helps the performance.

Do not quantize an audio accent separately from the animation it follows. Cues
can land on any output frame, including odd frames during an action on ones.

## Review

Render consecutive strips across contact, a fast turn and a camera move. Inspect
normal-speed playback, then individual drawings. Check contacts, volume, gaze,
spacing, direction, joints and material coherence. A static contact sheet is a
composition check only. Preserve a pinned-runtime repeat-after-seek comparison
for a frame that mixes palette changes, caches or simulation.
