// Render a production page to an MP4 (H.264 + AAC) in the cloud container.
// Frames: Chromium (software GPU) steps window.__seek(t) at exact 1/fps intervals, so the
// video is perfectly smooth however slow the renderer is. Audio: the page's own Web Audio
// sound engine is rendered into an OfflineAudioContext. Then ffmpeg muxes both.
//
//   npm install --prefix qa            (once per session: local Three.js for the CDN route)
//   node tools/render-mp4.cjs productions/<name>/index.html [--fps 30] [--w 1080] [--h 1920]
//                            [--from 0] [--to <duration>] [--out exports/<name>.mp4]
//
// Speed (measured): Test 02 ≈ 1.3 s/frame, Showcase 01 ≈ 5.5 s/frame at 1080x1920.
// Output goes to exports/ (git-ignored). Requires: playwright (pre-installed), ffmpeg.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { serve, ROOT } = require('../qa/capture.js');

const args = process.argv.slice(2), flags = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
const page = pos[0];
if (!page) { console.error('usage: node tools/render-mp4.cjs <page.html> [--fps 30] [--w 1080] [--h 1920] [--from 0] [--to dur] [--out file.mp4]'); process.exit(1); }
const fps = +(flags.fps || 30), W = +(flags.w || 1080), H = +(flags.h || 1920);
const name = path.basename(path.dirname(path.resolve(page)));
const out = path.resolve(flags.out || path.join(ROOT, 'exports', `${name}.mp4`));
const work = path.join(ROOT, 'exports', `.frames-${name}`);
fs.mkdirSync(work, { recursive: true });
const route = r => { const m = r.request().url().match(/three@[^/]+\/(.+)$/); return r.fulfill({ path: path.join(ROOT, 'qa/node_modules/three', m[1]), contentType: 'text/javascript' }); };

(async () => {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/` + path.relative(ROOT, path.resolve(page)).split(path.sep).join('/');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  // 1) audio
  let duration;
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const p = await ctx.newPage(); p.setDefaultTimeout(600000);
    await p.addInitScript(() => { window.AudioContext = function () { const c = new OfflineAudioContext(2, 48000 * 120, 48000); c.resume = () => Promise.resolve(); window.__offline = c; return c; }; });
    await p.route(/cdn\.jsdelivr\.net\/npm\/three@/, route); await p.goto(url); await p.waitForFunction(() => window.__ready, null, { timeout: 600000 });
    duration = await p.evaluate(() => window.__duration);
    const b64 = await p.evaluate(async (dur) => {
      document.getElementById('play').click();
      const buf = await window.__offline.startRendering();
      const n = Math.min(buf.length, Math.ceil(48000 * (dur + .5))), ch = [buf.getChannelData(0), buf.getChannelData(1)], dv = new DataView(new ArrayBuffer(44 + n * 4));
      const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
      dv.setUint32(24, 48000, true); dv.setUint32(28, 192000, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) dv.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][i])) * 32767, true);
      let s = ''; const u = new Uint8Array(dv.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return btoa(s);
    }, duration);
    fs.writeFileSync(path.join(work, 'audio.wav'), Buffer.from(b64, 'base64')); console.log('audio rendered'); await ctx.close();
  }
  // 2) frames (already-rendered frames are kept, so an interrupted render resumes)
  const from = +(flags.from || 0), to = Math.min(duration, +(flags.to ?? duration));
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.setDefaultTimeout(600000);
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@/, route); await p.goto(url); await p.waitForFunction(() => window.__ready, null, { timeout: 600000 });
  await p.addStyleTag({ content: '#hud,#title,#summary,#controls{display:none!important}' });
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps);
  for (let i = n0; i <= n1; i++) {
    const f = path.join(work, `f${String(i).padStart(5, '0')}.png`);
    if (fs.existsSync(f)) continue;
    await p.evaluate(t => window.__seek(t), i / fps);
    await p.locator('canvas').screenshot({ path: f });
    if (i % 50 === 0) console.log('frame', i, 'of', n1, new Date().toISOString());
  }
  await b.close(); srv.close();
  // 3) encode
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(fps), '-start_number', String(n0), '-i', path.join(work, 'f%05d.png'),
    '-ss', String(from), '-i', path.join(work, 'audio.wav'), '-frames:v', String(n1 - n0 + 1),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('written', out, (fs.statSync(out).size / 1e6).toFixed(1), 'MB  (delete', work, 'when done)');
})().catch(e => { console.error('Error', e.message); process.exit(1); });
