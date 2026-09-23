# Palettes, tints and finishes

The colour system lives in `assets/core.js`. Use `PAL.*` for colours shared
across scenes or material variants; local authored marks may carry their own
colours. A palette change can reuse geometry across finishes, but adapting a
look also requires appropriate stroke language, separations and drawing design.
A new palette alone does not turn a rig into redrawn pencil animation.

## The palette schema

Every palette has the same keys. Scenes rely on all of them existing.

| key | role | typical value |
|---|---|---|
| `paper` | background of daylight shots | warm off-white |
| `paperBand` | faint diagonal light bands on paper, or `null` | `rgba(255,238,200,.65)` |
| `ink` | dark outline and text | near-black with a hue |
| `night` | background of dark and blueprint shots | navy, purple-navy, warm black |
| `chalk`, `chalkDim` | light line on night, and its quiet version | pale blue, grey-blue |
| `guide` | construction-line colour, with alpha | `rgba(70,100,255,.55)` |
| `fills[]` | 3 to 8 flat fills for subjects and grounds | |
| `shade` | hatch or dot colour laid over fills | darker, same family as fills |
| `light` | highlight hatch on fills | near-white |
| `blush` | second shade: warm shadow, cheeks, sunsets | |
| `accents[]` | four loud colours for scribble outlines, wakes, sparks | |
| `inks[]` | 2 to 4 print inks for riso plates and dot screens | |
| `finish` | default surface finish | `ink`, `riso`, `screen`, `pencil`, `flat` |

## Presets

| name | look | reference | paper / night | inks | finish |
|---|---|---|---|---|---|
| `paperInk` | warm paper, brown fills, four fluorescent accents | the fruit-fly film | `#f3e6cf` / `#0b0d1f` | `#1e1630 #c8473f #2b5fb8` | `ink` |
| `risoPop` | cream stock, fluorescent riso inks, halftone dots | the flipbook | `#f0ece2` / `#2a2050` | `#0078bf #ff48b0 #ffe800 #22366b` | `riso` |
| `screenSea` | sea blues, cream sky, an orange desk, regular dot screen | the paper boat | `#e8e6db` / `#1a1c2e` | `#0a5083 #051630 #e8c84a` | `screen` |
| `pencilMinimal` | cream and charcoal, pale pink and sage sections, thin graphite | the personal website | `#f4efe4` / `#27251f` | `#201f1b #8a8a55` | `pencil` |
| `doodlePastel` | pastel product-shot paper, brush-pen ink, watercolour fills, white gouache | the doodle film | `#efd2d1` / `#2c2f5e` | `#23202b #e8505b` | `flat` |
| `blueprintNight` | chalk on navy only | blueprint interludes | `#0b0d1f` / `#0b0d1f` | `#e8ecff #7fe7ff` | `ink` |

The doodle look changes paper with every object: `usePalette(pastel('mint'))`
with `PASTELS` = rose `#efd2d1`, mint `#d3e6d9`, butter `#efe4b3`, sky
`#d2dee8`, cream `#ebe5d4`, peach `#eeccb4`, lilac `#ded4e9`, sand `#c9b07e`,
night `#383750`, all measured off the reference. `pastel('#aabbcc')` takes
any colour. After `nightfall`, switch to `chalkPalette()`.

Measured dominant colours of the references, so you know how far you can
drift: the flipbook is 45% cream paper, then navy, tan, teal and plum, with a
third of pixels saturated. The boat film is 41% blues, 10% cream, 9% orange.
The website is 92% cream and charcoal with almost no saturation. The fly film
is peach, navy and sand.

## Picking and making palettes

```js
usePalette('risoPop');                                        // a preset
usePalette(makePalette({ fills: ['#3a7ca5', '#d9a441', '#c94c4c'], finish: 'riso' }, 'risoPop'));   // preset with overrides
usePalette(derivePalette(PALETTES.screenSea, { hue: 40, sat: .8, light: .05 }));                    // the whole palette shifted
usePalette(duotone('#ff48b0', '#0078bf'));                    // two inks on cream, the flipbook's magenta-and-blue beat
```

- `makePalette(part, base)` fills the keys you do not give from the base.
  Use it for a new subject that fits an existing look.
- `derivePalette(pal, {hue, sat, light, paper, ink, night, finish})` rotates
  hue in degrees, multiplies saturation, adds lightness, for fills, accents,
  inks, shade and blush together. Paper and ink stay unless overridden.
  Use it to make a cool or warm variant of a look without repainting it.
- `duotone(inkA, inkB, paper, finish)` builds a two-ink palette. One or two
  shots in duotone inside a colour film is a strong beat.
- A scene may call `usePalette(...)` at its top when the film changes look
  between shots. The four-looks example does exactly that.

## Tints, shades and mixing

All helpers take and return CSS colours.

| call | result |
|---|---|
| `tint(c, t)` | towards white, `t` 0..1 |
| `shade(c, t)` | towards black |
| `mix(a, b, t)` | linear mix |
| `alpha(c, a)` | `rgba()` string with alpha |
| `rotateHue(c, deg)`, `saturate(c, k)`, `lighten(c, d)` | HSL edits |
| `ramp(c, n)` | n steps from light tint through the colour to dark shade |
| `harmony(c)` | `{complement, triad, analog, split}` |

Use tints and shades for depth inside one fill: a far ridge is `tint(fill, .3)`,
a near one is `shade(fill, .2)`. Never introduce a new hue for depth.

## Finishes

The finish is how a flat fill gets its texture. `surface(c, path, box, opts)`
is the one call puppets and grounds make; it reads `PAL.finish` unless
`opts.finish` says otherwise.

| finish | marks | what the reference does | cost |
|---|---|---|---|
| `ink` | hatching along the form plus grain | the fruit fly: short strokes clipped to each part, 4 to 6 px apart | low |
| `riso` | rotated halftone dot screen with a little jitter | the flipbook: dots 7 px apart, three or four inks overprinted | low per shape, medium per plate |
| `screen` | regular dot screen on a straight grid | the paper boat: every flat shape carries a fine dot grid in a darker tone | low |
| `pencil` | sparse thin graphite lines and a few dots | the website: almost no texture, thin lines, tiny dots | low |
| `flat` | nothing | for a card that is only silhouettes | none |

Two ways to get riso:

1. **Per shape**: fill, then `surface(c, path, box, { finish: 'riso' })` or
   `dotScreen(c, path, box, { density, color })`. Density can be a function
   `(x, y) => 0..1` for gradients, and this is the only place a gradient is
   allowed: it becomes dot size, never a smooth ramp.
2. **Per plate**: draw each ink's coverage in black on a white `plate()`,
   then `printPlate(c, plate, { ink, angle })` for each. Plates multiply on
   the paper like real ink, overlaps mix, and a white shape on a plate knocks
   the ink out. Angles 15, 75 and 0 degrees keep the screens from moiré. This
   is how the flipbook's cards are made; `examples/four-looks.html` has eight.

Rules that hold across finishes:

- One finish per shot. Mixing hatching and dot screens in one frame reads as
  two films glued together. The exception is a deliberate cut between looks.
- The dot screen's colour is `PAL.shade` or one of `PAL.inks`, never a new hue.
- Coverage is capped (`maxCov` in `printPlate`, default 0.78) so paper shows
  between dots. Solid ink is a rare accent, not a fill.
- Paper always gets `paper(c)` or `night(c)` first: stock grain is part of
  every finish.

## Checks

Render `paletteSheet` (`{ name: 'palette', dur: .5, fn: paletteSheet }` in the
timeline) to see every key with its ramp and the harmony of the first fill.
Render `styleSheet` to see the finishes side by side on the current palette.
Do both before drawing a scene, and again after any palette change.
