# Paper in space: pop-up books and sheets that stand

Everything is still drawn by the core in 2D, on sheets of paper. The sheets
then stand in a room: a book on a table, a cover that opens, leaves that turn
about the spine, cut-out pieces that lie flat and rise as a spread opens, a
camera that travels round them, a lamp that shades each sheet by its angle and
drops its shadow on the page.

Canvas 2D has no perspective, so a sheet is drawn as a mesh of small triangles,
each mapped with its own affine transform. It costs about 200 triangles a sheet
and renders a 1080² frame of a whole pop-up spread in a few milliseconds.

Worked examples: `examples/moon-book.html` (a book with two spreads, night and
a lit paper moon) and `examples/paper-horse.html` (three spreads, a page that
is a light table, a figure that leaves the book).

Read this file whenever the brief says pop-up, book, paper theatre, diorama,
a page turning, or asks for depth and camera moves.

## Axes and the sheet

x right, y up, z towards the reader. The table is `y = 0`, the spine lies along
z through the origin.

```js
cam3({ eye: [0, 1000, 1300], target: [0, 120, 0], f: 1500 });      // f is focal length in frame units
const sheet = tex3(460, 620, (g, w, h) => { ...core drawing in sheet units... }, 2);
quad3(c, sheet, [TL, TR, BR, BL], { n: 12, dark: shadeOf(Q) });
```

| call | what it does |
|---|---|
| `cam3({ eye, target, f, up })` | the camera. `up: [0, .45, -1]` lets it look straight down at the table without flipping. |
| `proj3(p)` | a world point as `[x, y, depth]` in frame units, for putting 2D effects (`glow`, text) over the 3D. |
| `tex3(w, h, draw, scale)` | a sheet of paper. `draw(g, w, h)` uses anything from the core: brush, wash, gouache, `photo()`, `roto()`, `handText`. `sheet.redraw(fn)` repaints it, which is how a page's text writes itself or a figure animates on a sheet. |
| `quad3(c, sheet, P, o)` | the sheet on a quad, corners in texture order TL TR BR BL. `o`: `n` mesh density, `dark` 0..1 shading, `back` the sheet seen from behind, `al`, `img`. |
| `shadeOf(P)` | how much to darken a quad at its angle to the lamp; pass it as `dark`. |
| `shadow3(c, sheet, P, r0, nrm, clip, al)` | the sheet's shadow cast on a plane, clipped to a polygon of that plane. |
| `shadowsBegin()` / `shadowsEnd(c, al)` | gather several shadows at full strength on one layer and lay them down once, so overlaps and mesh seams do not add up. Always use this pair when more than one thing casts. |
| `book3({ PW, PD, spreads, cover, board, edge })` | the book. |

## The book

```js
const book = book3({ PW: 460, PD: 620, cover, spreads: [
  { left: pageL, right: pageR, pieces: [
      { base: [[-440, -285], [440, -285]], h: 470, sheet: sky, mesh: 12 },   // across the gutter
      { base: [[-330, -30], [-150, -30]], h: 400, sheet: pine },             // on the left page
      { base: [[180, -60], [380, -60]], h: 320, sheet: pine, lean: 74 } ] } ] });
book.draw(c, { turn });
```

- `turn` counts the leaves lying on the left: 0 is shut, 1 is the cover open on
  spread 0, 2 is spread 1. A fraction is a leaf in the air. With n spreads the
  book opens n times.
- A piece's `base` is the foot of the cut-out on the open spread: x is the
  distance from the spine (negative on the left page), z runs along the spine,
  negative away from the reader, and the first point is its left end. It lies
  flat while the spread is shut and stands as it opens. A base with one point on
  each side of the spine stands across the gutter and folds with both pages.
- `lean` is how far it stands (90 is upright), `rise` scales when it gets there,
  `back` is the sheet seen from behind, `shadow: false` turns off its shadow,
  `after(c, Q, e)` draws on top of it once it is placed.
- Pieces are sorted by depth, and the whole spread is drawn back to front.

## Making it look like paper and not like 3D

- **Cut-outs are the whole trick.** A pop-up is flat shapes at different depths.
  Do not model anything; give each piece one silhouette and let the camera do
  the work.
- **Shade by angle, always.** A sheet with no `dark` reads as a sticker. The
  same drawing at two angles is what sells the space.
- **Cast shadows onto the page as well as the table.** `shadow3` clipped to the
  page quad is what makes a piece stand on it.
- **Thickness is free.** `book3` draws a block of leaves and a cream page edge;
  the stack on the left grows as pages turn.
- **The camera is slow.** Keyframes of `{ eye, target }` lerped with `easeIO`.
  One move per beat, and hold still while something happens on the page.
- **2D effects go on top.** `nightfall`, `glow` at `proj3(...)`, a vignette for
  the lamp over the table, handwriting on a sheet through `redraw`.
- **A page can be anything.** A sheet is a canvas: `sandImage()` on a page makes
  it a light table, `photo()` makes it a museum card, `roto()` makes it a
  flipbook. The pop-up is a frame around the other methods.

## Free-standing sheets

Not everything needs a book. A quad standing on the table, with `shadow3` onto
`y = 0`, is a cut-out on the desk: the museum lantern and the sandglass in the
example are exactly that, and the horse that leaves the book is one too.

```js
const Q = [[x - w / 2, y + h, z], [x + w / 2, y + h, z], [x + w / 2, y, z], [x - w / 2, y, z]];
const g = shadowsBegin(); g.setTransform(c.getTransform()); shadow3(g, sheet, Q, [0, 0, 0], [0, 1, 0], null, 1); shadowsEnd(c, .34);
quad3(c, sheet, Q, { n: 8, dark: shadeOf(Q) * .8 });
```

## Unfolding a figure

A page opening and a figure unfolding are separate actions. Revealing an
already spread, full-size drawing in a single frame often makes it appear to
pop into existence. Design a compact folded silhouette first and give the
opening enough screen time to read.

Animate the base rise, left hinge, right hinge and tail/fan with separate
overlapping timing windows. A slight delay between sides can clarify the folds.
Keep the attachment in page coordinates. Extend the silhouette above that
attachment instead of scaling the entire drawing around its centre. Include
a visible folded tab when transparent texture margins would leave a gap.

Use `sheet.redraw(draw)` when the painted silhouette changes. It increments the
sheet version so its cached shadow is regenerated. A wider figure needs a wider
shadow; a static shadow under unfolding wings breaks the paper illusion. Update
`piece.lean` from absolute time when its hinge rises, so backward seeking gives
the same geometry. Reset every animated value on each evaluation.

In [Becoming](../examples/becoming-phoenix/phoenix.html), `unfoldPhoenix` redraws
the cut-out at 24 Hz. The two wings rotate in projection about authored shoulder
hinges; the tail fans later. Its bottom remains fixed while its width and height
increase. `paperScene` finishes the page turn early enough to leave time for
these actions before the next material arrives. This is a projected illustration
of folding, not a physical origami constraint solver.

Inspect a consecutive strip of the opening and the normal-speed scene. Check
the first visible size, order of folds, base contact, shadow growth, occlusion
by the turning page and time to read the fully opened pose.

## Defects specific to this method

- a sheet with no shading, or a piece with no shadow on its page;
- shadows drawn straight onto the frame one by one (the seams and overlaps add
  up into dark bands): use `shadowsBegin` / `shadowsEnd`;
- a whole sheet dropped because one corner went behind the camera (cull per
  mesh cell, which `quad3` does, and keep the camera outside the paper);
- a piece that stands through another piece, or a base on the wrong page;
- a camera that orbits continuously (it turns a book into a screensaver);
- text drawn in the room instead of on a sheet, which breaks the illusion that
  everything in shot is paper.

## Curved pages and limits

quad3 accepts deform(worldPoint,u,v) and shadeMesh:true (for opaque sheets). The turning book leaf
uses a restrained procedural curl, with the same deformation projected into its
shadow. Cut-out attachment points follow the curved moving leaf. This is an illustration of flexible paper, not an inextensible sheet
solver or a physically foldable pop-up mechanism. shadow3 accepts an optional
final {deform,n} argument to keep the shadow consistent with a custom surface.

Cut-outs are sorted by mean camera depth. This helps camera movement but cannot
resolve intersecting sheets or cyclic overlap like a depth buffer. Stage these
shots with non-intersecting layers and inspect occlusions. Supersample or refine
the mesh when seams show. WebGL is optional future work, not required here.
