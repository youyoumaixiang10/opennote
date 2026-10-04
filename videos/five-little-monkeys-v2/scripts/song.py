"""Five Little Monkeys v2 — composes, 'sings' (Kokoro TTS + WORLD retuning) and
mixes an original counting song. Writes assets/song.wav and song.json."""
import json, os, subprocess, numpy as np, soundfile as sf, pyworld as pw
from scipy.signal import resample_poly

SR = 44100
BPM = 112
B = 60 / BPM                      # one beat
BAR = 4 * B
NUMS = {5: "Five", 4: "Four", 3: "Three", 2: "Two", 1: "One"}

# ---------- melody: units = (text, [(midi, beats), ...]); None text = rest ----------
def verse(n):
    N = NUMS[n]
    noun = "monkeys" if n > 1 else "monkey"
    return [
        # line 1
        [(N, [(67, 1)]), ("little", [(64, .5), (64, .5)]), (noun, [(67, .5), (67, .5)]),
         ("on", [(64, .5)]), ("the", [(64, .5)]), ("bed", [(72, 1)]), (None, [(0, .5)]),
         ("bouncing", [(69, .5), (67, .5)]), ("high!", [(64, 1.5)]), (None, [(0, .5)])],
        # line 2
        [("One", [(65, 1)]), ("fell", [(65, .5)]), ("off,", [(64, .5)]), ("oh", [(62, .5)]), ("no!", [(67, 1.5)]),
         ("Bump!", [(60, 1)]), ("Oh", [(64, .5)]), ("my!", [(60, 1.5)]), (None, [(0, 1)])],
        # line 3
        [("Mama", [(67, .5), (67, .5)]), ("called", [(69, .5)]), ("the", [(67, .5)]), ("doctor:", [(72, .5), (69, .5)]),
         (None, [(0, 1)]), ("ring a ling a ling!", [(72, .5), (71, .5), (72, .5), (71, .5), (72, 1.5)]), (None, [(0, .5)])],
        # line 4
        [("No", [(67, .5)]), ("more", [(67, .5)]), ("jumping,", [(69, .5), (67, .5)]), ("monkeys!", [(64, .5), (64, .5)]),
         (None, [(0, 1)]), ("Beds", [(65, .5)]), ("are", [(65, .5)]), ("for", [(64, .5)]), ("sleeping!", [(62, 1), (60, 1.5)]), (None, [(0, .5)])],
    ]
ENDING = [
    [("No", [(67, 1)]), ("little", [(64, .5), (64, .5)]), ("monkeys", [(67, .5), (67, .5)]),
     ("bouncing", [(64, .5), (64, .5)]), ("on", [(64, .5)]), ("the", [(62, .5)]), ("bed.", [(60, 2)]), (None, [(0, 1)])],
    [("Five", [(67, 1)]), ("sleepy", [(69, .5), (67, .5)]), ("monkeys,", [(64, .5), (64, .5)]),
     ("all", [(65, 1)]), ("tucked", [(64, .5)]), ("in", [(62, .5)]), ("bed.", [(60, 2)]), (None, [(0, 1)])],
    [("Good", [(67, 2)]), ("night!", [(72, 4)]), (None, [(0, 2)])],
]
# chords per half bar for each 2-bar line (root midi, quality)
C, F, G, Am, G7 = (48, "M"), (53, "M"), (43, "7"), (45, "m"), (43, "7")
LINE_CHORDS = [[C, C, F, C], [F, G, C, C], [C, F, G, C], [C, Am, F, G]]
END_CHORDS = [[C, C, F, C], [C, F, G, C], [F, F, C, C]]
INTRO_CHORDS = [C, C, F, F, G, G, C, C]   # 4 bars
BREAK_CHORDS = [G, G]                      # 1-bar break between verses

# ---------- arrangement timeline ----------
units, lines_meta, chords, events = [], [], [], []
t = 0.0
def place_chords(cs):
    global t
    for i, ch in enumerate(cs):
        chords.append((t + i * BAR / 2, ch))
def place_line(line, tag):
    global t
    start = t
    words = []
    for text, notes in line:
        d = sum(b for _, b in notes) * B
        if text:
            units.append({"text": text, "start": t, "notes": [(m, b * B) for m, b in notes]})
            words.append({"text": text.replace(" a ", "-a-").replace("ring-a-ling-a ling", "ring-a-ling-a-ling"), "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    lines_meta.append({"tag": tag, "start": round(start, 3), "end": round(t, 3), "words": words})

place_chords(INTRO_CHORDS); events.append({"name": "intro", "t": 0}); t += 4 * BAR
for n in [5, 4, 3, 2, 1]:
    events.append({"name": f"verse{n}", "t": round(t, 3)})
    for i, line in enumerate(verse(n)):
        place_chords(LINE_CHORDS[i]); place_line(line, f"v{n}l{i+1}")
    events.append({"name": f"break{n}", "t": round(t, 3)})
    place_chords(BREAK_CHORDS); t += BAR
events.append({"name": "ending", "t": round(t, 3)})
for i, line in enumerate(ENDING):
    place_chords(END_CHORDS[i]); place_line(line, f"end{i+1}")
place_chords([C, C]); t += BAR
TOTAL = t + 1.5
N = int(TOTAL * SR)

# ---------- singing voice ----------
def tts(text, path):
    if not os.path.exists(path):
        subprocess.run(["npx", "-y", "hyperframes@latest", "tts", text, "-v", "af_heart", "-s", "1.0", "-o", path, "--json"],
                       check=True, capture_output=True)
    x, sr = sf.read(path)
    if x.ndim > 1: x = x.mean(1)
    # trim silence
    e = np.abs(x) > 0.02 * np.max(np.abs(x))
    idx = np.where(e)[0]
    x = x[max(0, idx[0] - 200): idx[-1] + 600]
    return x.astype(np.float64), sr

def midi_hz(m): return 440 * 2 ** ((m - 69) / 12)

def sing(unit):
    safe = "".join(c if c.isalnum() else "_" for c in unit["text"].lower())
    x, sr = tts(unit["text"].replace("!", "").replace(",", "").replace(":", "").replace(".", ""), f"assets/units/{safe}.wav")
    fp = 5.0
    f0, tt = pw.harvest(x, sr, frame_period=fp, f0_floor=80, f0_ceil=600)
    sp = pw.cheaptrick(x, f0, tt, sr)
    ap = pw.d4c(x, f0, tt, sr)
    total = sum(d for _, d in unit["notes"])
    sing_len = max(total - 0.06, 0.12)          # small breath gap
    nfr = int(sing_len * 1000 / fp)
    n0 = len(f0)
    # keep the first consonant-ish 60 ms unstretched, stretch the rest
    head = min(12, n0 // 3)
    src = np.concatenate([np.arange(head), np.linspace(head, n0 - 1, max(nfr - head, 1))])
    src_i = np.clip(np.round(src).astype(int), 0, n0 - 1)
    sp2, ap2 = sp[src_i], ap[src_i]
    voiced = f0[src_i] > 0
    # bridge short unvoiced gaps inside vowels so stretched vowels stay sung
    # target pitch per frame
    target = np.zeros(len(src_i))
    pos = 0.0
    bounds = []
    for m, d in unit["notes"]:
        a = int(pos / total * len(src_i)); pos += d; b = int(pos / total * len(src_i))
        bounds.append((a, b, midi_hz(m)))
    for a, b, hz in bounds:
        target[a:b] = hz
    target[target == 0] = bounds[-1][2]
    # portamento (smooth note changes over ~40 ms)
    k = 8
    sm = np.convolve(np.log(target), np.ones(k) / k, mode="same")
    sm[:k] = np.log(target[:k]); sm[-k:] = np.log(target[-k:])
    target = np.exp(sm)
    # gentle vibrato after 250 ms on long notes
    fr_t = np.arange(len(target)) * fp / 1000
    vib = np.where(fr_t > 0.25, 0.012 * np.sin(2 * np.pi * 5.5 * fr_t), 0)
    target *= (1 + vib)
    f0n = np.where(voiced, target, 0.0)
    # brighter, slightly younger timbre: warp spectral envelope up by 8 %
    fft = sp2.shape[1]
    srcbins = np.arange(fft) / 1.08
    sp3 = np.array([np.interp(srcbins, np.arange(fft), row) for row in sp2])
    y = pw.synthesize(f0n, np.ascontiguousarray(sp3), np.ascontiguousarray(ap2), sr, fp)
    y = resample_poly(y, SR, sr)
    fade = int(0.015 * SR)
    y[:fade] *= np.linspace(0, 1, fade); y[-fade * 2:] *= np.linspace(1, 0, fade * 2)
    return y

vocal = np.zeros(N)
for u in units:
    y = sing(u)
    i = int((u["start"] - 0.03) * SR)
    vocal[i:i + len(y)] += y[: max(0, N - i)]
vocal /= np.max(np.abs(vocal)) + 1e-9

# ---------- instruments ----------
rng = np.random.default_rng(3)
def ks(freq, dur, damp=0.995, bright=0.5):
    n = int(dur * SR); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        j = i % p
        out[i] = buf[j]
        buf[j] = damp * (bright * buf[j] + (1 - bright) * buf[(j + 1) % p])
    return out
cache = {}
def uke(m, dur=0.7):
    k = ("u", m)
    if k not in cache: cache[k] = ks(midi_hz(m), 0.9, 0.996) * np.exp(-np.arange(int(0.9 * SR)) / SR * 3)
    return cache[k][: int(dur * SR)]
def glock(m, dur):
    n = int(min(dur + 0.4, 1.2) * SR); tt = np.arange(n) / SR; f = midi_hz(m + 12)
    return (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt * 4)
def bass(m, dur):
    n = int(dur * SR); tt = np.arange(n) / SR; f = midi_hz(m - 12)
    return np.sin(2 * np.pi * f * tt) * np.minimum(1, tt * 60) * np.exp(-tt * 2.5)
def kick():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(np.linspace(140, 45, n)) / SR) * np.exp(-tt * 18)
def shaker():
    n = int(0.08 * SR); tt = np.arange(n) / SR
    return rng.uniform(-1, 1, n) * np.exp(-tt * 60) * 0.5
def clap():
    n = int(0.15 * SR); tt = np.arange(n) / SR
    return rng.uniform(-1, 1, n) * np.exp(-tt * 30)
KICK, SHK, CLP = kick(), shaker(), clap()
def put(buf, sig, tsec, g=1.0):
    i = int(tsec * SR); j = min(N, i + len(sig))
    if 0 <= i < N: buf[i:j] += sig[: j - i] * g

band = np.zeros(N); drums = np.zeros(N); glk = np.zeros(N)
def chord_notes(root, q):
    third = 3 if q == "m" else 4
    tones = [root + 12, root + 12 + third, root + 19]
    if q == "7": tones.append(root + 22)
    return tones
for (ct, (root, q)) in chords:
    # ukulele strum pattern: down on 1, down-up on 2 (per half bar)
    for off, g in [(0, 1.0), (B, 0.7), (B * 1.5, 0.5)]:
        for k2, m in enumerate(chord_notes(root, q)):
            put(band, uke(m), ct + off + k2 * 0.012, 0.35 * g)
    put(band, bass(root, B * 1.8), ct, 0.9)
end_music = TOTAL - 1.5
for k in range(int(end_music / B)):
    tb = k * B
    if tb < 4 * BAR - BAR:   # light intro: shaker only for first 3 bars
        put(drums, SHK, tb, 0.4); continue
    put(drums, KICK if k % 2 == 0 else CLP, tb, 0.8 if k % 2 == 0 else 0.25)
    put(drums, SHK, tb + B / 2, 0.35)
for u in units:
    tt0 = u["start"]
    for m, d in u["notes"]:
        put(glk, glock(m, d), tt0, 0.25); tt0 += d
# intro hook on glockenspiel
hook = [(67, 1), (64, .5), (64, .5), (67, .5), (67, .5), (64, .5), (64, .5), (72, 2), (69, .5), (67, .5), (64, 1.5)]
tt0 = BAR * 1
for m, b in hook:
    put(glk, glock(m, b * B), tt0, 0.45); tt0 += b * B

def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
mix = 0.95 * vocal + 0.42 * norm(band) + 0.28 * norm(drums) + 0.30 * norm(glk)
# fade out tail
fo = int(2.0 * SR); e = int(TOTAL * SR) - 1
mix[e - fo:e] *= np.linspace(1, 0, fo)
mix /= np.max(np.abs(mix)) / 0.92
sf.write("assets/song.wav", mix.astype(np.float32), SR)
sf.write("assets/vocal_only.wav", (vocal * 0.9).astype(np.float32), SR)
json.dump({"bpm": BPM, "beat": B, "bar": BAR, "total": round(TOTAL, 3), "events": events, "lines": lines_meta}, open("song.json", "w"), indent=1)
print("total", round(TOTAL, 2), "units", len(units))
