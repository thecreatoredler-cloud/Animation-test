// QA capture: renders an animation page frame by frame in an emulated Android phone
// and builds a contact sheet, so every shot can be inspected before calling a video done.
//
// Usage (runs in the Claude cloud container, not on the phone):
//   npm install --prefix qa            (once per session: local copy of Three.js)
//   node qa/capture.js index.html [--step 0.25] [--out qa/out/benchmark]
//
// The page must set window.__ready, window.__duration and window.__seek(t).

const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const http = require('http');

const args = process.argv.slice(2);
const flags = {}, positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}
const page = positional[0];
const opt = (name, def) => flags[name] ?? def;
if (!page && require.main === module) { console.error('usage: node qa/capture.js <page.html> [--step 0.25] [--out dir]'); process.exit(1); }

const step = parseFloat(opt('step', '0.25'));
const out = page ? path.resolve(opt('out', path.join('qa', 'out', path.basename(page, '.html')))) : null;
if (out) { fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) if (/^f\d+\.png$/.test(f)) fs.unlinkSync(path.join(out, f)); }

// Serve Three.js from qa/node_modules when the CDN is unreachable from the container.
function localThree(url) {
  const m = url.match(/three@[^/]+\/(.+)$/);
  if (!m) return null;
  const p = path.join(__dirname, 'node_modules', 'three', m[1]);
  return fs.existsSync(p) ? p : null;
}

// serve the repository over HTTP (ES modules and GLB files cannot load from file://)
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.css': 'text/css' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}
module.exports = { serve, ROOT };
if (require.main === module) (async () => {
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  const problems = [];
  tab.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`console ${m.type()}: ${m.text()}`); });
  tab.on('pageerror', e => problems.push('page error: ' + e.message));
  tab.on('requestfailed', r => problems.push(`missing asset: ${r.url()} (${r.failure()?.errorText})`));
  await tab.route(/cdn\.jsdelivr\.net\/npm\/three@/, route => {
    const p = localThree(route.request().url());
    return p ? route.fulfill({ path: p, contentType: 'text/javascript' }) : route.continue();
  });

  await tab.goto(`http://127.0.0.1:${srv.address().port}/` + path.relative(ROOT, path.resolve(page)).split(path.sep).join('/'));
  await tab.waitForFunction(() => window.__ready && window.__seek, null, { timeout: 180000 });
  // hide UI overlays so frames show only the picture
  await tab.addStyleTag({ content: '#hud,#title,#summary,#controls{display:none!important}' });
  const duration = await tab.evaluate(() => window.__duration);

  const frames = [];
  for (let t = 0, i = 0; t <= duration + 1e-6; t += step, i++) {
    await tab.evaluate(time => window.__seek(time), Math.min(t, duration));
    const file = path.join(out, `f${String(i).padStart(3, '0')}.png`);
    await tab.locator('canvas').screenshot({ path: file });
    frames.push({ t: Math.min(t, duration), file });
  }
  await browser.close(); srv.close();

  // contact sheet: 6 frames per row, each labelled with its time
  const sheet = path.join(out, 'contact-sheet.png');
  try {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(out, 'f%03d.png'),
      '-vf', `scale=200:-1,drawtext=text='%{eif\\:n*${step}*100\\:d}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x${Math.ceil(frames.length / 6)}`,
      '-frames:v', '1', sheet]);
  } catch (e) { problems.push('contact sheet failed (ffmpeg): ' + e.message.split('\n')[0]); }

  const report = [
    `page: ${page}`, `duration: ${duration}s, step: ${step}s, frames: ${frames.length}`,
    `contact sheet: ${sheet} (labels are time x100, e.g. 125 = 1.25 s)`,
    problems.length ? 'PROBLEMS:\n  ' + [...new Set(problems)].join('\n  ') : 'problems: none',
  ].join('\n');
  fs.writeFileSync(path.join(out, 'report.txt'), report + '\n');
  console.log(report);
})();
