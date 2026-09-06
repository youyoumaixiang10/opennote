/* Builds the two shipping copies of 《最后一班船》 from index.html.
 *   dist/last-ship.html           - one self-contained file, open it straight from disk
 *   dist/last-ship.artifact.html  - same page without the <html>/<head>/<body> shell,
 *                                   for hosts that supply their own document skeleton
 * Run:  node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const three = readFileSync(new URL('./vendor/three.min.js', import.meta.url), 'utf8');

const START = '<!-- GAME-START -->', END = '<!-- GAME-END -->';
const i = src.indexOf(START), j = src.indexOf(END);
if (i < 0 || j < 0) throw new Error('markers not found in index.html');

const body = src.slice(i + START.length, j).trim()
  // a function replacer: three.min.js contains "$&", which a string replacement would expand
  .replace('<script src="vendor/three.min.js"></script>',
           () => '<script>/* three.js r150.1 — MIT — see vendor/three-LICENSE.txt */\n' + three + '\n</script>');

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });

writeFileSync(new URL('./dist/last-ship.artifact.html', import.meta.url), body + '\n');

const standalone = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#101A22">
<meta name="apple-mobile-web-app-capable" content="yes">
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(new URL('./dist/last-ship.html', import.meta.url), standalone);

const kb = (s) => (s.length / 1024).toFixed(0) + ' KB';
console.log('dist/last-ship.html          ', kb(standalone));
console.log('dist/last-ship.artifact.html ', kb(body));
