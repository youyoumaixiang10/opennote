"""Original score — clockwork minimalism, 96 BPM, D major. Marimba ostinato, vibraphone, jazz bass (pizz),
woodblock clock, shaker, glockenspiel. One instrument joins per step of the pipeline (資料 → 检索 → 11 → 五领域 → 判断链);
a full stop before the eraser; everything stops after the final circle, leaving the cap click and one bell.
Reads events.json, writes music/score.wav (stereo 48k)."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ['LIB']; sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); VO, VE = C['VO'], C['VE']
B = C['BEAT']; BAR = 4 * B
S.seed(5)
N = []
def n(t, inst, p, d, v=.7, pan=0., g=1., **kw): N.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g, **kw))
q = lambda t: round(t / B) * B                      # snap to the beat grid
qb = lambda t: np.ceil(t / BAR - 1e-6) * BAR         # next bar line
def up(p, k): return S.name(S.midi(p) + k)

CH = {'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E'], 'Em': ['E', 'G', 'B'], 'F#m': ['F#', 'A', 'C#']}
ROOT = {'D': 'D2', 'Bm': 'B1', 'G': 'G1', 'A': 'A1', 'Em': 'E2', 'F#m': 'F#2'}
PROG = ['D', 'Bm', 'G', 'A']
def chord_at(t): return PROG[int(t // BAR) % 4]
def arp(ch, oct=4):
    r, t3, f5 = (S.midi(x + str(oct)) for x in CH[ch])
    if t3 < r: t3 += 12
    if f5 < r: f5 += 12
    return [r, f5, r + 12, f5, t3 + 12, f5, r + 12, f5]

def section(t0, t1, mar=0., bass=0., vib=0., tick=0., shak=0.):
    """fill [t0, t1) bar by bar on the global grid"""
    b = qb(t0) if t0 % BAR > .05 else t0
    while b < t1 - .05:
        ch = chord_at(b)
        for i, m in enumerate(arp(ch)):
            tt = b + i * B / 2
            if mar and tt < t1: n(tt, 'marimba', m, .3, (.6 if i % 2 == 0 else .46) * mar, -.15, .9)
        if bass:
            n(b, 'jazz_bass', ROOT[ch], 1.0, .7 * bass, 0, 1.1)
            if b + 2.5 * B < t1: n(b + 2.5 * B, 'jazz_bass', up(ROOT[ch], 7), .4, .5 * bass, 0, .9)
            if b + 3 * B < t1: n(b + 3 * B, 'jazz_bass', up(ROOT[ch], 12), .5, .55 * bass, 0, .9)
        if vib:
            for k, p in enumerate(CH[ch]): n(b, 'vibraphone', p + '4', BAR * .9, .42 * vib, (k - 1) * .35, .75)
        for i in range(4):
            tt = b + i * B
            if tt >= t1: break
            if tick: n(tt, 'woodblock', 'a' if i % 2 == 0 else 'b', None, .34 * tick, .35, .55)
            if shak:
                for h in (0, .5): n(tt + h * B, 'shaker', 'down' if h == 0 else 'up', None, .26 * shak, -.3, .35)
        b += BAR

writes = lambda pen, a, b: [e for e in E if e['type'] in ('write', 'stroke') and e.get('pen') == pen and a <= e['t'] < b]

# ── hook: a lone woodblock clock, one marimba note when 2.1亿 is finished
for k, t in enumerate(np.arange(q(.4), VO['l02'], B * 2)): n(t, 'woodblock', 'a' if k % 2 == 0 else 'c', None, .3, .3, .5)
o = writes('orange', 0, 4); hookEnd = max(e['t'] + e['dur'] for e in o)
n(hookEnd, 'marimba', 'D5', 1.2, .7, 0, 1.0); n(hookEnd, 'marimba', 'A5', 1.2, .5, .2, .8); n(hookEnd + .02, 'glockenspiel', 'D6', 1.5, .45, .3, .6)

# ── l02–l04: the ostinato starts; "一套系统" lands with vibes
section(VO['l02'], VE['l04'] + .8, mar=.75, tick=.6)
sysT = writes('orange', VO['l03'], VE['l03'] + 1)[0]['t']
for p in ['D4', 'F#4', 'A4', 'D5']: n(sysT, 'vibraphone', p, 2.4, .55, 0, .8)
n(sysT, 'jazz_bass', 'D2', 1.6, .7, 0, 1.0)

# ── l05–l09: personal, sparse vibes only (+ a soft clock)
section(VO['l05'] - .3, VO['l10'], vib=.75, tick=.25)
# l10: the broken line becomes whole → bass enters with the marimba
section(VO['l10'], VE['l10'] + .9, mar=.6, bass=1., vib=.6)

# ── l11–l12: the content system; 1297 marks = the clock speeds up (eighths) + shaker
section(VO['l11'], VE['l12'] + .2, tick=.8, shak=.9, mar=.35)
for t in np.arange(q(VO['l12']), VE['l12'], B / 2): n(t, 'woodblock', 'c', None, .28, -.2, .45)
# silence: silence0 → erase0 (nothing scored)

# ── l13: after the eraser lands — bass alone (检索 / 去重 / 深读), bowed vibes underneath
e0 = C['erase0']
section(q(VO['l13']), VE['l13'] + .3, bass=1., tick=.5)
n(VO['l13'], 'vibraphone_bowed', 'F#4', VE['l13'] - VO['l13'] + 1, .4, -.2, .6, attack=.4)
# l14: 11 frameworks → marimba joins; a bell on "11"
section(VE['l13'] + .3, VE['l14'] + .6, bass=1., mar=.75, tick=.5)
el = writes('orange', VO['l14'], VE['l14'] + 1); t11 = max(e['t'] for e in el if e['len'] > 100)
n(t11, 'glockenspiel', 'A6', 1.2, .6, .3, .7); n(t11 + .12, 'glockenspiel', 'D7', 1.2, .5, .3, .6)
# l15: five domains → vibes join; one bell per domain name
section(VO['l15'] - .4, VO['l16'] - .2, bass=1., mar=.75, vib=.6, tick=.5)
dom = sorted({round(e['t'], 1) for e in E if e['type'] == 'write' and e.get('pen') == 'black2' and VO['l15'] <= e['t'] < VE['l15']})
starts = [dom[0]] + [b for a, b in zip(dom, dom[1:]) if b - a > .6]
for k, t in enumerate(starts[:5]): n(t, 'glockenspiel', ['D6', 'E6', 'F#6', 'A6', 'B6'][k], .9, .45, .25, .6)
# l16–l17: the chain → everything, shaker on; a rising bell per node
section(VO['l16'] - .2, VE['l17'] + .8, bass=1., mar=.85, vib=.55, tick=.6, shak=.8)
boxes = sorted([e['t'] for e in E if e['type'] == 'stroke' and e.get('pen') in ('black', 'black2') and VO['l17'] - .6 <= e['t'] < VE['l17'] and e['len'] > 1500])
for k, t in enumerate(boxes[:5]): n(t, 'glockenspiel', ['A5', 'B5', 'C#6', 'D6', 'F#6'][k], .8, .45 + .04 * k, .25, .6)
# l18–l19: the example — pull back to bass + bowed vibes; "身份" circled = a vibes chord
section(VO['l18'] - .3, VE['l19'] + .9, bass=.8, tick=.3)
for p in ['B3', 'D4', 'F#4']: n(VO['l18'], 'vibraphone_bowed', p, VE['l19'] - VO['l18'] + .8, .35, 0, .55, attack=.5)
circ = [e for e in E if e['type'] == 'stroke' and e.get('pen') == 'orange' and VE['l19'] - .2 <= e['t'] < VE['l19'] + 1]
if circ:
    for p in ['F#4', 'A4', 'D5']: n(circ[0]['t'], 'vibraphone', p, 2, .55, .1, .8)
# l20–l21: bring a real question — marimba + bass, light
section(VO['l20'] - .2, VE['l21'] + .5, mar=.7, bass=.9, tick=.4)
# l22–l23: wide shot — the whole band once, then resolve on D
section(VO['l22'] - .2, VE['l23'] + .2, mar=.9, bass=1., vib=.7, tick=.6, shak=.7)
THEME = [(0, 'A5', .5), (.5, 'F#5', .5), (1, 'A5', 1), (2, 'D6', .5), (2.5, 'C#6', .5), (3, 'B5', 1), (4, 'A5', 1.5), (5.5, 'F#5', .5), (6, 'E5', .5), (6.5, 'F#5', .5), (7, 'D5', 1)]
tb = qb(VO['l22'])
for rep in range(4):
    for (o, p, d) in THEME:
        t = tb + rep * 8 * B + o * B
        if t < VE['l23']: n(t, 'glockenspiel', p, d * B, .42, .25, .6)
# l24: "迈出下一步" — a held D chord under the circle, then everything stops; the cap and one bell
for p in ['D3', 'A3', 'D4', 'F#4', 'A4']: n(VO['l24'], 'vibraphone', p, 2.4, .55, 0, .8)
n(VO['l24'], 'jazz_bass', 'D2', 2.2, .7, 0, 1.0)
cap = C['cap']
n(cap + .15, 'glockenspiel', 'D7', 3.5, .55, .3, .7)
# end card: soft marimba figure while it is written
for i, m in enumerate(arp('D') + arp('G') + arp('D')):
    t = C['endCard'] + i * B / 2
    if t < DUR - .8: n(t, 'marimba', m, .3, .32, -.2, .7)
n(DUR - 2.6, 'vibraphone', 'D4', 2.4, .35, -.2, .6); n(DUR - 2.6, 'vibraphone', 'A4', 2.4, .33, .2, .6); n(DUR - 2.6, 'jazz_bass', 'D2', 2.4, .5, 0, .8)

N = [x for x in N if not (C['silence0'] <= x['t'] < VO['l13'] - .05)]   # the silence stays empty
N.sort(key=lambda e: e['t'])
mix = S.render(N, dur=DUR + 1, master=False)
mix = S.room(mix, size=.4, mix=.15)
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
sf.write(os.path.join(HERE, 'music/score.wav'), mix.astype(np.float32), SR)
print('notes', len(N), 'peak', float(np.abs(mix).max()))
open(os.path.join(HERE, 'music/credits.txt'), 'w').write('\n'.join(S.credits(sorted({e['inst'] for e in N}))) + '\n')
