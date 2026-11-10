// Stage: renderer + colour grade + quality levels + warm-up + playback loop + FPS monitor +
// synthesised sound + QA hooks (window.__seek / __duration / __ready). Shared by every production.
//
// The page must contain the standard UI ids: stage, cap, hud, title, summary, play, restart,
// sound, hudBtn, quality, prep, msg, vignette (see productions/showcase-01-watchmaker/index.html).
import * as THREE from 'three';
import { Post } from './post.js';

const $ = (id) => document.getElementById(id);
export const AUTOMATED = navigator.webdriver === true;  // QA capture always renders at full quality

/** Colour grade lives inside the tone-mapping step (no extra pass). Call before creating materials. */
export function installGrade({ warm = [1.06, 1, .92], saturation = 1.12, lift = [.012, .012, .028], contrast = 1.0 } = {}) {
  const f = (v) => v.toFixed(4);
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    /vec3 CustomToneMapping\( vec3 color \) \{[\s\S]*?\n\}|vec3 CustomToneMapping\( vec3 color \) \{ return color; \}/,
    `vec3 CustomToneMapping( vec3 color ) {
       color *= vec3( ${f(warm[0])}, ${f(warm[1])}, ${f(warm[2])} );
       color = ACESFilmicToneMapping( color );
       color = clamp( ( color - 0.5 ) * ${f(contrast)} + 0.5, 0.0, 1.0 );
       float l = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
       color = max( mix( vec3( l ), color, ${f(saturation)} ), 0.0 );
       return color * ${f(1 - Math.max(...lift))} + vec3( ${f(lift[0])}, ${f(lift[1])}, ${f(lift[2])} );
     }`);
}

/* ---------------- sound: tiny Web Audio synth ---------------- */
export const synth = {
  env(g, when, a, peak, dec) { g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(peak, when + a); g.gain.exponentialRampToValueAtTime(.0001, when + a + dec); },
  osc(ctx, out, type, f, when, a, peak, dec, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, when);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, when + a + dec);
    synth.env(g, when, a, peak, dec); o.connect(g); g.connect(out); o.start(when); o.stop(when + a + dec + .05);
  },
  noise(ctx, out, when, type, f, q, peak, dec, f2) {
    const s = ctx.createBufferSource(); s.buffer = Sound.noise; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, when); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, when + dec);
    const g = ctx.createGain(); synth.env(g, when, .004, peak, dec); s.connect(fl); fl.connect(g); g.connect(out); s.start(when, Math.random() * .5); s.stop(when + dec + .05);
  },
  bell(ctx, out, f, when, peak = .12, dec = 1.6) { for (const [m, a] of [[1, 1], [2.76, .4], [5.4, .18], [8.9, .08]]) synth.osc(ctx, out, 'sine', f * m, when, .003, peak * a, dec / Math.sqrt(m)); },
};
export const Sound = {
  ctx: null, master: null, muted: false, noise: null, t0: 0, c0: 0, events: [],
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = n;
  },
  start(t0) {
    this.init(); this.ctx.resume(); this.stop();
    const ctx = this.ctx, m = ctx.createGain(); m.gain.value = this.muted ? 0 : .85;
    const comp = ctx.createDynamicsCompressor(); m.connect(comp); comp.connect(ctx.destination); this.master = m;
    const at = ctx.currentTime + .06 - t0; this.t0 = t0; this.c0 = ctx.currentTime + .06;
    for (const ev of this.events) if (ev.t >= t0 - .01) ev.fn(ctx, m, at + ev.t);
  },
  clock() { if (!this.master || !this.ctx || this.ctx.state !== 'running') return null; const v = this.t0 + (this.ctx.currentTime - this.c0); return v < this.t0 ? null : v; },
  stop() { if (this.master) { const m = this.master; m.gain.setTargetAtTime(0, this.ctx.currentTime, .02); setTimeout(() => m.disconnect(), 120); this.master = null; } },
  setMuted(v) { this.muted = v; if (this.master) this.master.gain.setTargetAtTime(v ? 0 : .85, this.ctx.currentTime, .03); },
};

/* ---------------- stage ---------------- */
export class Stage {
  constructor({ duration, fog = null, near = .05, far = 120, shadowMap = THREE.PCFSoftShadowMap } = {}) {
    this.duration = duration;
    this.maxDpr = Math.min(window.devicePixelRatio || 1, 2);
    try { this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false }); }
    catch (e) { showMsg('WebGL is not available on this device/browser.'); throw e; }
    const r = this.renderer;
    r.setPixelRatio(this.maxDpr); r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.CustomToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = shadowMap;
    r.info.autoReset = false;   // count every pass of a frame (scene + post) in the HUD
    $('stage').prepend(r.domElement);
    this.canvas = r.domElement;
    this.scene = new THREE.Scene(); if (fog) this.scene.fog = fog;
    this.camera = new THREE.PerspectiveCamera(45, 9 / 16, near, far);
    this.post = new Post(r);
    this.quality = 'high'; this.dpr = this.maxDpr; this.cssW = 360; this.cssH = 640;
    this.t = 0; this.playing = false; this.finished = false; this.last = 0; this.frameMs = [];
    this.hudOn = false; this._hud = { timer: 0, acc: 0, n: 0, fps: 0, ms: 0 };
    this.onUpdate = () => {}; this.onQuality = () => {};
    this.gpu = (() => { try { const gl = r.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { return 'unknown'; } })();
    this._wire();
  }
  /** high: everything; medium: no depth of field, 1.6x; low: no post at all, 1.35x */
  setQuality(level, dpr) {
    const levels = { high: this.maxDpr, medium: Math.min(this.maxDpr, 1.6), low: Math.min(this.maxDpr, 1.35) };
    this.quality = level; this.dpr = dpr || levels[level];
    this.post.enabled = level !== 'low'; this.post.dof = level === 'high'; this.post.bloom = level !== 'low';
    this.renderer.setPixelRatio(this.dpr); this.renderer.setSize(this.cssW, this.cssH);
    if (this.post.enabled) this.post.setSize(Math.round(this.cssW * this.dpr), Math.round(this.cssH * this.dpr));
    $('vignette').style.display = this.post.enabled ? 'none' : 'block';
    const qb = $('quality'); if (qb) qb.textContent = 'Q: ' + level;
    this.onQuality(level);
  }
  layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    this.cssW = Math.floor(Math.min(vw, vh * 9 / 16)); this.cssH = Math.floor(this.cssW * 16 / 9);
    const st = $('stage'); st.style.width = this.cssW + 'px'; st.style.height = this.cssH + 'px';
    this.camera.aspect = this.cssW / this.cssH; this.camera.updateProjectionMatrix();
    const cap = $('cap'); if (cap) { cap.style.fontSize = Math.round(this.cssW * .095) + 'px'; cap.style.webkitTextStrokeWidth = Math.max(4, Math.round(this.cssW * .016)) + 'px'; }
  }
  renderAt(t) { this.renderer.info.reset(); this.onUpdate(t); this.post.render(this.scene, this.camera); }
  _frame(now) {
    const ms = this.last ? Math.min(now - this.last, 100) : 0; this.last = now;
    if (ms > 0) this.frameMs.push(ms);
    this.t = Math.min(this.duration, this.t + ms / 1000);
    const at = Sound.clock(); if (at !== null) this.t = Math.min(this.duration, this.t + (at - this.t) * .1);  // stay locked to the audio clock
    this.renderAt(this.t); this._drawHud(ms);
    if (this.t >= this.duration) this._finish();
  }
  play() {
    if (this.finished) this.reset();
    this.playing = true; this.last = 0; $('title').style.opacity = 0; $('summary').style.display = 'none';
    $('play').textContent = '❚❚ Pause'; Sound.start(this.t);
    this.renderer.setAnimationLoop((n) => this._frame(n));
  }
  pause() { this.playing = false; this.renderer.setAnimationLoop(null); Sound.stop(); $('play').textContent = this.finished ? '▶ Replay' : (this.t > 0 ? '▶ Resume' : '▶ Start'); }
  reset() { this.t = 0; this.finished = false; this.frameMs.length = 0; this.renderAt(0); this._drawHud(0); }
  _finish() {
    this.finished = true; this.pause();
    const f = this.frameMs, n = f.length; if (!n) return;
    const total = f.reduce((a, b) => a + b, 0), sorted = [...f].sort((a, b) => b - a);
    const wN = Math.max(1, Math.floor(n * .01)), low1 = 1000 / (sorted.slice(0, wN).reduce((a, b) => a + b, 0) / wN), avg = n / (total / 1000);
    const s = $('summary');
    s.innerHTML = `<b>Playback report</b>\nAverage FPS  ${avg.toFixed(1)}\n1% low FPS   ${low1.toFixed(1)}\nWorst frame  ${sorted[0].toFixed(1)} ms\nSlow frames  ${f.filter(m => m > 20).length} over 20 ms, ${f.filter(m => m > 33).length} over 33 ms (of ${n})\nQuality      ${this.quality}, ${this.dpr.toFixed(2)}x (${this.canvas.width}x${this.canvas.height})\nGPU          ${this.gpu}`;
    s.style.display = 'block';
  }
  _drawHud(ms) {
    const h = this._hud; if (ms > 0) { h.acc += ms; h.n++; } h.timer += ms;
    if (h.timer < 250 && ms > 0) return;
    if (h.n) { h.ms = h.acc / h.n; h.fps = 1000 / h.ms; } h.acc = 0; h.n = 0; h.timer = 0;
    if (!this.hudOn) return;
    const info = this.renderer.info.render;
    $('hud').textContent = `FPS   ${h.fps ? h.fps.toFixed(0) : '--'} (${h.ms ? h.ms.toFixed(1) : '--'} ms)\nt     ${this.t.toFixed(2)} / ${this.duration}\nQ     ${this.quality}  DPR ${this.dpr.toFixed(2)}\nsize  ${this.canvas.width}x${this.canvas.height}\ncalls ${info.calls}  tris ${info.triangles}`;
  }
  _wire() {
    $('play').addEventListener('click', () => (this.playing ? this.pause() : this.play()));
    $('restart').addEventListener('click', () => { const was = this.playing; this.pause(); this.reset(); if (was) this.play(); });
    $('sound').addEventListener('click', (e) => { Sound.setMuted(!Sound.muted); e.currentTarget.textContent = Sound.muted ? '🔇' : '🔊'; });
    $('hudBtn').addEventListener('click', () => { this.hudOn = !this.hudOn; $('hud').style.display = this.hudOn ? 'block' : 'none'; $('quality').style.display = this.hudOn ? 'inline-block' : 'none'; this._drawHud(0); });
    $('quality').addEventListener('click', () => {           // manual override: high -> medium -> low -> high
      const next = { high: 'medium', medium: 'low', low: 'high' }[this.quality];
      this.setQuality(next); if (!this.playing) this.renderAt(this.t);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.playing) this.pause(); });
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.pause(); showMsg('The GPU reset the page (WebGL context lost). Reload to try again.'); });
    window.addEventListener('resize', () => { if (this.playing) return; this.layout(); this.setQuality(this.quality, this.dpr); this.renderAt(this.t); });
  }
  _measure(times, nFrames) {
    return new Promise(res => { let n = 0, lastT = 0; const ms = [];
      const step = (now) => { if (lastT) ms.push(now - lastT); lastT = now; this.renderAt(times[n % times.length]); n++;
        if (n < nFrames) requestAnimationFrame(step); else { const s = ms.slice(6).sort((a, b) => a - b); res(s[Math.floor(s.length / 2)] || 16); } };
      requestAnimationFrame(step); });
  }
  /** compile everything, upload textures, render every shot once, then time frames to pick a quality level */
  async boot({ warmTimes = [0], beforeCompile = () => {}, afterCompile = () => {} } = {}) {
    this.layout(); this.setQuality('high');
    this.onUpdate(0); beforeCompile(); this.renderer.compile(this.scene, this.camera); this.post.render(this.scene, this.camera); afterCompile();
    for (const wt of warmTimes) this.renderAt(wt);
    if (!AUTOMATED) for (const lvl of ['high', 'medium', 'low']) { this.setQuality(lvl); const med = await this._measure(warmTimes, 40); if (med < 17.8 || lvl === 'low') break; }
    this.reset();
    const prep = $('prep'); if (AUTOMATED) prep.remove(); else { prep.style.opacity = 0; setTimeout(() => prep.remove(), 400); }
    $('play').disabled = false;
    window.__duration = this.duration;
    window.__seek = (time) => { if (this.playing) this.pause(); this.t = Math.max(0, Math.min(this.duration, time)); this.renderAt(this.t); };
    window.__ready = true;
  }
}
export function showMsg(t) { const m = $('msg'); m.textContent = t; m.style.display = 'flex'; }
