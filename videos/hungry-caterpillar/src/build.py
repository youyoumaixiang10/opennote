#!/usr/bin/env python3
"""Build the video project from src/script.py.

  1. TTS every line (cached by text) -> audio/vo/<hash>.wav
  2. lay lines out on a timeline -> marks, captions, scene windows
  3. synthesise BGM + SFX, duck under the voice -> audio/mix.wav
  4. subset the Chinese font to the caption characters -> fonts/zh.woff2
  5. fill src/template.html -> index.html
Run from the project root:  python3 src/build.py
Needs: pip install kokoro-onnx soundfile numpy fonttools brotli, and the full
Noto Sans SC (weight 500) TTF at build/NotoSansSC-500.ttf (from Google Fonts).
"""
import hashlib
import html
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "src"))
from script import build_story  # noqa: E402

SR = 24000
VOICE, SPEED = "af_heart", 0.8
PAGE_TURN = 0.6


def tts(text):
    h = hashlib.md5(("%s|%s|%s" % (VOICE, SPEED, text)).encode()).hexdigest()[:10]
    path = "audio/vo/%s.wav" % h
    if not os.path.exists(path):
        os.makedirs("audio/vo", exist_ok=True)
        subprocess.run(["npx", "hyperframes", "tts", text, "-v", VOICE, "-s", str(SPEED), "-o", path, "--json"],
                       check=True, capture_output=True)
        print("  tts:", text)
    data, sr = sf.read(path, dtype="float32")
    assert sr == SR, sr
    if data.ndim > 1:
        data = data.mean(axis=1)
    return path, data


class Schedule:
    def __init__(self):
        self.t = 0.0
        self.marks, self.lines, self.sfx, self.scenes = {}, [], [], []
        self.cur = None

    def scene(self, sid, kind, **cfg):
        if self.scenes:
            self.scenes[-1]["end"] = self.t + PAGE_TURN
        self.scenes.append(dict(id=sid, kind=kind, start=round(self.t, 3), cfg=cfg))
        self.cur = sid
        self.mark("start")
        if len(self.scenes) > 1:
            self.fx("whoosh", 0.0, gain=0.8)
        self.t += 0.8

    def mark(self, k, off=0.0):
        self.marks["%s.%s" % (self.cur, k)] = round(self.t + off, 3)

    def fx(self, name, off=0.0, gain=1.0, **p):
        self.sfx.append((name, self.t + off, gain, p))

    def wait(self, d):
        self.t += d

    def say(self, k, en, zh, gap=0.35):
        path, data = tts(en)
        dur = len(data) / SR
        self.mark(k)
        self.marks["%s.%s.end" % (self.cur, k)] = round(self.t + dur, 3)
        self.lines.append(dict(path=path, data=data, start=self.t, dur=dur, en=en, zh=zh, scene=self.cur))
        self.t += dur + gap

    def finish(self):
        self.scenes[-1]["end"] = self.t
        return self.t


# ---------------------------------------------------------------- synth
def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def tone(f, dur, tau, partials=((1, 1.0),), attack=0.004):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in partials)
    e = env_exp(n, tau)
    a = int(attack * SR)
    e[:a] *= np.linspace(0, 1, a)
    return (y * e).astype(np.float32)


def lowpass(x, alpha):
    y = np.zeros_like(x)
    acc = 0.0
    al = np.broadcast_to(alpha, x.shape)
    for i in range(len(x)):
        acc += al[i] * (x[i] - acc)
        y[i] = acc
    return y


RNG = np.random.default_rng(7)


def sfx_whoosh():
    n = int(0.55 * SR)
    noise = RNG.standard_normal(n).astype(np.float32)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    alpha = 0.02 + 0.18 * shape
    return lowpass(noise, alpha) * shape * 0.5


def sfx_pop():
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    f = 380 + 900 * (t / t[-1])
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * env_exp(n, 0.035) * 0.6).astype(np.float32)


def sfx_boing():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 210 * np.exp(-t * 2.2) * (1 + 0.06 * np.sin(2 * np.pi * 18 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * env_exp(n, 0.09) * 0.55).astype(np.float32)


def bell(f, dur=1.4, tau=0.45):
    return tone(f, dur, tau, ((1, 1.0), (2.76, 0.35), (5.4, 0.12)))


def sfx_chime():
    a = bell(1046.5)
    b = bell(1318.5)
    out = np.zeros(len(a) + int(0.09 * SR), np.float32)
    out[: len(a)] += a
    out[int(0.09 * SR):] += b
    return out * 0.32


def sfx_ding(n=0):
    f = [523.25, 587.33, 659.25, 783.99, 880.0][n]
    return tone(f, 0.9, 0.22, ((1, 1.0), (4, 0.25), (10, 0.05))) * 0.5


def sfx_crunch():
    out = np.zeros(int(0.22 * SR), np.float32)
    for k, off in enumerate((0.0, 0.035, 0.08)):
        n = int(0.06 * SR)
        nz = RNG.standard_normal(n).astype(np.float32)
        nz = nz - lowpass(nz, 0.25)  # crude high-pass
        s = int(off * SR)
        out[s:s + n] += nz * env_exp(n, 0.015) * (0.7 - 0.15 * k)
    return out * 0.6


def sfx_tick():
    return tone(1600, 0.06, 0.012) * 0.25


def sfx_sad():
    out = []
    for f0, f1 in ((392, 370), (330, 294)):
        n = int(0.38 * SR)
        t = np.arange(n) / SR
        f = np.linspace(f0, f1, n)
        ph = 2 * np.pi * np.cumsum(f) / SR
        y = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.minimum(1, t / 0.03) * env_exp(n, 0.25)
        out.append(y)
    return (np.concatenate(out) * 0.22).astype(np.float32)


def sfx_sparkle():
    notes = [1046.5, 1318.5, 1568.0, 2093.0, 2637.0]
    out = np.zeros(int(1.4 * SR), np.float32)
    for i, f in enumerate(notes):
        b = bell(f, 1.0, 0.25) * 0.18
        s = int(i * 0.07 * SR)
        out[s:s + len(b)] += b
    return out


def sfx_grumble():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 75 * t + 3 * np.sin(2 * np.pi * 5 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))
    shape = np.sin(np.linspace(0, np.pi, n))
    return (y * shape * 0.35).astype(np.float32)


def sfx_grow():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 300 * 2 ** (t / t[-1] * 1.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    shape = np.sin(np.linspace(0, np.pi, n))
    return ((np.sin(ph) + 0.2 * np.sin(3 * ph)) * shape * 0.2).astype(np.float32)


SFX = dict(whoosh=sfx_whoosh, pop=sfx_pop, boing=sfx_boing, chime=sfx_chime, ding=sfx_ding, crunch=sfx_crunch,
           tick=sfx_tick, sad=sfx_sad, sparkle=sfx_sparkle, grumble=sfx_grumble, grow=sfx_grow)


def music_box_bed(total):
    """Gentle original music-box arpeggio loop, I-vi-IV-V in C, 92 bpm."""
    n = int(total * SR) + SR
    out = np.zeros(n, np.float32)
    eighth = 60 / 92 / 2
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    chords = [(60, 64, 67), (57, 60, 64), (53, 57, 60), (55, 59, 62)]
    pattern = [0, 1, 2, 3, 2, 1, 0, 2]  # 3 = root an octave up
    melody = [76, None, 74, None, 72, None, 74, None, 72, None, 69, None, 72, None, None, None,
              69, None, 72, None, 74, None, 72, None, 71, None, 74, None, 79, None, None, None]
    step = 0
    t = 0.0
    while t < total:
        bar = step // 8
        ch = chords[bar % 4]
        p = pattern[step % 8]
        note = ch[p] + 12 if p < 3 else ch[0] + 24
        y = tone(midi(note), 1.2, 0.35, ((1, 1.0), (2, 0.25), (3, 0.08))) * 0.16
        s = int(t * SR)
        e = min(n, s + len(y))
        out[s:e] += y[: e - s]
        if step % 8 == 0:
            b = tone(midi(ch[0] - 12), 2.4, 0.9, ((1, 1.0), (2, 0.2))) * 0.14
            e = min(n, s + len(b))
            out[s:e] += b[: e - s]
        # melody only on every other 4-bar phrase
        if (bar // 4) % 2 == 1:
            mi = melody[step % 32]
            if mi:
                m = tone(midi(mi + 12), 1.0, 0.4, ((1, 1.0), (2.0, 0.15))) * 0.12
                e = min(n, s + len(m))
                out[s:e] += m[: e - s]
        step += 1
        t += eighth
    return out[: int(total * SR)]


def smooth(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.concatenate([[0], x]))
    y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.full(len(x) - len(y), y[-1] if len(y) else 0)])


def mix(S, total):
    n = int(total * SR)
    vo = np.zeros(n, np.float32)
    for ln in S.lines:
        s = int(ln["start"] * SR)
        d = ln["data"][: n - s]
        vo[s:s + len(d)] += d
    peak = np.max(np.abs(vo)) or 1
    vo *= 0.85 / peak

    fx = np.zeros(n, np.float32)
    for name, t, gain, p in S.sfx:
        y = SFX[name](**p) * gain
        s = max(0, int(t * SR))
        e = min(n, s + len(y))
        fx[s:e] += y[: e - s]

    bed = music_box_bed(total)
    active = (np.abs(vo) > 0.02).astype(np.float32)
    active = np.minimum(1, smooth(active, 0.35) * 3)
    duck = 1 - 0.55 * smooth(active, 0.25)
    gain = np.full(n, 0.55, np.float32)
    # quieter, sleepier music while the caterpillar sleeps
    a, b = S.marks.get("fly.night"), S.marks.get("fly.day")
    if a and b:
        gain[int(a * SR):int(b * SR)] = 0.3
        gain = smooth(gain, 0.6)
    # fade in / out
    fi = int(1.0 * SR)
    gain[:fi] *= np.linspace(0, 1, fi)
    fo = int(2.5 * SR)
    gain[-fo:] *= np.linspace(1, 0, fo)
    out = vo + fx * 0.8 + bed * duck * gain
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    sf.write("audio/mix.wav", out, SR, subtype="PCM_16")


def subset_font(text):
    src = "build/NotoSansSC-500.ttf"
    chars = "".join(sorted(set(text + "，。！？……“”、：；（）0123456789")))
    subprocess.run([sys.executable, "-m", "fontTools.subset", src, "--text=" + chars,
                    "--flavor=woff2", "--output-file=fonts/zh.woff2", "--layout-features=*"], check=True)


def emit(S, total):
    sec = []
    for i, sc in enumerate(S.scenes):
        dur = round(sc["end"] - sc["start"], 3)
        sec.append('      <section id="%s" class="scene clip" data-start="%s" data-duration="%s" data-track-index="%d">'
                   '<div id="%s-page" class="page"></div></section>'
                   % (sc["id"], sc["start"], dur, 1 + i % 2, sc["id"]))
    caps = []
    lines = S.lines
    for i, ln in enumerate(lines):
        start = ln["start"]
        nxt = lines[i + 1]["start"] if i + 1 < len(lines) else total
        scene_end = next(s["end"] for s in S.scenes if s["id"] == ln["scene"]) - PAGE_TURN
        end = min(nxt - 0.1, scene_end + 0.1)
        if end - (start + ln["dur"]) > 3.0:
            end = start + ln["dur"] + 1.2
        caps.append('      <div class="cap clip" data-start="%.3f" data-duration="%.3f" data-track-index="20">'
                    '<div class="cap-in"><div class="en">%s</div><div class="zh">%s</div></div></div>'
                    % (start - 0.05, end - start + 0.05, html.escape(ln["en"]), html.escape(ln["zh"])))
    data = dict(marks=S.marks, scenes=[dict(id=s["id"], kind=s["kind"], start=s["start"], end=round(s["end"], 3),
                                            cfg=s["cfg"]) for s in S.scenes])
    tpl = open("src/template.html", encoding="utf-8").read()
    out = (tpl.replace("{{DURATION}}", "%.2f" % total)
              .replace("{{SCENES}}", "\n".join(sec))
              .replace("{{CAPTIONS}}", "\n".join(caps))
              .replace("{{DATA}}", json.dumps(data, ensure_ascii=False)))
    open("index.html", "w", encoding="utf-8").write(out)


def main():
    S = Schedule()
    build_story(S)
    total = round(S.finish() + 0.4, 2)
    print("lines: %d  scenes: %d  duration: %.1fs" % (len(S.lines), len(S.scenes), total))
    mix(S, total)
    subset_font("".join(ln["zh"] for ln in S.lines))
    emit(S, total)
    json.dump(dict(total=total, scenes=[(s["id"], s["start"], round(s["end"], 2)) for s in S.scenes]),
              open("build/timing.json", "w"), indent=1)
    used = {ln["path"] for ln in S.lines}
    for f in os.listdir("audio/vo"):
        if os.path.join("audio/vo", f) not in used:
            os.remove(os.path.join("audio/vo", f))


if __name__ == "__main__":
    main()
