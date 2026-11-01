#!/bin/sh
# sh build.sh ep1   → out/ep1.mp4  (voices → events → picture → score/mix → master)
set -e
EP=${1:-ep1}; HERE=$(cd "$(dirname "$0")" && pwd); cd "$HERE"
PY=${PY:-../venv/bin/python}; export KOKORO_DIR=${KOKORO_DIR:-../kokoro}
mkdir -p out voice/$EP
node tools/lines.mjs $EP > out/${EP}_lines.json
$PY tools/tts.py out/${EP}_lines.json voice/$EP
node tools/render.mjs $EP events out/${EP}_events.json
$PY tools/mix.py out/${EP}_events.json voice/$EP out/${EP}_mix.wav
[ -n "$AUDIO_ONLY" ] && exit 0
node tools/render.mjs $EP video out/${EP}_video.mp4 ${WORKERS:-4} 24
ffmpeg -y -loglevel error -i out/${EP}_video.mp4 -i out/${EP}_mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 30 -tune grain -pix_fmt yuv420p -movflags +faststart \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest out/$EP.mp4
ffmpeg -y -loglevel error -ss 3.5 -i out/$EP.mp4 -frames:v 1 -q:v 3 out/${EP}_poster.jpg
echo "done: out/$EP.mp4"
