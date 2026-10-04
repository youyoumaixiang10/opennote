# Mixes narration + a synthesized pluck music bed + SFX into assets/mix.wav
import json, subprocess, numpy as np, soundfile as sf
SR = 44100
tl = json.load(open("timeline.json"))
N = int(tl["total"] * SR)
voice = np.zeros(N); music = np.zeros(N); fx = np.zeros(N)

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)

def put(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N: buf[i:j] += sig[: j - i] * g

for l in tl["lines"]:
    put(voice, load(f"assets/voice/{l['id']}.wav"), l["start"], 1.0)

# --- music bed: Karplus-Strong plucks, C-G-Am-F at 104 bpm, deterministic ---
rng = np.random.default_rng(7)
def pluck(freq, dur=0.9, damp=0.996):
    n = int(dur * SR); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out * np.linspace(1, 0, n) ** 1.5
cache = {}
def note(midi, dur=0.9):
    k = (midi, dur)
    if k not in cache: cache[k] = pluck(440 * 2 ** ((midi - 69) / 12), dur)
    return cache[k]
beat = 60 / 104
chords = [[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]]
melody = [[72, 74, 76, 79], [74, 71, 74, 79], [76, 72, 69, 72], [77, 76, 74, 72]]
t = 0.0; bar = 0
while t < tl["total"] - 2:
    ch = chords[bar % 4]; mel = melody[bar % 4]
    for b in range(4):
        tb = t + b * beat
        put(music, note(ch[0] if b % 2 == 0 else ch[0] + 7, 1.2), tb, 0.55)
        for x in ch[1:]:
            put(music, note(x), tb + beat / 2, 0.22)
        if bar % 2 == 1:
            put(music, note(mel[b], 0.6), tb, 0.18)
    t += 4 * beat; bar += 1
music /= np.max(np.abs(music)) + 1e-9
# fade in/out
fi = int(1.0 * SR); music[:fi] *= np.linspace(0, 1, fi)
fo = int(3.0 * SR); end = int((tl["total"] - 0.5) * SR); music[end - fo:end] *= np.linspace(1, 0, fo); music[end:] = 0
# duck under narration
env = np.convolve(np.abs(voice), np.ones(4410) / 4410, mode="same")
duck = np.where(env > 0.01, 0.10, 0.22)
duck = np.convolve(duck, np.ones(8820) / 8820, mode="same")
music *= duck

# --- SFX ---
def tone_sweep(f0, f1, dur, wob=0.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + wob * np.sin(2 * np.pi * 18 * tt))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3)
synth = {
    "boing": tone_sweep(180, 520, 0.45, 0.12) * 0.5,
    "bonk": (tone_sweep(320, 90, 0.25) + rng.uniform(-1, 1, int(0.25 * SR)) * np.exp(-np.arange(int(0.25 * SR)) / SR * 30) * 0.6) * 0.7,
    "tick": tone_sweep(1200, 1100, 0.08) * 0.35,
}
ring1 = np.sin(2 * np.pi * 880 * np.arange(int(0.12 * SR)) / SR) * (np.sign(np.sin(2 * np.pi * 20 * np.arange(int(0.12 * SR)) / SR)) * 0.5 + 0.5)
synth["ring"] = np.concatenate([ring1, np.zeros(int(0.05 * SR)), ring1, np.zeros(int(0.25 * SR)), ring1, np.zeros(int(0.05 * SR)), ring1]) * 0.22
LIB = "../../.agents/skills/media-use/audio/assets/sfx/"
for s in tl["sfx"]:
    sig = synth.get(s["name"])
    if sig is None:
        sig = load(LIB + s["name"] + ".mp3") * 0.35
    put(fx, sig, s["t"])

mix = voice * 1.0 + music * 0.9 + fx
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
sf.write("assets/mix.wav", mix.astype(np.float32), SR)
print("ok", len(mix) / SR)
