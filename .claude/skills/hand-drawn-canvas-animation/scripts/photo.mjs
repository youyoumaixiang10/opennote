// Prepare a found photo for a doodle film: cut the object out of its plain background,
// crop it, and register it in photos.js as a data URL (so the canvas never gets tainted
// and the film still opens from file://). Also writes a check sheet with a coordinate grid.
//
// Usage:
//   node photo.mjs teapot.jpg --name teapot --credit "Teapot, ca. 1755, The Met, CC0" --source https://...
//   node photo.mjs cup.jpg --name cup --punch 0.87,0.35       also clear an enclosed hole (inside a handle); u,v read off the check sheet
//   node photo.mjs cut.png --name boot --keep                 the file already has alpha: only crop and register
//   node photo.mjs flat.jpg --name card --flood --tol 34 --local 10 --shadow 60   no matting model: flood the plain background from the borders
//   node photo.mjs x.jpg --name x --max 1300 --js photos.js --out out
//
// The cut: if `rembg` is on PATH (pip install "rembg[cpu,cli]", or REMBG=/path/to/rembg) it does the matting, and that
// is what you want for museum and product shots with graded backdrops and cast shadows. Without it, or with --flood,
// the background is flooded from the borders by colour, which only holds on flat, evenly lit backgrounds.
// Look at out/photo-<name>.jpg afterwards: magenta must not show through the object, no halo, no backdrop left in holes.
import puppeteer from 'puppeteer-core';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const file = argv.find(a => /\.(jpe?g|png|webp)$/i.test(a));
const flag = (n, d) => { const k = argv.indexOf(n); return k >= 0 ? argv[k + 1] : d; };
const name = flag('--name');
if (!file || !name) { console.error('usage: node photo.mjs image.jpg --name <id> [--tol 34] [--local 10] [--shadow 0] [--keep] [--max 1100] [--credit "..."] [--source url]'); process.exit(2); }
const opt = { tol: +flag('--tol', 34), local: +flag('--local', 10), shadow: +flag('--shadow', 0), keep: argv.includes('--keep'), max: +flag('--max', 1300),
  punch: (flag('--punch', '') || '').split(';').filter(Boolean).map(p => p.split(',').map(Number)), punchTol: +flag('--punch-tol', 42) };
const jsFile = path.resolve(flag('--js', 'photos.js')), outDir = path.resolve(flag('--out', 'out'));
mkdirSync(outDir, {recursive: true});

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) { try { return execFileSync('which', [bin]).toString().trim(); } catch {} }
  throw new Error('No Chrome found. Set CHROME=/path/to/chrome');
}

let input = file;
if (!opt.keep && !argv.includes('--flood')) {   // matting model first, colour flood as the fallback
  const cut = path.join(outDir, `photo-${name}-cut.png`);
  try { execFileSync(process.env.REMBG || 'rembg', ['i', '-m', flag('--model', 'isnet-general-use'), file, cut], {stdio: 'ignore'}); input = cut; opt.keep = true; console.log('cut by rembg'); }
  catch { console.warn('rembg not found or failed: flooding the background by colour instead (fine for flat backgrounds only)'); }
}
const mime = /\.png$/i.test(input) ? 'image/png' : /\.webp$/i.test(input) ? 'image/webp' : 'image/jpeg';
const dataUrl = `data:${mime};base64,` + readFileSync(input).toString('base64');

const browser = await puppeteer.launch({executablePath: findChrome(), headless: true});
let res;
try {
  const page = await browser.newPage();
  await page.goto('about:blank');
  res = await page.evaluate(async (dataUrl, opt) => {
    const img = new Image(); img.src = dataUrl; await img.decode();
    const k = Math.min(1, opt.max / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, w, h);
    const id = g.getImageData(0, 0, w, h), d = id.data, bg = new Uint8Array(w * h);
    if (!opt.keep) {
      // background model: the colour of each row at the left and right borders (studio backdrops grade vertically)
      const m = Math.max(2, Math.round(w * .02)), rowL = [], rowR = [];
      for (let y = 0; y < h; y++) { const a = [0, 0, 0], b = [0, 0, 0]; for (let x = 0; x < m; x++) for (let ch = 0; ch < 3; ch++) { a[ch] += d[(y * w + x) * 4 + ch] / m; b[ch] += d[(y * w + w - 1 - x) * 4 + ch] / m; } rowL.push(a); rowR.push(b); }
      const dist = (i, r, gg, b) => Math.hypot(d[i] - r, d[i + 1] - gg, d[i + 2] - b);
      const isBg = (x, y, from) => { const i = (y * w + x) * 4, t = x / (w - 1), L = rowL[y], R = rowR[y];
        const r0 = L[0] + (R[0] - L[0]) * t, g0 = L[1] + (R[1] - L[1]) * t, b0 = L[2] + (R[2] - L[2]) * t;
        if (from >= 0 && dist(i, d[from], d[from + 1], d[from + 2]) > opt.local) return false;
        if (dist(i, r0, g0, b0) <= opt.tol) return true;
        if (opt.shadow) { const lum = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, l0 = r0 * .3 + g0 * .59 + b0 * .11, s = lum / Math.max(1, l0);   // a shadow is the backdrop, darker, same hue
          if (l0 - lum > 0 && l0 - lum <= opt.shadow && Math.hypot(d[i] - r0 * s, d[i + 1] - g0 * s, d[i + 2] - b0 * s) < 14) return true; }
        return false; };
      const stack = []; const push = (x, y, from) => { const p = y * w + x; if (bg[p]) return; if (!isBg(x, y, from)) return; bg[p] = 1; stack.push(p); };
      for (let x = 0; x < w; x++) { push(x, 0, -1); push(x, h - 1, -1); } for (let y = 0; y < h; y++) { push(0, y, -1); push(w - 1, y, -1); }
      while (stack.length) { const p = stack.pop(), x = p % w, y = (p / w) | 0, from = p * 4; if (x > 0) push(x - 1, y, from); if (x < w - 1) push(x + 1, y, from); if (y > 0) push(x, y - 1, from); if (y < h - 1) push(x, y + 1, from); }
    } else for (let p = 0; p < w * h; p++) bg[p] = d[p * 4 + 3] < 8 ? 1 : 0;
    if (opt.punch.length) {   // enclosed holes: flood from a seed given in cutout units, by likeness to the seed colour
      let bx0 = w, by0 = h, bx1 = 0, by1 = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!bg[y * w + x]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
      const pad0 = 3; bx0 = Math.max(0, bx0 - pad0); by0 = Math.max(0, by0 - pad0); bx1 = Math.min(w - 1, bx1 + pad0); by1 = Math.min(h - 1, by1 + pad0);
      for (const [u, v] of opt.punch) { const sx = Math.round(bx0 + u * (bx1 - bx0)), sy = Math.round(by0 + v * (by1 - by0)), si = (sy * w + sx) * 4, sr = d[si], sgn = d[si + 1], sb = d[si + 2], st = [sy * w + sx]; bg[sy * w + sx] = 1;
        while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) { if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const np = ny * w + nx, i = np * 4; if (bg[np]) continue;
            if (Math.hypot(d[i] - sr, d[i + 1] - sgn, d[i + 2] - sb) > opt.punchTol || Math.hypot(d[i] - d[p * 4], d[i + 1] - d[p * 4 + 1], d[i + 2] - d[p * 4 + 2]) > 12) continue; bg[np] = 1; st.push(np); } } }
      opt.grow = true; }
    // mask -> grow the background by 1 px (eats the fringe), then feather
    const mk = document.createElement('canvas'); mk.width = w; mk.height = h; const mg = mk.getContext('2d'); const mi = mg.createImageData(w, h);
    for (let p = 0; p < w * h; p++) { let b = bg[p]; if (!b && (!opt.keep || opt.grow)) { const x = p % w, y = (p / w) | 0; if ((x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) || (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w])) b = 1; } mi.data[p * 4 + 3] = b ? 0 : 255; }
    mg.putImageData(mi, 0, 0);
    const soft = document.createElement('canvas'); soft.width = w; soft.height = h; const sg = soft.getContext('2d'); sg.filter = 'blur(0.8px)'; sg.drawImage(mk, 0, 0); sg.filter = 'none';
    sg.globalCompositeOperation = 'source-in'; sg.drawImage(cv, 0, 0);   // the image keeps its own alpha under the mask
    // bounding box of what is left
    const a = sg.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0, kept = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 24) { kept++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (!kept) return { error: 'nothing left after the cut: lower --tol' };
    const pad = 3; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const cw = x1 - x0 + 1, chh = y1 - y0 + 1, out = document.createElement('canvas'); out.width = cw; out.height = chh; out.getContext('2d').drawImage(soft, -x0, -y0);
    // check sheet: on magenta (holes and halos show), and on paper with a grid in photo units
    const s = 760 / Math.max(cw, chh), sw = Math.round(cw * s), sh = Math.round(chh * s), sheet = document.createElement('canvas'); sheet.width = 2 * (sw + 80); sheet.height = sh + 80; const q = sheet.getContext('2d');
    q.fillStyle = '#ff00c8'; q.fillRect(0, 0, sw + 80, sh + 80); q.drawImage(out, 40, 40, sw, sh);
    q.fillStyle = '#f3ead8'; q.fillRect(sw + 80, 0, sw + 80, sh + 80); q.drawImage(out, sw + 120, 40, sw, sh);
    q.font = '13px ui-monospace, Menlo, monospace'; q.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const u = i / 10, x = sw + 120 + u * sw, y = 40 + u * sh; q.strokeStyle = i % 5 ? 'rgba(0,80,255,.35)' : 'rgba(0,80,255,.8)'; q.beginPath(); q.moveTo(x, 40); q.lineTo(x, 40 + sh); q.moveTo(sw + 120, y); q.lineTo(sw + 120 + sw, y); q.stroke();
      q.fillStyle = '#0038b8'; q.fillText(u.toFixed(1), x - 9, 30); q.fillText(u.toFixed(1), sw + 88, y + 4); }
    return { src: out.toDataURL('image/webp', .92), w: cw, h: chh, kept: kept / (w * h), sheet: sheet.toDataURL('image/jpeg', .9) };
  }, dataUrl, opt);
} finally { await browser.close(); }
if (res.error) { console.error(res.error); process.exit(1); }

const sheetFile = path.join(outDir, `photo-${name}.jpg`);
writeFileSync(sheetFile, Buffer.from(res.sheet.split(',')[1], 'base64'));
const meta = { w: res.w, h: res.h, credit: flag('--credit', ''), source: flag('--source', ''), src: res.src };
const line = `registerPhoto(${JSON.stringify(name)}, ${JSON.stringify(meta)});`;
const head = '// Photos for the doodle look, written by photo.mjs. One line per photo; load this file after core.js.';
let lines = existsSync(jsFile) ? readFileSync(jsFile, 'utf8').split('\n').filter(l => l.startsWith('registerPhoto(')) : [];
lines = lines.filter(l => !l.startsWith(`registerPhoto(${JSON.stringify(name)},`)); lines.push(line);
writeFileSync(jsFile, [head, ...lines, ''].join('\n'));
console.log(`${name}: ${res.w}x${res.h}, object covers ${(res.kept * 100).toFixed(0)}% of the source, ${(res.src.length / 1024).toFixed(0)} KB -> ${jsFile}\ncheck sheet: ${sheetFile}`);
if (res.kept > .85) console.warn('warning: almost nothing was removed. Raise --tol, or the background is not plain.');
if (res.kept < .03) console.warn('warning: almost everything was removed. Lower --tol or --local.');
