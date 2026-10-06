# subtitles: export the page's own caption cues (window.SUBS, via events.json) to dan-koe-os.srt
import os, json, subprocess, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); LIB = os.environ['LIB']
ev = json.load(open(os.path.join(HERE, 'events.json')))
subs = next(e for e in ev['ev'] if e['type'] == 'cues')['subs']
json.dump([{'t0': s['t0'], 't1': s['t1'], 'text': s['text']} for s in subs], open(os.path.join(HERE, 'out/cues.json'), 'w'), ensure_ascii=False)
subprocess.run([sys.executable, os.path.join(LIB, 'core/render/srt.py'), os.path.join(HERE, 'out/cues.json'), os.path.join(HERE, 'dan-koe-os.srt')], check=True)
