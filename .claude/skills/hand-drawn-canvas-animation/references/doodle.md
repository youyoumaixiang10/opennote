# The doodle look: drawings on found photos

A photo of a real object, cut out and set on pastel paper, and ink doodles
that turn it into something else. A shoe gets a mast and becomes a ship. A
kettle's steam becomes a cat. The photo is the only thing in the frame that
is not drawn by code. Reference: [the doodle film](https://x.com/kevin_t_ngo/status/2100601972902842517),
measured in `reference-films.md`. Worked examples: `examples/held-once.html` (five calm shots, the basics) and
`examples/night-shift.html` (a 31 s chase with moving light, a following
camera and motion-matched cuts).

Read this file whenever the brief says doodle, photo, found object, collage,
or "draw on top of a picture".

## What the look is made of

| layer | what | kit |
|---|---|---|
| paper | one pastel sheet per object, lighter in the middle, darker in the corners | `usePalette(pastel('mint'))`, `backdrop(c)` |
| behind | drawings the object hides: ground line, hills, a mast foot | `doodle()` drawn before the photo |
| object | the cutout with a soft contact shadow | `place()`, `photo()` |
| on top | characters, props, weather, lettering, in a brush-pen line that draws itself | `doodle()`, `brush`, `wash`, `gouache` |
| in front | the part of the object that covers a drawing sitting inside it | `photoFront(c, pl, path)` |
| light | night over everything, then lamps | `nightfall`, `glow`, `chalkPalette()` |

Line is a near-black brush pen, 3 to 5 units wide, swelling and tapering.
Bodies are opaque white gouache so they read on top of a busy photo. Colour
is watercolour: a wash a few units off the line, soft at the edge, never flat
to the outline. Lettering is lowercase handwriting, one to three words.

## The idea comes first

The film is only as good as the misreadings. For each object write one line:
**what it is, what it becomes, who lives there, what happens**. The reference
film does fourteen of these in 34 seconds.

Ways to misread an object, from most to least reliable:

1. **Shape rhyme.** The silhouette is already something else: scissors are a
   stork, a lampshade is a carousel roof, a shoe is a hull, a violin is a boat.
2. **Scale flip.** Make the viewer small: a cup is a bath, a waffle is a
   climbing wall, a pillow is a bed for someone 5 cm tall.
3. **Function, taken literally.** A flashlight projects a cinema, a camera
   takes a family portrait, a teapot finally pours for someone.
4. **Extend what it emits.** Steam, light, sound, time: draw what comes out
   and let it turn into a character or a shape.
5. **Carry it.** Small characters use the object as cargo: two birds fly an
   envelope, a train runs over a book.

Keep one cast through the whole film (one to three small characters) and one
anchor that survives every cut: a scarf, a hat, a colour. Give the last
object the payoff of the first.

## Procedure

This replaces steps 4 to 6 of `SKILL.md` for a doodle film.

1. **Find photos.** One object per shot, plain studio background, whole
   object inside the frame, at least 1000 px on the long side. Take only what
   you may publish: museum open access under CC0 (The Met, the Art Institute
   of Chicago, the Smithsonian, the Rijksmuseum), public-domain files on
   Wikimedia Commons, or the user's own photos. Record title, date, holder
   and licence for every photo. The Met has a keyless API:
   ```bash
   curl -s "https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isPublicDomain=true&title=true&q=teapot"
   curl -s "https://collectionapi.metmuseum.org/public/collection/v1/objects/197622"   # isPublicDomain, primaryImage, title, objectDate, objectURL
   ```
   Download a dozen candidates, tile them into one sheet, look, then choose.
   Choose by silhouette and by what the object can become, never by keyword.
2. **Cut and register.**
   ```bash
   cp <skill>/scripts/photo.mjs <film>/
   node photo.mjs teapot.jpg --name teapot --credit "Teapot, ca. 1755. The Met, CC0" --source https://...
   ```
   It writes the cutout into `photos.js` as a data URL and a check sheet to
   `out/photo-teapot.jpg`. Open the check sheet. On magenta the object must be whole, without
   a halo, and handles must be empty inside (clear leftover backdrop with
   `--punch u,v`). With `rembg` on PATH the cut is a matting model and works
   on graded backdrops and cast shadows; without it the fallback floods a
   flat background by colour and fails on most museum shots. Load `photos.js`
   after `core.js`:
   ```html
   <script src="core.js"></script>
   <script src="photos.js"></script>
   ```
3. **Read the anchors.** The right half of the check sheet has a grid in
   photo units: `u` across and `v` down, both 0 to 1 over the cutout. Write
   down the points your idea needs (spout tip, rim ends, top of the ring,
   flame) as `[u, v]`. Everything attached to the object is placed with
   `on(pl, u, v)`, never with frame pixels, so it follows when the object
   moves. Values outside 0 to 1 are legal: `on(pl, .5, -.3)` is above it.
   To check placement in the frame, put `photoSheet(c, place('teapot', {...}))`
   in the timeline for a render.
4. **Palette.** `usePalette(pastel(name))` at the top of each scene. Pick the
   sheet against the object: a complement or a quiet neighbour, never the
   object's own colour. One sheet per object, changed only on cuts.
5. **Build the cast** as functions that add strokes to a doodle:
   `hog(d, x, y, s, { dir, rot, eye, hand })`. Parts as knot lists in local
   units, mapped through one transform. Order inside a character: `fill`
   (gouache body), `wash` (colour), `line` (outline), details, face last.
6. **Scenes, one at a time**, `--grid 24` after each, as in `SKILL.md`.

## Anatomy of a scene

```js
function sceneTea(c, tau, i) {
  usePalette(pastel('rose')); backdrop(c);
  const tip = sm(2.0, 2.5, tau);                                   // the object reacts: it tips over its base
  const pl = place('teapot', { x: 690, y: 704, h: 320, pivot: [.4, 1], rot: -.36 * tip });
  pen(c, tau, i, .2, 1, d => ground(d, 706), { still: true });     // behind the object
  photo(c, pl, { ground: 706 });                                   // shadow stays on the floor
  pen(c, tau, i, .4, 40, d => { sun(d, 930, 150, 48); cloud(d, 560, 130, 60); });
  pen(c, tau, i, .9, 5, d => hog(d, 88, 644, 54, { dir: 1 }));
  pen(c, tau, i, 2.4, 9, d => d.line([on(pl, .005, .27), [cupX, 640]], { w: 6, color: '#a9642c' }));  // tea from the spout tip
  pen(c, tau, i, 2.8, 13, d => d.text('for two', 70, 400, { size: 80 }));
}
```

- **Pens.** A `doodle()` is one hand drawing in stroke order, and
  `pen(c, tau, i, start, seed, build)` makes one, fills it and draws it. Run several
  with different `start` times so the frame fills from many sides at once.
  One long queue is the commonest mistake: the last thing never finishes.
- **Drawing exposure.** For a redrawn character use whole poses from
  [redrawn-animation.md](redrawn-animation.md); hold the same marks throughout
  each exposure. The older `pen` examples rebuild from a procedural pose every
  frame. Cache expensive geometry and give it a fixed seed during a hold.
  A doodle that is already complete gets `start: -9`.
- **Draw-on budget.** Everything in a shot is on paper by 70% of its length;
  the last 30% is the gag. A character takes 0.6 to 1 s at `speed: 1500`.
- **The object reacts.** Once per film at least, the photo itself moves: it
  tips (`pivot` and `rot`), shakes (`x + Math.sin(tau * 40) * 3`), bobs on
  drawn water, or goes dark. Pass `ground` to `photo` when it lifts off the
  floor, `shadow: 0` when it floats or flies.
- **Inside the object.** Draw the character after the photo, then call
  `photoFront(c, pl, path)` with a path that covers the front wall of the
  object below its lip. Build the lip from `on()` points through `spline`.
- **Over the object.** Water, snow, grass: `fill` with a paper tint first,
  then `wash`, so the photo does not show through the watercolour.
- **Night, the simple way.** `photo`, then `nightfall(c, .86)`, then `glow`
  for every lamp, then `usePalette(chalkPalette())` and draw: lines go chalk,
  bodies go dark, washes stop multiplying. Anything drawn before `nightfall`
  goes dark with the photo, which is right for the ground and wrong for
  characters. Use it for a static night shot with fixed lamps.
- **Night with moving light.** `nightShot(c, body, { k, lights })`, described
  below. Use it whenever a light travels.
- **Optional boil.** Legacy `d.draw(c, tau, boil(i))` changes the line seed
  every four ticks of the 12 Hz compatibility index (3 changes per second).
  This is an explicit effect, not a default requirement. Prefer a stable hold
  or a small authored redraw set when the acting calls for one.
- **Optional ending.** The old example hangs scene stills on a line, then uses
  `signOff`. Choose an ending for the story; this device is not required.

## Moving light: `nightShot`

```js
usePalette(pastel('mint'));                       // before nightShot, never inside body
nightShot(c, c => {                               // body runs twice: once in ink, once in chalk
  backdrop(c); pen(c, tau, i, -9, 1, d => ground(d), { still: true });
  photo(c, pl);
  pen(c, tau, i, -9, 7, d => hog(d, hx, GY - 62, 70, { run: tau * 15 }));
  pen(c, tau, i, -9, 9, d => spark(d, sp[0], sp[1], 34));
}, { k: .88, lights: [{ x: sp[0], y: sp[1], r: 340, color: '#ffcf70' }] });
```

`body` draws the whole shot in daylight. `nightShot` multiplies it to night
everywhere except inside the pools of light, so a pool shows the real paper
colour and the real photo. Then it runs `body` again under `chalkPalette()`
onto a layer, keeps that layer only where it is dark, and lays it on top. The
result: a line is ink where the light falls and chalk where it does not, and
the change happens at the edge of the pool as the light moves. In the chalk
pass `backdrop`, `glow` and `nightfall` do nothing, `photo` erases the chalk
behind the object, and washes are 40% dimmer.

Each light is `{ x, y, r, color, k, glow }`. `k` below 1 makes a weak pool (a
character you want faintly visible away from the main light). `glow: 0`
removes the warm air and the halo. Colours that must not change between the
passes (a flame, a lamp) are given explicitly in the puppet, with
`blend: 'source-over'` on their washes. Lower the shot's `k` towards 0 for
dawn; at 0 `nightShot` is just `body`.

## A chase: characters that are already drawn

A film with a story keeps the self-drawing line for the world and lets the
cast move freely.

- Characters use `start: -9`, so they are complete from the first frame and
  are rebuilt from their pose every frame: run cycle from a phase
  (`run: tau * 15`), lean, fright, a reaching hand.
- A character's route is a function `path(t)` returning `[x, y]`. The light,
  the trail of sparks behind it and the camera all read the same function.
- Standing and running on the object uses its real silhouette:
  `rim(pl, 'top', u)` is the point on the top edge above `u`; for a photo
  turned by -90 degrees the frame's top is `'right'`. Subtract the
  character's standing height.
- Passing behind the object is a matter of order: draw the character before
  `photo` for those frames.
- Scenery draws itself at the moment the light reaches it: give each pen the
  time at which `path` passes it.
- Screen direction stays constant (left to right), so exits and entrances
  match across the cut.

## Camera

`setView({ x, y, zoom, rot })` at the top of a scene looks at a point of the
frame. `backdrop` fills the whole frame and then applies the view, so the
photo, the doodles and the night mask all move together. It resets every
frame. `whip(tau, dur)` returns a horizontal offset that leaves to the right
over the last 0.17 s of a shot and arrives from the left over the first
0.17 s: add it to `x` on both sides of a cut and the cut reads as one fast
pan. A useful default for action:

```js
const follow = (p, tau, D, zoom = 1.16) => setView({ x: CX + (p[0] - CX) * .35 + whip(tau, D), y: CY + (p[1] - CY) * .22, zoom });
```

Extend ground lines well past the frame (`-900` to `W + 900`), since the
view and the whip both look outside it. Cut on the beat: at 120 bpm a beat is
6 drawn frames, so shot lengths are multiples of 0.5 s.

## API

```js
registerPhoto(name, { src, w, h, credit, source })   // written by photo.mjs into photos.js
place(name, { x, y, h | w, rot, flip, pivot: [u, v] })   // pivot: the photo point that sits at x,y (default centre)
on(pl, u, v)   onAll(pl, [[u, v], ...])                  // photo units -> frame units
photo(c, pl, { shadow: .3, shadowW: .92, ground, al })   photoFront(c, pl, path)   photoSheet(c, pl)
backdrop(c, base, { vignette, spot })   pastel(name)   PASTELS   chalkPalette()
nightfall(c, k, color)   glow(c, x, y, r, color, k)
nightShot(c, body, { k, color, lights: [{ x, y, r, color, k, glow }] })
rim(pl, 'top' | 'bottom' | 'left' | 'right', t)          // a point on the cutout's real silhouette
setView({ x, y, zoom, rot })   whip(tau, dur, { inn, out, dist })
spline(pts, step, close)   splinePath(pts, close)
brush(c, pts, { w, color, p, seed, amp, taper, close, smooth, al })
wash(c, path, color, { al, off, seed, blend, rim })      gouache(c, path, color, al)
boil(i, every)
doodle({ start, speed, gap, seed, w, color })
  .line(pts, { w, color, close, dur, speed })   .lines(list, { stagger })   .fill(path, color, { al })
  .wash(path, color, { al, off })   .text(str, x, y, { size })   .mark((c, k) => {}, dur)
  .at(t)   .wait(s)   .layer()   .end   .draw(c, tau, seedOffset)
pen(c, tau, i, start, seed, d => { ... }, { still, speed, gap, w, color })   // doodle + build + draw with boil
```

Inside one doodle layer fills go down first, washes second, lines and text
last, whatever order you added them in. `.layer()` starts a new stack on top.

## Production notes

The core defaults to 24 fps. Draw-on can run every frame; character poses use
an exposure track when needed. Material, shadow and light treatments follow
style.md rather than numbered global prohibitions. Short handwriting is useful
when it belongs to the drawing; it is not required in every shot.

For body/prop contacts, define support curves and grip points through on(pl,u,v).
Use the same points for IK and contact drawing, and mask the foreground rim with
photoFront. Review the real silhouette after every photo transform. A flat photo
cannot reveal an unseen side during a turn.

studio.js adds pressure ribbons and persistent stroke geometry. materials.js
adds pigmentWash. These are optional approximations, not a fluid simulation.
Legacy pen/boil and wash remain available for matching the earlier films.

## Defects specific to this look

- a cutout with a halo, a grey patch inside a handle, or a chewed edge;
- a photo that fills less than a quarter or more than two thirds of the frame;
- a character drawn straight on a busy photo without a gouache body;
- a drawing attached to the object with frame pixels (it drifts when the
  object moves);
- a shot where the doodles decorate the object and do not change what it is;
- ink lines after `nightfall` (invisible), or washes that vanish on navy;
- `usePalette` inside the body of a `nightShot` (the chalk pass comes out in ink);
- a character smaller than 120 units across in a shot with a camera wider than 1.0;
- drawings still appearing in the last 20% of a shot;
- a photo with no recorded source and licence.
