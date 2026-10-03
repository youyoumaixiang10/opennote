"""Build the Dear Zoo toddler-English video: TTS -> timeline -> index.html + audio.wav"""
import os, re, json, math, hashlib
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SCR = os.path.dirname(HERE)
SR = 24000
VOICE = 'af_heart'
_k = None


def tts(text, speed=0.86):
    global _k
    key = hashlib.md5(f'{VOICE}|{speed}|{text}'.encode()).hexdigest()[:12]
    p = f'{HERE}/assets/vo/{key}.wav'
    if not os.path.exists(p):
        if _k is None:
            from kokoro_onnx import Kokoro
            _k = Kokoro(f'{SCR}/kokoro-v1.0.onnx', f'{SCR}/voices-v1.0.bin')
        a, sr = _k.create(text, voice=VOICE, speed=speed, lang='en-us')
        # trim silence
        idx = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, idx[0] - 600): idx[-1] + 1800]
        sf.write(p, a, sr)
    a, sr = sf.read(p)
    return a.astype(np.float32)


# ---------------- SFX (synthesized) ----------------
def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e

def sfx_pop():
    n = int(0.22 * SR); t = np.arange(n) / SR
    f = 380 + 900 * np.exp(-t * 25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .06) * .5).astype(np.float32)

def sfx_ding(base=1318.5):
    n = int(1.0 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * base * m * t) * w for m, w in ((1, 1), (2.01, .35), (3.02, .12)))
    return (s * env(n, .003, .28) * .22).astype(np.float32)

def sfx_whoosh():
    n = int(0.6 * SR); rng = np.random.default_rng(3)
    x = rng.standard_normal(n)
    out = np.zeros(n); y = 0
    for i in range(n):
        a = 0.03 + 0.25 * math.sin(math.pi * i / n)
        y = y + a * (x[i] - y); out[i] = y
    return (out * np.sin(np.linspace(0, math.pi, n)) * .35).astype(np.float32)

def sfx_tick(f=880):
    n = int(0.18 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * env(n, .002, .05) * .3).astype(np.float32)

def sfx_boing():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 200 + 260 * np.sin(2 * np.pi * 6 * t) * np.exp(-t * 4) + 200 * t
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, .2) * .35).astype(np.float32)

def sfx_rumble():
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 55 * t) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 3.2 * t)))
    return (s * np.minimum(1, t / .03) * np.exp(-t * 1.5) * .45).astype(np.float32)

SFX = dict(pop=sfx_pop(), ding=sfx_ding(), whoosh=sfx_whoosh(), tick1=sfx_tick(660), tick2=sfx_tick(784),
           tick3=sfx_tick(988), boing=sfx_boing(), rumble=sfx_rumble(), chime=sfx_ding(1046.5))


def music(total):
    """gentle music-box loop: C-Am-F-G arpeggios"""
    n = int(total * SR); out = np.zeros(n, np.float32)
    bpm = 92; beat = 60 / bpm; step = beat / 2
    chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
    pat = [0, 1, 2, 3, 2, 1, 2, 1]
    note_n = int(1.2 * SR); tt = np.arange(note_n) / SR
    cache = {}
    t = 0.0; i = 0
    while t < total:
        ch = chords[(i // 8) % 4]; m = ch[pat[i % 8]] + 12
        if m not in cache:
            f = 440 * 2 ** ((m - 69) / 12)
            cache[m] = ((np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * 2 * f * tt)) * env(note_n, .004, .35)).astype(np.float32)
        s = int(t * SR); e = min(n, s + note_n)
        out[s:e] += cache[m][:e - s]
        if i % 8 == 0:  # soft bass
            fb = 440 * 2 ** ((ch[0] - 12 - 69) / 12)
            bn = int(beat * 4 * SR); bt = np.arange(bn) / SR
            b = np.sin(2 * np.pi * fb * bt) * env(bn, .01, .9) * .6
            e2 = min(n, s + bn); out[s:e2] += b[:e2 - s].astype(np.float32)
        t += step; i += 1
    return out * 0.05


# ---------------- timeline ----------------
class TL:
    def __init__(self):
        self.t = 0.0; self.audio = []; self.js = []; self.html = []; self.sub = []

    def say(self, text, speed=0.86, gap=0.35, caption=None):
        a = tts(text, speed)
        d = len(a) / SR
        self.audio.append((self.t, a, 1.0))
        start = self.t
        self.t += d + gap
        return start, d

    def sfx(self, name, at=None, vol=1.0):
        self.audio.append((self.t if at is None else at, SFX[name], vol))

    def wait(self, s):
        self.t += s

    def tw(self, s):
        self.js.append(s)


T = TL()
J = T.tw

ANIMALS = [
    dict(k='elephant', art='ref', a='an', adj='big', sound='Stomp! Stomp!', bubble='STOMP!', sfx='rumble',
         tpr='Big! Open your arms wide. So big!', praise='Great job!'),
    dict(k='giraffe', art='svg', a='a', adj='tall', sound='Up, up, up!', bubble='UP, UP!', sfx='boing',
         tpr='Tall! Stretch up high. Tall, tall, tall!', praise='Well done!'),
    dict(k='lion', art='svg', a='a', adj='fierce', sound='Roar!', bubble='ROAR!', sfx='rumble',
         tpr='Fierce! Show your claws, and roar! Roar!', praise='Super!'),
    dict(k='camel', art='svg', a='a', adj='grumpy', sound='Hmph!', bubble='HMPH!', sfx='tick1',
         tpr='Grumpy! Make a grumpy face. Hmph!', praise='Yes!'),
    dict(k='snake', art='svg', a='a', adj='scary', sound='Hissss!', bubble='HISSS!', sfx='whoosh',
         tpr='Scary! Oh no! Cover your eyes!', praise='Good job!'),
    dict(k='monkey', art='ref', a='a', adj='naughty', sound='Ooh ooh, ah ah!', bubble='OOH OOH!', sfx='boing',
         tpr='Naughty! He jumps and climbs everywhere. Silly monkey!', praise='Wonderful!'),
    dict(k='frog', art='svg', a='a', adj='jumpy', sound='Ribbit, ribbit!', bubble='RIBBIT!', sfx='boing',
         tpr='Jumpy! Jump, jump, jump, with the frog!', praise='Hooray!'),
    dict(k='puppy', art='svg', a='a', adj='perfect', sound='Woof! Woof!', bubble='WOOF!', sfx='pop',
         tpr='Perfect! Give him a big hug!', praise='Yay!'),
]

ART_SVG = {}
for a in ANIMALS:
    if a['art'] == 'svg':
        for layer in ('back', 'front'):
            s = open(f'{HERE}/assets/svg/{a["k"]}_{layer}.svg').read()
            s = s.replace(' id="ptail"', ' class="ptail"')
            ART_SVG[(a['k'], layer)] = s


def words_html(text, kw, sid):
    out = []
    for i, w in enumerate(text.split(' ')):
        core = re.sub(r'[^A-Za-z]', '', w).lower()
        cls = 'w kw' if core == kw else 'w'
        out.append(f'<span class="{cls}" id="{sid}-w{i}">{w}</span>')
    return ' '.join(out)


def kw_time(text, kw, start, d):
    i = text.lower().find(kw)
    return start + d * (0.12 + 0.85 * i / max(1, len(text)))


def art_custom(k, sid):
    return f'''<div class="artwrap"><div class="art" id="{sid}-art">
  <div class="clipbox"><div class="layer" id="{sid}-back">{ART_SVG[(k,'back')]}</div></div>
  <img class="layer" src="assets/p1_cut.png" id="{sid}-crate">
  <div class="clipbox"><div class="layer" id="{sid}-front">{ART_SVG[(k,'front')]}</div></div>
</div></div>'''


def art_ref(k, sid):
    if k == 'elephant':
        reveal = f'<img class="layer" src="assets/elephant_scene.png" id="{sid}-reveal">'
    else:
        reveal = f'''<div class="layer" id="{sid}-reveal"><img class="layer" src="assets/monkeycrate.png" id="{sid}-mk">
        <img src="assets/boy2.png" id="{sid}-boy" style="position:absolute;left:-26px;top:0;width:583px;height:887px;transform:translate(0px,30px) scale(1.18);transform-origin:90px 796px"></div>'''
    return f'''<div class="artwrap"><div class="art" id="{sid}-art">
  <img class="layer" src="assets/p1_cut.png" id="{sid}-crate">
  {reveal}
</div></div>'''


def scene_open(sid, start):
    T.html.append(f'<section class="clip scene" id="{sid}" data-start="{{S_{sid}}}" data-duration="{{D_{sid}}}" data-track-index="1">')


SCENES = []


def begin(sid):
    SCENES.append([sid, T.t, None])
    J(f'tl.fromTo("#{sid}", {{opacity:0}}, {{opacity:1, duration:.45}}, {T.t:.3f});')


def end(sid):
    J(f'tl.to("#{sid}", {{opacity:0, duration:.4}}, {T.t - .4:.3f});')
    SCENES[-1][2] = T.t


def story(sid, n, text, kw, speed=0.86, gap=0.45):
    """show a story line, speak it, highlight keyword"""
    t0 = T.t
    J(f'tl.fromTo("#{sid}-l{n}", {{opacity:0, y:24}}, {{opacity:1, y:0, duration:.5, ease:"power2.out"}}, {t0:.3f});')
    s, d = T.say(text, speed, gap)
    if kw:
        tk = kw_time(text, kw, s, d)
        J(f'tl.to("#{sid}-l{n} .kw", {{color:"#E3342B", scale:1.1, duration:.25, ease:"back.out(3)"}}, {tk:.3f});')
        J(f'tl.to("#{sid}-l{n} .kw", {{scale:1, duration:.3}}, {tk + .45:.3f});')
    return s, d


def your_turn(sid, dur=2.4):
    t0 = T.t
    J(f'tl.fromTo("#{sid}-yt", {{opacity:0, scale:.6}}, {{opacity:1, scale:1, duration:.3, ease:"back.out(2)"}}, {t0:.3f});')
    for i in range(3):
        J(f'tl.fromTo("#{sid}-yt .dot{i}", {{backgroundColor:"#ffffff"}}, {{backgroundColor:"#3BA55C", duration:.15}}, {t0 + .35 + i * dur / 3.4:.3f});')
    J(f'tl.to("#{sid}-yt", {{opacity:0, duration:.25}}, {t0 + dur - .1:.3f});')
    T.wait(dur)


def yt_html(sid):
    return f'<div class="yt" id="{sid}-yt"><span class="ytmouth"></span><b>Your turn!</b><i class="dot dot0"></i><i class="dot dot1"></i><i class="dot dot2"></i></div>'


def card_html(sid, word, cls='card'):
    first, rest = word[0].upper(), word[1:]
    return f'<div class="{cls}" id="{sid}-card"><span class="hole"></span><span class="cw"><em>{first}</em>{rest}</span></div>'


ADJ_ANIM = {
    'big': lambda q, t: f'tl.fromTo("{q}", {{scale:.4}}, {{scale:1.35, duration:.9, ease:"elastic.out(1,.5)"}}, {t:.3f});',
    'tall': lambda q, t: f'tl.fromTo("{q}", {{scaleY:.5}}, {{scaleY:1.9, duration:1.0, ease:"back.out(1.6)"}}, {t:.3f});',
    'fierce': lambda q, t: f'tl.fromTo("{q}", {{x:-10}}, {{x:10, duration:.06, repeat:13, yoyo:true, ease:"none"}}, {t:.3f});',
    'grumpy': lambda q, t: f'tl.fromTo("{q}", {{rotation:0, y:0}}, {{rotation:-7, y:22, duration:.8, ease:"power2.out"}}, {t:.3f});',
    'scary': lambda q, t: f'tl.fromTo("{q}", {{rotation:-4}}, {{rotation:4, duration:.12, repeat:9, yoyo:true, ease:"sine.inOut"}}, {t:.3f});',
    'naughty': lambda q, t: f'tl.fromTo("{q}", {{rotation:-10, y:0}}, {{rotation:10, y:-30, duration:.3, repeat:5, yoyo:true, ease:"sine.inOut"}}, {t:.3f});',
    'jumpy': lambda q, t: f'tl.fromTo("{q}", {{y:0}}, {{y:-70, duration:.28, repeat:7, yoyo:true, ease:"power1.out"}}, {t:.3f});',
    'perfect': lambda q, t: f'tl.fromTo("{q}", {{scale:.6}}, {{scale:1.15, duration:.8, ease:"elastic.out(1,.45)"}}, {t:.3f});',
}

ANIMAL_ACT = {
    'giraffe': lambda b, t: f'tl.fromTo("{b}", {{y:0}}, {{y:-70, duration:.9, repeat:1, yoyo:true, ease:"sine.inOut"}}, {t:.3f});',
    'lion': lambda b, t: f'tl.fromTo("{b}", {{rotation:-3}}, {{rotation:3, duration:.1, repeat:11, yoyo:true, transformOrigin:"385px 360px"}}, {t:.3f});',
    'camel': lambda b, t: f'tl.fromTo("{b}", {{rotation:0}}, {{rotation:-4, duration:.6, repeat:1, yoyo:true, transformOrigin:"440px 400px"}}, {t:.3f});',
    'snake': lambda b, t: f'tl.fromTo("{b}", {{rotation:-6}}, {{rotation:6, duration:.45, repeat:5, yoyo:true, ease:"sine.inOut", transformOrigin:"330px 420px"}}, {t:.3f});',
    'frog': lambda b, t: f'tl.fromTo("{b}", {{y:0}}, {{y:-90, duration:.28, repeat:7, yoyo:true, ease:"power1.out"}}, {t:.3f});',
    'puppy': lambda b, t: f'tl.fromTo("{b} .ptail", {{rotation:-18}}, {{rotation:18, duration:.16, repeat:15, yoyo:true, svgOrigin:"478 352"}}, {t:.3f});',
}

# ================= INTRO =================
sid = 'intro'
begin(sid)
T.html.append(f'''<section class="clip scene" id="{sid}" data-track-index="1">
  <div class="artwrap"><div class="art" id="{sid}-art"><img class="layer" src="assets/p1_cut.png"></div></div>
  <div class="title" id="{sid}-title"><span class="t1">Dear</span> <span class="t2">Zoo</span></div>
  <div class="subtitle" id="{sid}-sub">Let's read and say the animals!</div>
</section>''')
T.wait(.5)
J(f'tl.from("#{sid}-title .t1", {{y:-80, opacity:0, duration:.6, ease:"back.out(2)"}}, {T.t:.3f});')
J(f'tl.from("#{sid}-title .t2", {{y:-80, opacity:0, duration:.6, ease:"back.out(2)"}}, {T.t + .35:.3f});')
J(f'tl.from("#{sid}-art", {{x:420, duration:1.0, ease:"power3.out"}}, {.2:.3f});')
T.sfx('chime')
T.say('Dear Zoo!', 0.8, .6)
J(f'tl.from("#{sid}-sub", {{opacity:0, y:20, duration:.5}}, {T.t:.3f});')
T.say("Hello! Let's read a story about animals.", 0.88, .3)
T.say('Ready? Let\'s go!', 0.88, .8)
end(sid)

# ================= PAGE 1 =================
sid = 'p1'
begin(sid)
T.html.append(f'''<section class="clip scene" id="{sid}" data-track-index="1">
  <div class="artwrap"><div class="art" id="{sid}-art"><img class="layer" src="assets/p1_cut.png" id="{sid}-crate"></div></div>
  <div class="story"><p id="{sid}-l1">{words_html("I wrote to the zoo to send me a pet.", "zoo", sid + "l1")}</p></div>
  {card_html(sid, "zoo")}
  {yt_html(sid)}
</section>''')
T.wait(.4)
story(sid, 1, 'I wrote to the zoo to send me a pet.', 'zoo', .84, .6)
J(f'tl.fromTo("#{sid}-card", {{opacity:0, scale:.3, rotation:-20}}, {{opacity:1, scale:1, rotation:-5, duration:.6, ease:"back.out(2)"}}, {T.t:.3f});')
T.sfx('pop')
T.say('Zoo!', .75, .5)
T.say('Can you say, zoo?', .84, .2)
your_turn(sid, 2.4)
T.sfx('ding')
T.say('Zoo! Great job!', .86, .5)
J(f'tl.to("#{sid}-card", {{opacity:0, scale:.6, duration:.35}}, {T.t - .3:.3f});')
T.say('A pet is coming in a big box. Who could it be?', .88, .9)
end(sid)

# ================= ANIMALS =================
for idx, A in enumerate(ANIMALS):
    k = A['k']; sid = k
    l1 = (f'So they thought very hard, and sent me a {k}.' if k == 'puppy' else f'They sent me {A["a"]} {k}.')
    l2 = 'He was perfect!' if k == 'puppy' else f'He was too {A["adj"]}!'
    l3 = 'I kept him.' if k == 'puppy' else 'So I sent him back.'
    art = art_custom(k, sid) if A['art'] == 'svg' else art_ref(k, sid)
    T.html.append(f'''<section class="clip scene" id="{sid}" data-track-index="1">
  {art}
  <div class="burst" id="{sid}-burst"><svg viewBox="0 0 200 140"><polygon points="100,4 118,38 160,14 148,52 196,58 154,80 182,118 134,102 112,136 96,100 56,128 62,90 6,86 50,62 18,30 70,40" fill="#FFF3A6" stroke="#1d1714" stroke-width="4" stroke-linejoin="round"/></svg><span>{A["bubble"]}</span></div>
  <div class="count" id="{sid}-count"><span id="{sid}-n1">1</span><span id="{sid}-n2">2</span><span id="{sid}-n3">3</span></div>
  <div class="story">
    <p id="{sid}-l1">{words_html(l1, k, sid + "l1")}</p>
    <p id="{sid}-l2">{words_html(l2, A["adj"], sid + "l2")}</p>
    <p id="{sid}-l3" class="small">{words_html(l3, "", sid + "l3")}</p>
  </div>
  <div class="q" id="{sid}-q">Who's in the box?</div>
  {card_html(sid, k)}
  <div class="adj adj-{A["adj"]}" id="{sid}-adj"><span class="too">{'' if k == 'puppy' else 'too'}</span><span class="aw" id="{sid}-aw">{A["adj"]}</span></div>
  {yt_html(sid)}
  <div class="bye" id="{sid}-bye">Bye-bye, {k}!</div>
  {'<div class="hearts" id="puppy-hearts"><i>&#10084;</i><i>&#10084;</i><i>&#10084;</i></div>' if k == 'puppy' else ''}
</section>''')
    begin(sid)
    T.wait(.4)
    art_q = f'#{sid}-art'
    # --- guess
    J(f'tl.fromTo("#{sid}-q", {{opacity:0, y:30}}, {{opacity:1, y:0, duration:.45, ease:"back.out(2)"}}, {T.t:.3f});')
    T.say("Who's in the box?" if idx == 0 else ("Here comes another box!" if idx % 2 else "Another box! Who's in the box?"), .88, .35)
    tb = T.t
    J(f'tl.fromTo("#{sid}-burst", {{opacity:0, scale:.2, rotation:-15}}, {{opacity:1, scale:1, rotation:0, duration:.4, ease:"back.out(3)"}}, {tb:.3f});')
    J(f'tl.fromTo("{art_q}", {{rotation:-1.2}}, {{rotation:1.2, duration:.09, repeat:9, yoyo:true, ease:"sine.inOut", transformOrigin:"380px 740px"}}, {tb:.3f});')
    J(f'tl.to("{art_q}", {{rotation:0, duration:.1}}, {tb + .95:.3f});')
    T.sfx(A['sfx'], tb, .9)
    T.say(A['sound'], .86, .5)
    J(f'tl.to("#{sid}-burst", {{opacity:0, scale:.6, duration:.3}}, {T.t - .2:.3f});')
    s, d = T.say("Let's open it! One, two, three!", .84, .1)
    J(f'tl.fromTo("#{sid}-count", {{opacity:0}}, {{opacity:1, duration:.2}}, {s:.3f});')
    for i, frac in enumerate((.56, .72, .88)):
        tt = s + d * frac
        J(f'tl.fromTo("#{sid}-n{i+1}", {{scale:0, opacity:0}}, {{scale:1, opacity:1, duration:.3, ease:"back.out(3)"}}, {tt:.3f});')
        T.sfx(f'tick{i+1}', tt, .8)
    J(f'tl.to(["#{sid}-count", "#{sid}-q"], {{opacity:0, duration:.3}}, {T.t + .1:.3f});')
    # --- reveal
    tr = T.t + .1
    T.sfx('pop', tr); T.sfx('chime', tr + .05, .7)
    if A['art'] == 'svg':
        start_y = 360 if k != 'frog' else 300
        J(f'tl.fromTo("#{sid}-back", {{y:{start_y}}}, {{y:0, duration:.75, ease:"back.out(1.4)"}}, {tr:.3f});')
        J(f'tl.fromTo("#{sid}-front", {{y:{start_y}}}, {{y:0, duration:.75, ease:"back.out(1.4)"}}, {tr:.3f});')
    else:
        J(f'tl.fromTo("#{sid}-reveal", {{opacity:0, scale:.85}}, {{opacity:1, scale:1, duration:.55, ease:"back.out(2)", transformOrigin:"380px 760px"}}, {tr:.3f});')
        J(f'tl.to("#{sid}-crate", {{opacity:0, duration:.3}}, {tr:.3f});')
    T.wait(.9)
    story(sid, 1, l1, k, .84, .6)
    # --- word focus
    J(f'tl.fromTo("#{sid}-card", {{opacity:0, scale:.3, rotation:-20}}, {{opacity:1, scale:1, rotation:-5, duration:.6, ease:"back.out(2)"}}, {T.t:.3f});')
    T.sfx('pop')
    T.say(f'{k.capitalize()}!', .74, .55)
    T.say(f'Can you say, {k}?', .84, .2)
    your_turn(sid, 2.5)
    T.sfx('ding')
    T.say(f'{k.capitalize()}! {A["praise"]}', .86, .45)
    J(f'tl.to("#{sid}-card", {{opacity:0, scale:.6, duration:.35}}, {T.t - .3:.3f});')
    # --- adjective
    story(sid, 2, l2, A['adj'], .84, .4)
    ta = T.t
    J(f'tl.fromTo("#{sid}-adj", {{opacity:0}}, {{opacity:1, duration:.3}}, {ta:.3f});')
    J(ADJ_ANIM[A['adj']](f'#{sid}-aw', ta + .1))
    if k in ANIMAL_ACT:
        J(ANIMAL_ACT[k](f'#{sid}-' + ('front' if k == 'frog' else 'back'), ta + .2))
    elif k == 'elephant':
        J(f'tl.fromTo("#{sid}-reveal", {{scale:1}}, {{scale:1.08, duration:.6, repeat:1, yoyo:true, ease:"sine.inOut", transformOrigin:"380px 760px"}}, {ta + .2:.3f});')
    elif k == 'monkey':
        J(f'tl.fromTo("#{sid}-reveal", {{y:0}}, {{y:-26, duration:.3, repeat:5, yoyo:true, ease:"sine.inOut"}}, {ta + .2:.3f});')
    T.say(A['tpr'], .86, .6)
    J(f'tl.to("#{sid}-adj", {{opacity:0, duration:.3}}, {T.t - .3:.3f});')
    # --- ending
    if k == 'puppy':
        story(sid, 3, l3, '', .84, .3)
        th = T.t - 1.2
        for i in range(3):
            J(f'tl.fromTo("#puppy-hearts i:nth-child({i+1})", {{opacity:0, y:40, scale:.4}}, {{opacity:1, y:{-60 - i * 30}, scale:1, duration:1.2, ease:"power2.out"}}, {th + i * .3:.3f});')
        T.sfx('chime', th); T.sfx('ding', th + .5, .8)
        T.say('I love you, puppy!', .86, 1.4)
    else:
        story(sid, 3, l3, '', .84, .1)
        tb = T.t
        T.sfx('whoosh', tb)
        if A['art'] == 'svg':
            J(f'tl.to(["#{sid}-back", "#{sid}-front"], {{y:380, duration:.7, ease:"back.in(1.4)"}}, {tb:.3f});')
        else:
            J(f'tl.to("#{sid}-reveal", {{x:700, opacity:0, duration:.8, ease:"power2.in"}}, {tb:.3f});')
            J(f'tl.to("#{sid}-crate", {{opacity:1, duration:.3}}, {tb + .6:.3f});')
        J(f'tl.fromTo("#{sid}-bye", {{opacity:0, scale:.5}}, {{opacity:1, scale:1, duration:.4, ease:"back.out(2)"}}, {tb + .3:.3f});')
        J(f'tl.fromTo("#{sid}-bye", {{rotation:-4}}, {{rotation:4, duration:.25, repeat:5, yoyo:true}}, {tb + .7:.3f});')
        T.wait(.3)
        T.say(f'Bye-bye, {k}!', .86, .9)
    end(sid)

# ================= REVIEW =================
GRID_ART = {}
for A in ANIMALS:
    k = A['k']
    if A['art'] == 'svg':
        GRID_ART[k] = f'<div class="layer">{ART_SVG[(k,"back")]}</div><img class="layer" src="assets/p1_cut.png"><div class="layer">{ART_SVG[(k,"front")]}</div>'
    elif k == 'elephant':
        GRID_ART[k] = '<img class="layer" src="assets/elephant_scene.png">'
    else:
        GRID_ART[k] = '<img class="layer" src="assets/monkeycrate.png">'


CROP = dict(elephant=(30, 200, 470), monkey=(170, 225, 413))


def thumb(k, sid, extra=''):
    x, y, w = CROP.get(k, (125, 20, 468))
    sc = (500 if extra == 'big' else 290) / w
    return f'<div class="thumb {extra}" id="{sid}-{k}"><div class="tart"><div class="tin" style="transform:scale({sc:.3f}) translate({-x}px,{-y}px)">{GRID_ART[k]}</div></div><div class="tname">{k}</div></div>'


sid = 'review'
T.html.append(f'''<section class="clip scene plain" id="{sid}" data-track-index="1">
  <div class="rtitle" id="{sid}-title">Let's say them all!</div>
  <div class="grid">{''.join(thumb(A["k"], sid) for A in ANIMALS)}</div>
</section>''')
begin(sid)
T.wait(.3)
J(f'tl.from("#{sid}-title", {{opacity:0, y:-30, duration:.5}}, {T.t:.3f});')
T.say("The end of the story! Now, let's say them all again.", .88, .5)
for A in ANIMALS:
    k = A['k']
    t0 = T.t
    J(f'tl.fromTo("#{sid}-{k}", {{opacity:0, scale:.4}}, {{opacity:1, scale:1, duration:.45, ease:"back.out(2)"}}, {t0:.3f});')
    J(f'tl.to("#{sid}-{k}", {{scale:1.12, duration:.25, yoyo:true, repeat:1}}, {t0 + .5:.3f});')
    T.sfx('pop', t0)
    T.say(f'{k.capitalize()}!', .8, .2)
    T.wait(1.7)
T.say('Wow! You know all the animals!', .88, .8)
end(sid)

# ================= QUIZ =================
QUIZ = [('big', 'elephant', 'frog', 'Who was too big?', 'The elephant! He was too big!'),
        ('tall', 'snake', 'giraffe', 'Who was too tall?', 'The giraffe! He was too tall!'),
        ('jumpy', 'frog', 'camel', 'Who was jumpy?', 'The frog! Jump, jump!'),
        ('perfect', 'lion', 'puppy', 'Who was perfect?', 'The puppy! He was perfect!')]
for qi, (adj, a1, a2, q, ans) in enumerate(QUIZ):
    sid = f'quiz{qi}'
    correct = a1 if ans.lower().find(a1) >= 0 else a2
    T.html.append(f'''<section class="clip scene plain" id="{sid}" data-track-index="1">
  <div class="rtitle" id="{sid}-title">{q.replace(adj, f'<span class="kwq">{adj}</span>')}</div>
  <div class="pair">{thumb(a1, sid, 'big')}{thumb(a2, sid, 'big')}</div>
  {yt_html(sid)}
</section>''')
    begin(sid)
    T.wait(.3)
    J(f'tl.fromTo(["#{sid}-{a1}", "#{sid}-{a2}"], {{opacity:0, y:60}}, {{opacity:1, y:0, duration:.5, stagger:.15, ease:"back.out(1.6)"}}, {T.t:.3f});')
    if qi == 0:
        T.say("Let's play a game!", .88, .3)
    T.say(q, .84, .2)
    your_turn(sid, 2.6)
    tc = T.t
    wrong = a2 if correct == a1 else a1
    J(f'tl.to("#{sid}-{correct}", {{scale:1.1, borderColor:"#3BA55C", backgroundColor:"#EAF7E4", duration:.4, ease:"back.out(2)"}}, {tc:.3f});')
    J(f'tl.to("#{sid}-{wrong}", {{opacity:.25, scale:.9, duration:.4}}, {tc:.3f});')
    T.sfx('ding', tc)
    T.say(ans, .86, 1.0)
    end(sid)

# ================= OUTRO =================
sid = 'outro'
T.html.append(f'''<section class="clip scene" id="{sid}" data-track-index="1">
  {art_custom('puppy', sid)}
  <div class="title small" id="{sid}-title">The End</div>
  <div class="subtitle" id="{sid}-sub">Bye-bye! See you next time!</div>
  <div class="hearts" id="outro-hearts"><i>&#10084;</i><i>&#10084;</i><i>&#10084;</i></div>
</section>''')
begin(sid)
J(f'tl.from("#{sid}-title", {{opacity:0, scale:.5, duration:.6, ease:"back.out(2)"}}, {T.t + .2:.3f});')
J(ANIMAL_ACT['puppy'](f'#{sid}-back', T.t + .3))
for i in range(3):
    J(f'tl.fromTo("#outro-hearts i:nth-child({i+1})", {{opacity:0, y:40, scale:.4}}, {{opacity:1, y:{-60 - i * 30}, scale:1, duration:1.2, ease:"power2.out"}}, {T.t + .5 + i * .3:.3f});')
T.sfx('chime', T.t + .2)
T.wait(.4)
T.say('The end!', .84, .4)
J(f'tl.from("#{sid}-sub", {{opacity:0, y:20, duration:.5}}, {T.t:.3f});')
T.say('Bye-bye! See you next time!', .86, 2.0)
SCENES[-1][2] = T.t
J(f'tl.to("#{sid}", {{opacity:0, duration:.8}}, {T.t - .8:.3f});')

TOTAL = round(T.t + .1, 2)

# ---------------- audio mix ----------------
n = int(TOTAL * SR) + SR
mix = np.zeros(n, np.float32)
for t0, a, v in T.audio:
    s = int(t0 * SR); e = min(n, s + len(a)); mix[s:e] += a[:e - s] * v
bgm = music(TOTAL + 1)
# duck music under voice
voice = np.zeros(n, np.float32)
for t0, a, v in T.audio:
    if len(a) > SR * .5:
        s = int(t0 * SR); voice[s:s + len(a)] = 1
k = int(.25 * SR)
duck = np.convolve(voice, np.ones(k) / k, 'same')
mix[:len(bgm)] += bgm[:n] * (1 - .55 * np.clip(duck[:len(bgm)], 0, 1))
fade = int(1.5 * SR); end_i = int(TOTAL * SR)
mix[end_i - fade:end_i] *= np.linspace(1, 0, fade)
mix[end_i:] = 0
mix = mix[:end_i]
mix /= max(1.0, np.abs(mix).max() / .95)
sf.write(f'{HERE}/assets/audio.wav', mix, SR)

# ---------------- html ----------------
# scene timing: assign data-start/duration
html_body = '\n'.join(T.html)
for sid, s, e in SCENES:
    html_body = html_body.replace(f'id="{sid}" data-track-index="1"', f'id="{sid}" data-start="{s:.3f}" data-duration="{e - s:.3f}" data-track-index="1"', 1)
# all scene-local selectors are global times already
CSS = open(f'{HERE}/style.css').read()
page = f'''<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920, height=1080">
<title>Dear Zoo</title>
<script src="assets/gsap.min.js"></script>
<style>{CSS}</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="{TOTAL}">
<div class="bgfill"><div class="floor"></div></div>
{html_body}
<audio id="vo" src="assets/audio.wav" data-start="0" data-duration="{TOTAL}" data-track-index="10" data-volume="1"></audio>
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
{chr(10).join(T.js)}
window.__timelines["main"] = tl;
</script>
</body></html>'''
open(f'{HERE}/index.html', 'w').write(page)
json.dump([[s, round(a, 2), round(b, 2)] for s, a, b in SCENES], open(f'{HERE}/scenes.json', 'w'))
print('TOTAL', TOTAL, 'scenes', len(SCENES))
