# venv/bin/python tools/tts.py lines.json out_dir  → out_dir/<key>.wav (24 kHz mono) + out_dir/dur.json
import json, os, sys, warnings, numpy as np, soundfile as sf
warnings.filterwarnings('ignore')
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro
from misaki import zh
K = os.environ.get('KOKORO_DIR')
g2p = zh.ZHG2P(version='1.1')
k = Kokoro(f'{K}/kokoro-v1.1-zh.onnx', f'{K}/voices-v1.1-zh.bin', vocab_config=f'{K}/config.json')
# who: (voice, speaking speed, pitch factor) — pitch factor > 1 = a smaller, younger voice
CAST = {
  'nar':    ('zf_085', 0.86, 1.00),
  'mama':   ('zf_022', 0.86, 1.00),
  'baba':   ('zm_064', 0.88, 1.00),
  'nainai': ('zf_046', 0.80, 1.00),
  'doudou': ('zf_074', 0.92, 1.12),
  'mimi':   ('zf_073', 0.92, 1.22),
  'gaga':   ('zm_041', 0.95, 1.30),
  'guoguo': ('zm_020', 0.95, 1.22),
}
lines = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
durs = json.load(open(f'{out}/dur.json')) if os.path.exists(f'{out}/dur.json') else {}
for ln in lines:
    path = f"{out}/{ln['key']}.wav"
    if os.path.exists(path) and ln['key'] in durs and durs.get('_t_' + ln['key']) == ln['text']: continue
    voice, speed, pf = CAST[ln['who']]
    txt = ln['text'].replace('“', '').replace('”', '').replace('——', '，').replace('……', '，').replace('、', '，')
    ph, _ = g2p(txt)
    s, sr = k.create(ph, voice=voice, speed=speed / pf, is_phonemes=True)
    s = np.asarray(s, dtype=np.float64)
    if pf != 1.0:  # play faster: higher and smaller voice, same pace overall
        up, dn = 100, int(round(100 * pf)); s = resample_poly(s, up, dn)
    # trim silence, short fades, peak -3 dBFS
    env = np.convolve(np.abs(s), np.ones(240) / 240, 'same'); idx = np.where(env > 0.01)[0]
    if len(idx): s = s[max(0, idx[0] - 600): idx[-1] + 1200]
    f = 240; s[:f] *= np.linspace(0, 1, f); s[-f:] *= np.linspace(1, 0, f)
    s = s / (np.abs(s).max() + 1e-9) * 0.7
    sf.write(path, s.astype(np.float32), sr)
    durs[ln['key']] = round(len(s) / sr, 3); durs['_t_' + ln['key']] = ln['text']
    print(ln['key'], ln['who'], durs[ln['key']], ln['text'])
json.dump(durs, open(f'{out}/dur.json', 'w'), ensure_ascii=False, indent=1)
