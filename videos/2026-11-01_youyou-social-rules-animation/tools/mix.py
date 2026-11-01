# venv/bin/python tools/mix.py events.json voice_dir out.wav
# Original score (ukulele, glockenspiel, music box, recorder, soft bass) driven by each shot's music state,
# procedural foley at event times, voices on top with the music ducked under them.
import json, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
ev = json.load(open(sys.argv[1])); VD = sys.argv[2]; OUT = sys.argv[3]
DUR = ev['DUR'] + 0.3; N = int(DUR * SR)
rng = np.random.default_rng(5)
def mf(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def add(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); buf[max(0, i):j] += g * x[max(0, -i): j - i]

# ---------- instruments ----------
def uke(f, d=1.4):
    t = np.arange(int(d * SR)) / SR; s = np.zeros_like(t)
    for n in range(1, 9): s += (1 / n ** 1.3) * np.sin(2 * np.pi * f * n * t + n) * np.exp(-t * (2.2 + n * 1.6))
    a = np.minimum(1, t / 0.004); return s * a * 0.35
def glock(f, d=1.8):
    t = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6) + 0.3 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t * 5) + 0.12 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t * 9)
    return s * np.minimum(1, t / 0.0015) * 0.3
def mbox(f, d=2.2):
    t = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 4)
    return s * np.exp(-t * 2.2) * np.minimum(1, t / 0.002) * 0.22
def bass(f, d=1.0):
    t = np.arange(int(d * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 2.4) * np.minimum(1, t / 0.02) * 0.32
def recorder(f, d):
    t = np.arange(int(d * SR)) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / 0.3)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    s = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.06) * np.minimum(1, (d - t) / 0.08)
    return s * env * 0.16
def shaker(d=0.06):
    n = int(d * SR); x = hp(rng.standard_normal(n), 5000); return x * np.exp(-np.arange(n) / SR * 60) * 0.05

# ---------- the score: F major, 3/4, a simple lilt ----------
BPM = 108; BEAT = 60 / BPM; BAR = 3 * BEAT
CH = [[60, 65, 69, 72], [60, 64, 67, 72], [62, 65, 69, 74], [62, 65, 70, 74], [60, 65, 69, 72], [60, 64, 67, 72], [62, 65, 70, 74], [60, 65, 69, 72]]
ROOT = [41, 36, 38, 34, 41, 36, 34, 41]
MEL = [[69, 72, 69], [67, 64, 67], [65, 69, 74], [74, 72, 70], [69, 72, 77], [76, 74, 72], [74, 72, 69], [65, None, None]]
tracks = {k: np.zeros(N) for k in ['soft', 'theme', 'happy', 'wait']}
nb = int(DUR / BAR) + 1
for b in range(nb):
    t0 = b * BAR; i = b % 8; ch = CH[i]
    # ukulele strum: beat 1 full, beats 2-3 light
    for bt in range(3):
        g = 1.0 if bt == 0 else 0.55
        for j, m in enumerate(ch):
            x = uke(mf(m)); add(tracks['soft'], x, t0 + bt * BEAT + j * 0.012, g * 0.8)
    add(tracks['soft'], bass(mf(ROOT[i] + 12)), t0, 0.9)
    for bt, m in enumerate(MEL[i]):
        if m: add(tracks['theme'], glock(mf(m + 12)), t0 + bt * BEAT, 0.8)
        if m: add(tracks['happy'], recorder(mf(m), BEAT * 0.95), t0 + bt * BEAT, 1.0)
    for e in range(6): add(tracks['happy'], shaker(), t0 + e * BEAT / 2, 1.0 if e % 2 == 0 else 0.6)
    # waiting: one music-box note per bar, the chord's top, very quiet
    add(tracks['wait'], mbox(mf(ch[-1] + 12)), t0, 1.0)
    if b % 2: add(tracks['wait'], mbox(mf(ch[1] + 12)), t0 + 1.5 * BEAT, 0.6)
# which tracks sound in which state
MIX = {'off': {}, 'soft': {'soft': 0.8}, 'theme': {'soft': 1.0, 'theme': 1.0}, 'happy': {'soft': 1.0, 'theme': 0.8, 'happy': 1.0}, 'wait': {'wait': 1.0}}
gains = {k: np.zeros(N) for k in tracks}
for seg in ev['music']:
    a, b = int(seg['t0'] * SR), int(seg['t1'] * SR)
    for k, g in MIX[seg['state']].items(): gains[k][a:b] = g
fade = int(0.45 * SR); ker = np.ones(fade) / fade
music = np.zeros(N)
for k in tracks: music += tracks[k] * np.convolve(gains[k], ker, 'same')

# ---------- foley ----------
fx = np.zeros(N)
def noise(d): return rng.standard_normal(int(d * SR))
def env(n, a, dec): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t * dec)
def S_step(): n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 95 * t) * np.exp(-t * 30) * 0.5 + lp(noise(0.12), 900) * env(n, 0.002, 40) * 0.25)
def S_thud(): n = int(0.4 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 11) + lp(noise(0.4), 400) * env(n, 0.003, 14) * 0.6) * 0.8
def S_whirr(): n = int(1.3 * SR); t = np.arange(n) / SR; return bp(noise(1.3), 1500, 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 16 * t)) * np.sin(np.pi * t / 1.3) * 0.12
def S_rustle(): n = int(0.5 * SR); return hp(noise(0.5), 2500) * env(n, 0.03, 7) * 0.12
def S_sand(): n = int(0.28 * SR); return bp(noise(0.28), 1800, 6000) * env(n, 0.02, 12) * 0.16
def S_ding(): return glock(mf(96), 2.2) * 0.55 + glock(mf(100), 2.2) * 0.35
def S_pop(): n = int(0.15 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (300 + 600 * np.exp(-t * 30)) * t) * np.exp(-t * 25) * 0.3
def S_ballthump(): n = int(0.3 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (140 * np.exp(-t * 4)) * t) * np.exp(-t * 14) * 0.6
def S_crunch():
    x = np.zeros(int(0.3 * SR))
    for i in range(6): add(x, hp(noise(0.02), 3000) * 0.3, i * 0.04 + rng.random() * 0.01)
    return x
def S_roll(): n = int(1.0 * SR); return lp(noise(1.0), 300) * np.sin(np.pi * np.arange(n) / n) * 0.25
def S_tap(): n = int(0.08 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * 0.25
SFX = {'step': S_step, 'thud': S_thud, 'whirr': S_whirr, 'rustle': S_rustle, 'sand': S_sand, 'ding': S_ding, 'pop': S_pop, 'ball': S_ballthump, 'crunch': S_crunch, 'roll': S_roll, 'tap': S_tap}
for e in ev['sfx']: add(fx, SFX[e['s']](), e['t'], e.get('g', 1.0))
# ambience: birds and a little air
amb = lp(noise(DUR), 500)[:N] * 0.004
t = 0.8
while t < DUR - 1:
    n = int(0.09 * SR); tt = np.arange(n) / SR; f0 = 3200 + rng.random() * 1500
    chirp = np.sin(2 * np.pi * (f0 + 1800 * tt / 0.09) * tt) * np.sin(np.pi * tt / 0.09) * 0.03
    add(amb, chirp, t); add(amb, chirp * 0.7, t + 0.13)
    t += 2.5 + rng.random() * 4

# ---------- voices ----------
voice = np.zeros(N)
for v in ev['voice']:
    x, sr = sf.read(f"{VD}/{v['file']}.wav"); x = resample_poly(x, SR, sr)
    x = hp(lp(x, 9000), 90)
    # gentle compression: tame peaks, then fixed RMS
    e = np.convolve(np.abs(x), np.ones(480) / 480, 'same'); g = np.where(e > 0.12, (0.12 / (e + 1e-9)) ** 0.5, 1.0); x = x * g
    x = x / (np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2)) + 1e-9) * 0.11
    add(voice, x, v['t'], v.get('gain', 1.0))
# a small warm room under the voice
ir_n = int(0.25 * SR); ir = lp(rng.standard_normal(ir_n), 3000) * np.exp(-np.arange(ir_n) / SR * 18); ir /= np.sqrt(np.sum(ir ** 2))
voice = voice + np.convolve(voice, ir)[:N] * 0.12
# duck the music under speech
ve = np.convolve(np.abs(voice), np.ones(2400) / 2400, 'same')
ve = np.convolve(ve, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same')
duck = 1 - 0.55 * np.minimum(1, ve / 0.03)
music = music * duck * 0.55
L = voice + fx * 0.9 + amb + music * 0.9
R = voice + fx * 0.9 + amb + music * 1.0
mix = np.stack([L, R], 1)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
sf.write(OUT, mix.astype(np.float32), SR)
print('mix', OUT, f'{DUR:.1f}s', 'peak', float(np.abs(mix).max()))
