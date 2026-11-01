// node tools/render.mjs <ep> stills <t1,t2,...> <outdir>   |   node tools/render.mjs <ep> video <out.mp4> [workers] [fps]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { chromium } from 'playwright';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.wav': 'audio/wav' };
const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = srv.address().port;
const [ep, mode, arg, n = '4', fpsArg = '24'] = process.argv.slice(2);
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?ep=${ep}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  return page;
}
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
if (mode === 'stills') {
  const out = process.argv[5]; fs.mkdirSync(out, { recursive: true });
  const page = await open(browser);
  const dur = await page.evaluate(() => window.DUR);
  console.log('DUR', dur.toFixed(2));
  for (const t of arg.split(',').map(Number)) {
    await page.evaluate(t => window.render(t), t);
    await page.screenshot({ path: `${out}/${ep}_${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 85 });
  }
} else if (mode === 'events') {
  const page = await open(browser);
  const tl = await page.evaluate(() => ({ DUR: window.TL.DUR, voice: window.TL.voice, sfx: window.TL.sfx, music: window.TL.music, shots: window.TL.shots.map(s => ({ t0: s.t0, dur: s.dur, lines: s.lines.map(l => ({ at: l.at, end: l.end, text: l.text, who: l.who })) })) }));
  fs.writeFileSync(arg, JSON.stringify(tl, null, 1)); console.log('DUR', tl.DUR.toFixed(2), 'voice', tl.voice.length, 'sfx', tl.sfx.length);
} else {
  const fps = +fpsArg, workers = +n;
  const p0 = await open(browser); const dur = await p0.evaluate(() => window.DUR); await p0.close();
  const N = Math.ceil(dur * fps), per = Math.ceil(N / workers), tmp = arg + '.parts'; fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now(); let done = 0;
  await Promise.all([...Array(workers)].map(async (_, w) => {
    const b = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
    const page = await open(b);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(fps), `${tmp}/p${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = w * per; i < Math.min(N, (w + 1) * per); i++) {
      await page.evaluate(t => window.render(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 240 === 0) console.log(`${done}/${N} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  }));
  fs.writeFileSync(`${tmp}/list.txt`, [...Array(workers)].map((_, w) => `file 'p${w}.mp4'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-c', 'copy', arg], { stdio: 'inherit' }).on('close', r));
  console.log('video', arg, N, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close(); srv.close();
