#!/bin/sh
# One command: picture + score + mix → dan-koe-os.mp4 (+ .srt). Needs the Lemo-Opuscar library (LIB) with deps installed.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
# Chromium: use the system one if Playwright's own isn't installed
[ -z "$PLAYWRIGHT_CHROME" ] && [ -x /opt/pw-browsers/chromium-1194/chrome-linux/chrome ] && export PLAYWRIGHT_CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
cd "$LIB"
node core/render/events.mjs "$HERE"
"$LIB/.venv/bin/python" "$HERE/music.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
"$LIB/.venv/bin/python" "$HERE/tools/srt.py"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-4} --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/dan-koe-os.mp4" 24 0
PT=$(python3 -c "import json;d=json.load(open('$HERE/events.json'));c=[e for e in d['ev'] if e['type']=='cues'][0];print(round(c['VE']['l23']-.3,2))")
node core/render/still.mjs "$HERE" "$PT" --q nosubs=1 --out "$HERE/out/poster" --prefix p_
cp "$HERE/out/poster/p_$PT.jpg" "$HERE/poster.jpg"
