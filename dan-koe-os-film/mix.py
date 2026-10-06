"""Foley + VO + score → mix.wav. Every stroke on the board makes its own marker sound, shaped by the engine's
hand-speed curve; pans follow the stroke's screen position. Marker/eraser/magnet/cap synthesis comes from the
whiteboard style's toolkit. Layers: room tone + wall clock | foley | VO | score (ducked under VO)."""
import sys, os, json, numpy as np, soundfile as sf, soxr
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, hp, noise, add, compress, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get('VOICE', os.path.join(HERE, 'voice/out'))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); VO, VE = C['VO'], C['VE']
rng = np.random.default_rng(11)
NS = int((DUR + 1) * SR)
fol, room, vo = np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
def db(x): return 10 ** (x / 20)
def dec(d, tau): return np.exp(-tt(d) / tau)

# ───────── marker on a glossy board
_band = {}
def band(n, lo, hi):                                      # cached long filtered noise, sliced randomly
    k = (lo, hi)
    if k not in _band: _band[k] = bp(rng.standard_normal(SR * 8), lo, hi, 2).astype(np.float32)
    b = _band[k]; i = int(rng.integers(0, len(b) - n - 1)); return b[i:i + n]
def marker(dur, length, kind, pen, z=1.):
    d = max(.03, dur); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 - .8 * np.cos(2 * np.pi * u)                    # hand speed (engine's prog derivative)
    if kind == 'dash': v = np.ones(n) * 1.2
    a = (v / 1.8) ** .8 * np.minimum(1, u * d / .006) * np.minimum(1, (1 - u) * d / .012)
    br = {'black': 1.0, 'black2': .97, 'orange': 1.12, 'green': .92}.get(pen, 1.)
    hiss = band(n, 2200 * br, 7500 * br) * (.55 + .45 * v / 1.8)       # felt on gloss
    body = band(n, 500 * br, 1500 * br) * .45
    grain = (rng.random(n) < .004 * (1 + v)) * rng.standard_normal(n) * .8   # tiny stick-slip ticks
    x = (hiss + body + bp(grain, 1500, 6000)) * a
    if kind != 'dash' and length > 140 and rng.random() < .28:          # the dry-erase squeak
        s0 = rng.uniform(.15, .55) * d; sd = min(d - s0, rng.uniform(.06, .16))
        if sd > .03:
            m = int(sd * SR); ts = np.arange(m) / SR; f0 = rng.uniform(1500, 2600) * br
            f = f0 * (1 + .03 * np.sin(2 * np.pi * rng.uniform(7, 13) * ts) + .05 * rng.standard_normal() * ts / sd)
            sq = np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
            sq *= np.sin(np.pi * ts / sd) ** 1.5 * .35
            i0 = int(s0 * SR); x[i0:i0 + m] += sq[:len(x) - i0]
    x[:int(.004 * SR)] += bp(rng.standard_normal(int(.004 * SR)), 2500, 6500) * np.linspace(1, 0, int(.004 * SR)) * 1.4   # nib lands
    return x * .32 * min(1.3, z ** .5)
def tap(z=1.):
    n = int(.03 * SR); x = bp(rng.standard_normal(n), 1800, 6000) * dec(.03, .004) * 1.2
    return x * .3 * min(1.3, z ** .5)

# ───────── other foley
def ring(fs, taus, amps, d):
    x = np.zeros(int(d * SR)); t = tt(d)
    for f, ta, am in zip(fs, taus, amps): x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / ta) * am
    return x
def magnet(big=0):
    d = .5; x = np.zeros(int(d * SR))
    c = bp(rng.standard_normal(int(.005 * SR)), 2000, 9000) * np.linspace(1, 0, int(.005 * SR)) * 1.5; x[:len(c)] += c
    x += ring([830, 1370, 2210, 3120], [.07, .05, .035, .02], [.35, .25, .15, .08], d)   # steel face of the board
    x += ring([140 + 30 * big], [.09 + .06 * big], [.9 + .6 * big], d) * .9          # board body thump
    return x * (.55 + .35 * big)
def magnet_off():
    d = .35; x = lp(rng.standard_normal(int(d * SR)), 1800) * np.minimum(1, tt(d) / .15) * dec(d, .1) * .25
    x[:int(.004 * SR)] += bp(rng.standard_normal(int(.004 * SR)), 2500, 8000) * .8
    return x
def cap_pop():
    d = .25; t = tt(d); x = np.zeros(len(t))
    sl = bp(rng.standard_normal(int(.07 * SR)), 1200, 5000) * np.linspace(.2, 1, int(.07 * SR)) * .35; x[:len(sl)] += sl   # cap sliding off
    i = int(.07 * SR); p = ring([1750, 3400], [.03, .012], [.8, .3], d - .07); x[i:i + len(p)] += p
    x[i:i + 60] += rng.standard_normal(60) * .9
    return x * .6
def cap_on():
    d = .2; x = np.zeros(int(d * SR))
    for k, o in enumerate([0, .045]):
        i = int(o * SR); c = bp(rng.standard_normal(int(.006 * SR)), 2500, 9000) * np.linspace(1, 0, int(.006 * SR)); x[i:i + len(c)] += c * (1 - .4 * k)
        r = ring([2600], [.015], [.4], .06); x[i:i + len(r)] += r
    return x * .7
def eraser(d, rewind=False):
    n = int(d * SR); t = tt(d)
    base = bp(rng.standard_normal(n), 250, 2600) * .6 + bp(rng.standard_normal(n), 2500, 6000) * .15
    if rewind: mod = .75 + .25 * np.sin(2 * np.pi * 9 * t)
    else: mod = .45 + .55 * np.abs(np.sin(np.pi * t / d * 7))            # zig-zag strokes
    a = np.minimum(1, t / .04) * np.minimum(1, (d - t) / .06)
    return base * mod * a * .5
def plop():
    d = .9; t = tt(d); x = np.zeros(len(t))
    f = 900 * np.exp(-t / .05) + 240; x += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .07) * .8
    x += bp(rng.standard_normal(len(t)), 900, 6000) * np.exp(-t / .12) * .35
    for k in range(5):                                   # droplets
        o = int(rng.uniform(.12, .6) * SR); dd = .05; fb = rng.uniform(1400, 3200)
        b = np.sin(2 * np.pi * np.cumsum(fb * (1 + tt(dd) * 8)) / SR) * dec(dd, .015) * .25; x[o:o + len(b)] += b[:len(x) - o]
    return x * .8
def tray_clack(v=1.):
    d = .6; x = np.zeros(int(d * SR))
    for k, (o, g) in enumerate([(0, 1), (.075, .45), (.13, .2)]):     # plastic bounces
        i = int(o * SR); c = bp(rng.standard_normal(int(.008 * SR)), 1200, 6000) * np.linspace(1, 0, int(.008 * SR)) * g
        x[i:i + len(c)] += c; r = ring([620, 1180, 2350], [.05, .04, .03], [.4, .3, .15], .2) * g; x[i:i + len(r)] += r
    return x * .7 * v
def thud(v=1.):
    d = .4; x = ring([95, 180], [.08, .05], [1, .4], d) + lp(rng.standard_normal(int(d * SR)), 600) * dec(d, .03) * .5
    return x * .7 * v
def whoosh(d, v=1.):
    n = int(d * SR); t = tt(d); sh = np.sin(np.pi * t / d) ** 2
    x = bp(rng.standard_normal(n), 300, 2400) * sh
    return x * .35 * v
def clock_tick(k):
    d = .25; x = bp(rng.standard_normal(int(.004 * SR)), 3000, 9000) * 1.2
    y = np.zeros(int(d * SR)); y[:len(x)] += x
    y += ring([1250 if k % 2 else 1480, 2900], [.018, .01], [.35, .15], d)
    return y * .22

def put(buf, x, t, g=1., pan=0.):
    if t < 0 or t >= DUR: return
    add(buf, np.asarray(x, np.float32), t, g, pan)

# ───────── place foley from events
for e in E:
    ty, t = e['type'], e['t']; pan = e.get('pan', 0) or 0; z = e.get('z', 1) or 1; off = db(-9) if e.get('on', 1) == 0 else 1
    if ty in ('stroke', 'write', 'dash'):
        g = .8 if ty == 'write' else 1.
        if e.get('len', 0) < 70 and e['dur'] < .03: g *= .35          # the 1297 tiny marks: a fast rattle, not 1297 hits
        put(fol, marker(e['dur'], e['len'], ty, e.get('pen'), z), t, off * g, pan)
    elif ty == 'tap': put(fol, tap(z), t, off, pan)
    elif ty == 'magnet': put(fol, magnet(0), t + .05, 1.1, -.05)
    elif ty == 'erase': put(fol, eraser(e['dur']), t, 1.1, .1)
    elif ty == 'cap': put(fol, cap_on(), t, 1.2, .45)
put(fol, cap_pop(), .05, .8, .35)                                    # the orange cap comes off before the first stroke

# pens flying in / out of frame
by_pen = {}
for e in E:
    if e['type'] in ('stroke', 'write', 'dash', 'tap'): by_pen.setdefault(e['pen'], []).append(e)
for pen, L in by_pen.items():
    L.sort(key=lambda e: e['t'])
    for a, b in zip(L, L[1:]):
        if b['t'] - (a['t'] + a['dur']) > .75:
            put(fol, whoosh(.38, .3), a['t'] + a['dur'], 1, .5); put(fol, whoosh(.42, .38), b['t'] - .42, 1, .4)
    put(fol, whoosh(.42, .4), L[0]['t'] - .42, 1, .4)

# camera whips and the long pull-back
for t0, d, v in [(VO['l05'] - .95, .9, .9), (VO['l11'] - .85, 1.1, .8), (VE['l17'] + .3, .9, .9), (VO['l20'] - .7, .8, .8),
                 (VO['l22'] - .2, 3.2, .35), (C['push0'] - .9, 1.2, .4)]:
    put(fol, whoosh(d, v), t0, 1, 0)

# ───────── room: tone + a wall clock (the hook, and the silence before the eraser)
room_tone = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .012
room[:, 0] += room_tone; room[:, 1] += np.roll(room_tone, 311)
ticks = list(np.arange(.5, VO['l02'], 1.0)) + list(np.arange(C['silence0'], C['erase0'] + .05, 1.0 / 1.6))
for k, t in enumerate(ticks):
    put(room, clock_tick(k), t, 1.3 if t > C['silence0'] - .1 else .8, -.45)
room = S.room(room, size=.35, mix=.25)

# ───────── VO (24k → 48k), gentle compression, a touch of room
vo_lines = json.load(open(os.path.join(HERE, 'voice/lines.json')))
vo_mono = np.zeros(NS, np.float32)
for L in vo_lines:
    y, sr = sf.read(os.path.join(VOICE, L['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y.astype(np.float32), sr, SR)
    i = int(VO[L['id']] * SR); vo_mono[i:i + len(y)] += y[:NS - i]
vo_mono = hp(vo_mono, 80); vo_mono = compress(vo_mono / (np.abs(vo_mono).max() + 1e-9) * .8, thr=.2, ratio=3.0, att=.004, rel=.1)
vo[:, 0] = vo_mono; vo[:, 1] = vo_mono
vo = vo * .85 + S.room(vo, size=.2, mix=.1) * .15

# ───────── score, ducked under VO
mus, _ = sf.read(os.path.join(HERE, 'music/score.wav')); mus = mus[:NS]
if len(mus) < NS: mus = np.pad(mus, ((0, NS - len(mus)), (0, 0)))
env = np.abs(vo_mono); win = int(.05 * SR)
env = np.convolve(env, np.ones(win) / win, 'same'); on = (env > .02).astype(np.float32)
att, rel = int(.06 * SR), int(.35 * SR); g = 0.
dk = np.zeros(NS, np.float32)
for j in range(0, NS, 240):
    tgt = on[j]; g += (tgt - g) * (240 / att if tgt > g else 240 / rel); dk[j:j + 240] = g
mus = mus * (1 - (1 - db(-9)) * dk)[:, None]
# the silence before the eraser: the score fades out completely
i0, i1 = int(C['silence0'] * SR), int((VO['l13'] - .05) * SR); f = int(.3 * SR)
mus[i0:i0 + f] *= np.linspace(1, 0, f)[:, None]; mus[i0 + f:i1] = 0

# ───────── balance by RMS: VO on top, score ~10 dB under, foley in between
def rms(x): return float(np.sqrt(np.mean(x[np.abs(x).max(1) > 1e-4] ** 2))) if np.any(np.abs(x) > 1e-4) else 1.
vo_r, mu_r, fo_r = rms(vo), rms(mus), rms(fol)
mix = vo + mus * (vo_r / mu_r) * db(-7.5) + fol * (vo_r / fo_r) * db(-12) + room
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out/stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
for name, x in [('vo', vo), ('music', mus * (vo_r / mu_r) * db(-7.5)), ('foley', fol * (vo_r / fo_r) * db(-12)), ('room', room)]:
    sf.write(os.path.join(HERE, 'out/stems', name + '.wav'), x[:int(DUR * SR)].astype(np.float32), SR)
print('rms vo/music/foley', round(20 * np.log10(vo_r), 1), round(20 * np.log10(mu_r), 1), round(20 * np.log10(fo_r), 1), 'peak', float(np.abs(mix).max()))
