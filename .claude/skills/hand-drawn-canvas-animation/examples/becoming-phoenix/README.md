# Becoming

A 60-second, 1920×1080, 24 fps film with an original synthesized score.
A chick survives a storm, gains colour and unfolds into a paper phoenix.
Open `phoenix.html` to play or scrub. Enable sound with the player's sound button.

From the skill folder, with the renderer dependencies installed:

```sh
node scripts/render.mjs examples/becoming-phoenix/phoenix.html --grid 24 --out /tmp/becoming
node scripts/render.mjs examples/becoming-phoenix/phoenix.html --strip 936,24 --out /tmp/becoming
node scripts/render.mjs examples/becoming-phoenix/phoenix.html --width 1920 --out /tmp/becoming
```

The full render writes `phoenix-final.mp4` with audio, `phoenix-score.wav`, a
silent MP4, frames and a contact sheet. Master the score's loudness for the
intended delivery. The HTML player's live speed depends on the machine;
the offline MP4 supplies fixed presentation timing.

| File | What to study |
|---|---|
| `bird-drawings.js`, `art.js` | complete bird poses, strokes and drawing helpers |
| `styles.js` | different mark systems; folded paper wings and tail |
| `media-scenes.js` | moving storm layers, continuous ledge progression, print-to-page mapping and staged unfolding |
| `continuity.js` | one timeline and transitions driven by material changes |
| `scene-helpers.js`, `score.js` | opening, closing card and original sound cues |
| `photos.js`, `SOURCES.md` | embedded lantern and external source credits |

Useful ranges: storm 7-14 s, sand 14-20 s, photo interaction 20-27 s,
risograph 27-35 s, paper 35-42 s, screen print 42-49 s, combined feather
materials 49-56 s, signature 56-60 s. The film demonstrates authored cels,
sand displacement, photo masking, ink separations and paper projection.
It does not contain traced live-action movement.

The code uses CPU Canvas readback consistently across the main drawing and
cached sheets so seeking does not switch raster backends midway through a run.
Exact pixels still depend on browser and font versions. The page curl and wing
hinges are controlled illustrations, not a physical origami solver.
