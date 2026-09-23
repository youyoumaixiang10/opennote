#!/usr/bin/env python3
"""Found motion: turn a sequence of frames into vector strokes a film can redraw.

Input is a folder of frames (from `ffmpeg -i clip.gif frames/%03d.png`). Two kinds of source:
  --kind disc   Muybridge's zoopraxiscope disc windows (ink line drawings on grey; the middle figure is the pose)
  --kind dark   a dark figure on a light ground (silhouettes, most Muybridge photographs after a threshold)
  --kind light  a light figure on a dark ground (stage footage, dancers in white)
Output: one line `registerClip("name", {...})` appended to clips.js, and a check sheet.

For every frame: `outer` = closed contours of the filled silhouette (draw with the even-odd rule, holes included),
`lines` = every pen stroke of the source, traced along its skeleton, with the width the pen had there. Coordinates are source pixels,
x from the middle of the frame, y from the lowest point the figure reaches in the whole clip (the ground), y up is negative.

Needs numpy, scipy, scikit-image, pillow (the rembg virtualenv has them all).
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage import measure, morphology

ap = argparse.ArgumentParser()
ap.add_argument('frames'); ap.add_argument('--name', required=True); ap.add_argument('--kind', default='disc', choices=['disc', 'dark', 'light'])
ap.add_argument('--thr', type=int, default=120, help='ink threshold 0..255')
ap.add_argument('--close', type=int, default=7, help='closing radius that turns a line drawing into a silhouette')
ap.add_argument('--gap', type=int, default=12, help='disc: empty columns that separate the middle figure from its neighbours')
ap.add_argument('--pitch', type=float, default=None, help='disc: angle between neighbouring figures, radians (default: measured)')
ap.add_argument('--tol', type=float, default=.9, help='polygon simplification tolerance, px')
ap.add_argument('--maxlines', type=int, default=220); ap.add_argument('--minline', type=float, default=5)
ap.add_argument('--fps', type=float, default=12); ap.add_argument('--js', default='clips.js'); ap.add_argument('--out', default='out')
ap.add_argument('--verbose', action='store_true'); ap.add_argument('--no-ground', action='store_true', help='flying things: no ground stroke to register on'); ap.add_argument('--drop-last', action='store_true', help='the last frame repeats the first pose'); ap.add_argument('--credit', default=''); ap.add_argument('--source', default='')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
files = sorted(glob.glob(os.path.join(a.frames, '*.png')))
if not files: sys.exit('no frames in ' + a.frames)

def disk(r): y, x = np.ogrid[-r:r + 1, -r:r + 1]; return (x * x + y * y) <= r * r

def fit_circle(pts):
    x, y = pts[:, 0].astype(float), pts[:, 1].astype(float); A = np.c_[2 * x, 2 * y, np.ones(len(x))]; sol, *_ = np.linalg.lstsq(A, x * x + y * y, rcond=None)
    cx, cy = sol[0], sol[1]; return cx, cy, float(np.sqrt(sol[2] + cx * cx + cy * cy))

def disc_figures(ink):
    """disc windows: returns (figures, circle). A figure is a dict with its ink mask, silhouette, centroid and whether it is whole."""
    H, W = ink.shape; lab, n = ndi.label(ink, structure=np.ones((3, 3))); sl = ndi.find_objects(lab); keep = np.zeros(n + 1, bool); arc = np.zeros(n + 1, bool)
    sizes = ndi.sum(ink, lab, range(1, n + 1))
    for k, s in enumerate(sl, 1):
        w = s[1].stop - s[1].start
        if w > .45 * W: arc[k] = True; continue
        if sizes[k - 1] >= 5: keep[k] = True
    circle = None; ap_ = np.argwhere(arc[lab])
    if len(ap_) > 200:
        ap_ = ap_[(ap_[:, 0] > 12) & (ap_[:, 0] < H - 12) & (ap_[:, 1] > 12) & (ap_[:, 1] < W - 12)]   # not the picture frame
        if len(ap_) > 200: circle = fit_circle(ap_[:, ::-1])
    m = keep[lab]; sil = ndi.binary_fill_holes(ndi.binary_closing(m, structure=disk(a.close))); lab2, n2 = ndi.label(sil); sl2 = ndi.find_objects(lab2)
    sizes2 = ndi.sum(sil, lab2, range(1, n2 + 1)); figs = []
    if n2 == 0: return figs, circle
    big = np.median([s for s in sizes2 if s > .25 * sizes2.max()])
    for k, s in enumerate(sl2, 1):
        if sizes2[k - 1] < .3 * big: continue
        one = lab2 == k; cy, cx = ndi.center_of_mass(one); whole = s[1].start > 10 and s[1].stop < W - 10 and s[0].start > 10
        figs.append({'sil': one, 'ink': m & ndi.binary_dilation(one, structure=disk(2)), 'cx': cx, 'cy': cy, 'whole': whole, 'area': sizes2[k - 1], 'box': s})
    return figs, circle

def drop_ground(fig):
    """the ground stroke under the hooves: the longest straight run of the figure's lower edge. Erase it."""
    ink = fig['ink']; cols = np.where(ink.any(axis=0))[0]
    if len(cols) < 40: return
    H = ink.shape[0]; low = np.array([H - 1 - np.argmax(ink[::-1, x]) for x in cols], float); xs = cols.astype(float); rs = np.random.RandomState(7); best = (0, None)
    for _ in range(400):
        i, j = rs.randint(0, len(xs), 2)
        if abs(xs[i] - xs[j]) < 25: continue
        m = (low[j] - low[i]) / (xs[j] - xs[i])
        if abs(m) > .5: continue
        c = low[i] - m * xs[i]; inl = np.abs(low - (m * xs + c)) < 2.6
        if inl.sum() > best[0]: best = (inl.sum(), (m, c, inl))
    if best[0] < 30: return
    m, c, inl = best[1]; x0, x1 = xs[inl].min(), xs[inl].max(); yy, xx = np.nonzero(ink); line_y = m * xx + c
    # only a stroke that lies at the very bottom of the figure counts
    if np.median(low[inl]) < fig['cy'] + 10: return
    kill = (xx >= x0 - 3) & (xx <= x1 + 3) & (yy > line_y - 6.5) & (yy < line_y + 4); ink[yy[kill], xx[kill]] = False; fig['ink'] = ink
    xm = fig['cx']; fig['ground'] = (xm, m * xm + c - 2)      # the artist's own ground under this pose: the register for the whole clip

def silhouette(ink):
    """line drawing -> solid shape without gluing the legs together: seal small gaps in the outline, flood the outside, keep the rest."""
    ys, xs = np.nonzero(ink)
    if not len(ys): return ink
    y0, y1, x0, x1 = max(0, ys.min() - 14), ys.max() + 15, max(0, xs.min() - 14), xs.max() + 15; crop = np.pad(ink[y0:y1, x0:x1], 3)
    blob = ndi.binary_fill_holes(ndi.binary_closing(crop, structure=disk(a.close))); full = blob.sum(); chosen = blob
    for r in (1, 2, 3, 4, 5):
        sealed = ndi.binary_closing(crop, structure=disk(r)); lab, n = ndi.label(~sealed); edge = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]); inside = ~np.isin(lab, edge)
        inside = ndi.binary_opening(inside | crop, structure=disk(1)) | crop
        if inside.sum() > .62 * full: chosen = inside & ndi.binary_dilation(blob, structure=disk(2)); break
    out = np.zeros_like(ink); c = chosen[3:-3, 3:-3]; out[y0:y0 + c.shape[0], x0:x0 + c.shape[1]] = c; return out

def trace(skel, minlen, dt=None):
    """skeleton -> polylines with a pen width each: walk from end points and junctions, then pick up the closed loops."""
    sk = skel.copy(); H, W = sk.shape; nb = ndi.convolve(sk.astype(np.uint8), np.ones((3, 3), np.uint8), mode='constant') - sk
    N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    visited = np.zeros_like(sk); paths = []
    def neighbours(y, x): return [(y + dy, x + dx) for dy, dx in N8 if 0 <= y + dy < H and 0 <= x + dx < W and sk[y + dy, x + dx]]
    def walk(y, x, ny, nx):
        path = [(x, y)]; py, px, cy, cx_ = y, x, ny, nx
        while True:
            path.append((cx_, cy))
            if nb[cy, cx_] != 2: break
            visited[cy, cx_] = True
            nxt = [q for q in neighbours(cy, cx_) if q != (py, px) and not (visited[q] and nb[q] == 2)]
            if not nxt: break
            nxt.sort(key=lambda q: abs(q[0] - cy) + abs(q[1] - cx_)); py, px, (cy, cx_) = cy, cx_, nxt[0]
        return path
    for (y, x) in [tuple(p) for p in np.argwhere(sk & (nb != 2))]:
        for (ny, nx) in neighbours(y, x):
            if visited[ny, nx] and nb[ny, nx] == 2: continue
            path = walk(y, x, ny, nx)
            if len(path) > 2: paths.append(path)
    for (y, x) in [tuple(p) for p in np.argwhere(sk & (nb == 2))]:      # loops with no end point
        if visited[y, x]: continue
        visited[y, x] = True; n0 = neighbours(y, x)
        if n0: paths.append(walk(y, x, *n0[0]))
    out = []
    for p in paths:
        q = np.array(p, float); L = np.hypot(*np.diff(q, axis=0).T).sum()
        if L < minlen: continue
        w = 2.0 if dt is None else float(np.clip(2 * np.mean([dt[int(y), int(x)] for x, y in p]), 1.2, 9))
        out.append((L, measure.approximate_polygon(q, a.tol), round(w, 1)))
    out.sort(key=lambda t: -t[0]); return [(p, w) for _, p, w in out[:a.maxlines]]

frames, masks, inks, rots, grounds = [], [], [], [], []
if a.kind == 'disc':
    # 1. every frame: ink without the disc edge, and the circle of that edge
    inksF, circ = [], []
    for f in files:
        g = np.asarray(Image.open(f).convert('L'), np.uint8); ink = g < a.thr; H0, W0 = ink.shape
        lab, n = ndi.label(ink, structure=np.ones((3, 3))); sl = ndi.find_objects(lab); arc = np.zeros(n + 1, bool); sizes = ndi.sum(ink, lab, range(1, n + 1)); small = np.zeros(n + 1, bool)
        for k, z in enumerate(sl, 1):
            if z[1].stop - z[1].start > .45 * W0: arc[k] = True
            elif sizes[k - 1] < 5: small[k] = True
        pts = np.argwhere(arc[lab]); pts = pts[(pts[:, 0] > 12) & (pts[:, 0] < H0 - 12) & (pts[:, 1] > 12) & (pts[:, 1] < W0 - 12)]
        if len(pts) > 200: circ.append(fit_circle(pts[:, ::-1]))
        m = ink & ~arc[lab] & ~small[lab]; m[:9] = False; m[-9:] = False; m[:, :9] = False; m[:, -9:] = False; inksF.append(m)
    cx0, cy0, R = [float(np.median([c[i] for c in circ])) for i in range(3)]
    yy, xx = np.mgrid[0:H0, 0:W0]; PHI = np.arctan2(xx - cx0, yy - cy0)              # 0 = straight down from the disc centre
    # 2. the pitch between figures: autocorrelation of the angular ink histogram
    bins = np.linspace(-.75, .75, 1501); hist = [np.histogram(PHI[m], bins=bins)[0].astype(float) for m in inksF]; hs = [ndi.gaussian_filter1d(h, 6) for h in hist]
    ac = np.mean([np.correlate(h - h.mean(), h - h.mean(), 'full')[len(h) - 1:] for h in hs], axis=0); lo = int(.25 / .001); pitch = (lo + int(np.argmax(ac[lo:int(.9 / .001)]))) * .001
    if a.pitch: pitch = a.pitch
    # 3. per frame, the phase of the gaps between figures (least ink when the histogram is folded by the pitch), followed through the clip
    def gap_phase(h):
        centres = (bins[:-1] + bins[1:]) / 2; fold = np.zeros(200); idx = ((centres % pitch) / pitch * 200).astype(int) % 200; np.add.at(fold, idx, h); fold = ndi.gaussian_filter1d(fold, 5, mode='wrap'); return np.argmin(fold) / 200 * pitch
    ph = np.array([gap_phase(h) for h in hs]); un = [ph[0]]
    for v in ph[1:]:
        d = (v - un[-1] + pitch / 2) % pitch - pitch / 2; un.append(un[-1] + d)
    un = np.array(un)
    # 4. choose the figure (sector) that stays nearest to the middle and whole for the whole clip
    best = None
    for j in range(-3, 4):
        mid = un + pitch / 2 + j * pitch; ok = True; secs = []
        for k, m in enumerate(inksF[:-1] if a.drop_last else inksF):
            sec = m & (PHI > mid[k] - pitch / 2) & (PHI <= mid[k] + pitch / 2); xs = np.where(sec.any(axis=0))[0]
            if len(xs) == 0 or xs[0] < 12 or xs[-1] > W0 - 13:
                if a.verbose: print('  sector', j, 'frame', k, 'x range', (xs[0], xs[-1]) if len(xs) else None, 'mid %.1f deg' % np.degrees(mid[k]))
                ok = False; break
            secs.append(sec)
        if ok and (best is None or np.abs(mid).max() < best[0]): best = (np.abs(mid).max(), mid, secs)
    if best is None: sys.exit('no figure stays whole through the clip')
    print('disc centre (%.0f, %.0f) R=%.0f, pitch %.1f deg, drift %.2f deg per frame, figure at %.1f..%.1f deg' % (cx0, cy0, R, np.degrees(pitch), np.degrees(np.median(np.diff(un))), np.degrees(best[1][0]), np.degrees(best[1][-1])))
    for k, sec in enumerate(best[2]):
        cyk, cxk = ndi.center_of_mass(sec); fg = {'ink': sec.copy(), 'cx': cxk, 'cy': cyk}
        if not a.no_ground: drop_ground(fg)
        sil = ndi.binary_opening(ndi.binary_fill_holes(ndi.binary_closing(fg['ink'], structure=disk(a.close))), structure=disk(2)); lab, n = ndi.label(sil)
        if n: sizes = ndi.sum(sil, lab, range(1, n + 1)); sil = np.isin(lab, [q + 1 for q, z in enumerate(sizes) if z > .03 * sizes.max()])
        masks.append(sil); inks.append(fg['ink'] & sil); rots.append((-best[1][k], cx0, cy0)); grounds.append(fg.get('ground'))
else:
    for f in files:
        g = np.asarray(Image.open(f).convert('L'), np.uint8); ink = g > a.thr if a.kind == 'light' else g < a.thr
        sil = ndi.binary_fill_holes(ndi.binary_opening(ndi.binary_closing(ink, structure=disk(2)), structure=disk(1))); lab, n = ndi.label(sil)
        if n: sizes = ndi.sum(sil, lab, range(1, n + 1)); sil = np.isin(lab, [k + 1 for k, z in enumerate(sizes) if z > .02 * sizes.max()])
        masks.append(sil); inks.append(ink & sil); rots.append(None)

H, W = masks[0].shape
def derot(p, rot):
    if rot is None: return np.asarray(p, float)
    t, cx, cy = rot; q = np.asarray(p, float) - [cx, cy]; c, s_ = np.cos(t), np.sin(t)
    return np.c_[q[:, 0] * c + q[:, 1] * s_, -q[:, 0] * s_ + q[:, 1] * c] + [cx, cy]      # image coords: y down
raw = []
for sil, ink, rot in zip(masks, inks, rots):
    padded = np.pad(sil, 2).astype(float); outer = []
    for c in measure.find_contours(padded, .5):
        c = c - 2
        if len(c) < 12: continue
        p = measure.approximate_polygon(c[:, ::-1], a.tol)
        if len(p) >= 4: outer.append(derot(p[:-1], rot))
    outer.sort(key=lambda p: -len(p)); lines = []
    if a.kind == 'disc':
        dt = ndi.distance_transform_edt(ink); lines = [(derot(l, rot), w) for l, w in trace(morphology.skeletonize(ink), a.minline, dt)]
    raw.append((outer, lines))
allp = [np.vstack(o) for o, _ in raw if o]
ground = max(p[:, 1].max() for p in allp); top = min(p[:, 1].min() for p in allp)
ox = float(np.median([(p[:, 0].min() + p[:, 0].max()) / 2 for p in allp])) if a.kind != 'disc' else float(np.median([r[1] for r in rots]))
# vertical register: the pose's own ground stroke when the source has one, else the lowest point of the clip
gys = [float(derot([g], r)[0][1]) if g is not None else None for g, r in zip(grounds, rots)] if grounds else []
lows = [float(np.vstack(o)[:, 1].max()) for o, _ in raw]
gys = [g if (g is not None and -6 <= g - l <= 60) else None for g, l in zip(gys, lows)]      # a stroke far from the feet was not the ground
if gys and not a.no_ground and sum(g is not None for g in gys) >= len(gys) * .5:
    offs = [g - l for g, l in zip(gys, lows) if g is not None]; med = float(np.median(offs)); gys = [g if g is not None else l + med for g, l in zip(gys, lows)]
    print('gap above own ground, px:', ' '.join('%d' % round(g - l) for g, l in zip(gys, lows)))
else: gys = [ground] * len(raw)
top = min(float(np.vstack(o)[:, 1].min()) - g for (o, _), g in zip(raw, gys)) + ground
for (outer, lines), gy in zip(raw, gys):
    rel = lambda p, gy=gy: [[round(float(x - ox), 1), round(float(y - gy), 1)] for x, y in p]
    frames.append({'outer': [rel(p) for p in outer], 'lines': [{'w': w, 'p': rel(p)} for p, w in lines]})

meta = {'n': len(frames), 'fps': a.fps, 'h': int(ground - top), 'credit': a.credit, 'source': a.source, 'frames': frames}
line = 'registerClip(%s, %s);' % (json.dumps(a.name), json.dumps(meta, separators=(',', ':')))
head = '// Found motion for roto.js, written by roto.py. One line per clip; load this file after roto.js.'
old = [l for l in open(a.js).read().split('\n') if l.startswith('registerClip(')] if os.path.exists(a.js) else []
old = [l for l in old if not l.startswith('registerClip(%s,' % json.dumps(a.name))] + [line]
open(a.js, 'w').write('\n'.join([head] + old + ['']))

# check sheet: the vector redraw of every frame, ground line in blue
n = len(frames); fig_w = max(max(abs(x) for c in fr['outer'] for x, _ in c) for fr in frames if fr['outer']) * 2 + 40; fig_h = ground - top + 40
cols = min(n, 7); rows = (n + cols - 1) // cols; cw = 300; sc = cw / fig_w; ch = int(fig_h * sc)
sheet = Image.new('RGB', (cols * cw, rows * ch), 'white'); d = ImageDraw.Draw(sheet)
for k, fr in enumerate(frames):
    x0, y0 = (k % cols) * cw, (k // cols) * ch; T = lambda p: [(x0 + cw / 2 + x * sc, y0 + ch - 20 * sc + y * sc) for x, y in p]
    for c in fr['outer']: d.polygon(T(c), fill=(235, 225, 205), outline=(200, 40, 40))
    for l in fr['lines']: d.line(T(l['p']), fill=(20, 20, 20), width=max(1, int(round(l['w'] * sc))))
    d.line([(x0, y0 + ch - 20 * sc), (x0 + cw, y0 + ch - 20 * sc)], fill=(0, 80, 255)); d.text((x0 + 4, y0 + 2), str(k), fill=(0, 80, 255))
sheet.save(os.path.join(a.out, 'clip-%s.jpg' % a.name), quality=88)
pts = sum(len(c) for fr in frames for c in fr['outer']) + sum(len(l['p']) for fr in frames for l in fr['lines'])
print('%s: %d frames, figure %d px tall, %d points, %.0f KB -> %s' % (a.name, n, ground - top, pts, len(line) / 1024, a.js))
