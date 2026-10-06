# Collect every CJK character drawn on the board (film.js) and write their stroke-order medians to fonts/hanzi.json.
# Source: hanzi-writer-data (Make Me a Hanzi; Arphic Public License). Usage: python3 tools/hanzi.py <hanzi-writer-data/package dir>
import json, os, re, sys
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
chars = sorted(set(re.findall(r'[一-鿿]', open(os.path.join(here, 'film.js'), encoding='utf-8').read())))
out, miss = {}, []
for c in chars:
    f = os.path.join(src, c + '.json')
    if os.path.exists(f): out[c] = [[[round(x), round(y)] for x, y in m] for m in json.load(open(f))['medians']]
    else: miss.append(c)
json.dump(out, open(os.path.join(here, 'fonts', 'hanzi.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'chars', 'missing:', ''.join(miss) or 'none')
