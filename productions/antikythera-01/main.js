// "The Ancient Computer Found Underwater" — part 1 (10.4 s). See PLAN.md.
// Six set-ups in three locations, joined by short cross-dissolves; the owner's voice-over
// drives the timing. Everything is a function of time t.
import * as THREE from 'three';
import { Stage, installGrade, Sound, synth } from '../../lib/stage.js';
import { Shots, moveK } from '../../lib/shots.js';
import { Captions, loadFont } from '../../lib/captions.js';
import { buildSeabed, buildSea, buildBoat, buildIsland } from './world.js';
import { buildCast } from './cast.js';

const DURATION = 10.4;
installGrade({ warm: [1.09, 1.0, .92], saturation: 1.42, lift: [.016, .014, .024], contrast: 1.05 });
const stage = new Stage({ duration: DURATION, near: .1, far: 420 });
const { scene, camera } = stage, fx = stage.post.fx;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, k) => a + (b - a) * k;
const C = (h) => new THREE.Color(h);

/* ---------- lights, fog ---------- */
const hemi = new THREE.HemisphereLight('#ffffff', '#444444', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
scene.fog = new THREE.Fog('#000000', 10, 100); scene.background = new THREE.Color('#000000');
function light({ sky, ground, hemiI, sunC, sunI, dir, focus, size, fogC, fogN, fogF }) {
  hemi.color.copy(sky); hemi.groundColor.copy(ground); hemi.intensity = hemiI; sun.color.copy(sunC); sun.intensity = sunI;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(dir, 50); sun.target.updateMatrixWorld();
  const c = sun.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = 1; c.far = 110; c.updateProjectionMatrix();
  scene.fog.color.copy(fogC); scene.fog.near = fogN; scene.fog.far = fogF; scene.background.copy(fogC);
}

/* ---------- sets and cast ---------- */
const seabed = buildSeabed(), sea = buildSea(), boat = buildBoat(), island = buildIsland(), cast = buildCast();
scene.add(seabed.group, sea.group, boat.group, island.group);
seabed.group.add(cast.fish.root);
boat.group.add(cast.cap.root, cast.niko.root);
cast.cap.root.position.set(-.5, boat.DECK, .15); cast.niko.root.position.set(.62, boat.DECK, .22);
cast.cap.timeline = [{ t: 0, pose: 'proud' }, { t: 6.69, pose: 'alarm' }, { t: 7.25, pose: 'panic' }];
cast.niko.timeline = [{ t: 0, pose: 'show' }, { t: 6.74, pose: 'alarm' }, { t: 7.29, pose: 'duck' }];
cast.fish.timeline = [{ t: 0, pose: 'curious' }, { t: 2.49, pose: 'shock' }];

/* ---------- camera helper ---------- */
const _a = V(0, 0, 0), _b = V(0, 0, 0);
function cam(k, p0, p1, t0, t1, fov0, fov1, roll0 = 0, roll1 = 0) {
  camera.position.lerpVectors(p0, p1, k); _a.lerpVectors(t0, t1, k);
  camera.fov = lerp(fov0, fov1, k); camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(_a); camera.rotateZ(lerp(roll0, roll1, k)); camera.updateMatrixWorld();
}
const easeOutK = (k) => (k <= 0 || k >= 1) ? k : 1 - (1 - k) * (1 - k) * (1 - k * .5) ;   // arrives fast, keeps drifting

/* ---------- colours ---------- */
const UW = { sky: C('#8fe2ff'), ground: C('#1e6f8f'), sunC: C('#d2f6ff'), fog: C('#1583b4'), dir: V(-.3, 1, .28).normalize() };
const CALM = { sky: C('#cfeaff'), ground: C('#4f93b0'), sunC: C('#fff0cf') }, STORM = { sky: C('#93a8c8'), ground: C('#2b4456'), sunC: C('#a9bcd6') };
const SUN_DIR = V(.42, .78, .5).normalize(), tmpC = new THREE.Color(), tmpC2 = new THREE.Color(), tmpC3 = new THREE.Color();
const WHITE = C('#ffffff');

/* ---------- weather over time ---------- */
const STRIKES = [[7.25, 1], [7.43, .55], [8.82, .5], [9.86, .65]];
const flashAt = (t) => { let f = 0; for (const [ts, a] of STRIKES) if (t >= ts) f = Math.max(f, a * Math.exp(-(t - ts) * 8)); return f; };

/* =====================================================================
   Shots
   ===================================================================== */
const MECH = V(1.62, .32, 2.66);
function shotSeabed(t, n) {
  seabed.group.visible = true; sea.group.visible = boat.group.visible = island.group.visible = false;
  light({ sky: UW.sky, ground: UW.ground, hemiI: 1.9, sunC: UW.sunC, sunI: 1.7, dir: UW.dir, focus: n === 1 ? V(0, 0, 1) : MECH, size: n === 1 ? 9 : 2.2, fogC: UW.fog, fogN: 2.5, fogF: 30 });
  const glow = smooth((t - 2.42) / .22), burst = smooth((t - 3.22) / .5);
  if (n === 1) cam(easeOutK(moveK(t, 0, 1.55, 0)), V(-3.6, 7.6, 12.5), V(-1.3, 2.5, 6.6), V(0, .4, -1.2), V(.5, .9, .4), 52, 44, .2, .03);
  else cam(moveK(t, 1.55, 3.62, .4), V(2.5, 1.0, 4.35), V(1.98, .76, 3.78), V(1.5, .36, 2.66), V(1.58, .38, 2.66), 38, 33, -.07, .03);
  // the fish drifts in, then recoils on "computer"
  const fin = smooth((t - 1.5) / .8), rec = t >= 2.49 ? Math.min(1, (t - 2.49) / .1) : 0;
  cast.fish.root.position.set(lerp(1.42, 1.61, fin) - rec * .035, .7 + rec * .02, 3.02); cast.fish.update(t, camera);
  cast.fish.light({ key: tmpC.set(.62, .78, .86), ambient: tmpC2.set(.3, .42, .5), rim: tmpC3.set(1, .7, .25).multiplyScalar(glow * .9), rimDir: [1, -.2] });
  seabed.update(t, camera, { glow, burst });
  fx.ink = .9; fx.inkFar = 18; fx.bloom = .55; fx.threshold = 1.25; fx.vignette = .5; fx.flash = burst * .1;
  fx.dof = n === 1 ? .35 : 1; fx.focus = n === 1 ? camera.position.distanceTo(_b.set(0, .8, 0)) : camera.position.distanceTo(MECH); fx.dofRange = n === 1 ? 1.6 : .7;
  _b.copy(MECH).project(camera); fx.glowUV.set(_b.x * .5 + .5, _b.y * .5 + .5); fx.glow = n === 2 ? glow * .07 : 0; fx.glowColor.setRGB(1, .7, .3);
  fx.mblur.set(0, n === 1 ? Math.max(0, .014 * (1 - t / .5)) : 0);
}

function shotSea(t, n) {
  seabed.group.visible = false; sea.group.visible = boat.group.visible = island.group.visible = true;
  const storm = n === 3 ? 0 : n === 4 ? smooth((t - 6.35) / .9) : 1, flash = n >= 4 ? flashAt(t) : 0;
  // where the boat is
  let bx, bz, heading;
  if (n <= 4) { bx = (t - 3.6) * 1.2; bz = 80; heading = 0; }
  else if (n === 5) { const k = (t - 7.6) / 1.65; bx = lerp(4.6, 1.4, k); bz = lerp(27, 18.6, k); heading = Math.atan2(8.4, -3.2); }
  else { bx = .15; bz = 10.3; heading = Math.PI / 2; }
  boat.update(t, bx, bz, heading, n === 6 ? .35 : n === 4 ? storm * .5 : storm);
  island.update(t, storm);
  let focus, size, inkFar, fogN = lerp(40, 22, storm), fogF = lerp(190, 135, storm);
  if (n === 3) { cam(moveK(t, 3.62, 5.33, .5), V(bx + 6.4, .55, 85.0), V(bx + 5.7, 1.5, 85.7), V(bx + 1.0, 1.9, 80), V(bx + .9, 2.1, 80), 44, 42, -.04, 0); focus = V(bx, 0, bz); size = 7; inkFar = 60; }
  else if (n === 4) { const hit = smooth((t - 7.25) / .14);
    const by = boat.group.position.y; cam(moveK(t, 5.33, 7.6, .5), V(bx + .3, 1.95 + by, 86.6), V(bx + .2, 1.8 + by, 85.6), V(bx + .08, 1.2 + by, 80), V(bx + .08, 1.18 + by, 80), 34, 32 - hit * 3, 0, hit * .09); focus = V(bx, 0, bz); size = 5; inkFar = 34; }
  else if (n === 5) { cam(moveK(t, 7.6, 9.25, .35), V(8, 10.5, 37), V(12.5, 18, 46), V(.5, 1.0, 9), V(0, 1.5, 6), 44, 42, .05, 0); focus = V(0, 0, 12); size = 30; inkFar = 150; }
  else { cam(moveK(t, 9.25, 10.4, .3), V(-8.6, 3.1, 18.3), V(-8.1, 2.95, 17.6), V(-3.9, 2.0, 12.6), V(-3.9, 2.0, 12.6), 40, 38, -.03, -.01); focus = V(-2, 0, 11); size = 12; inkFar = 70; }
  tmpC.lerpColors(CALM.sky, STORM.sky, storm); tmpC2.lerpColors(CALM.ground, STORM.ground, storm); tmpC3.lerpColors(CALM.sunC, STORM.sunC, storm);
  const hor = sea.update(t, camera, { storm, flash, fogNear: fogN, fogFar: fogF, boat: { x: bx, z: bz, r: 3.3 },
    boltAt: n === 4 ? { x: bx + 9 + (t > 7.4 ? -22 : 0), y: 30, z: 80 - 120 } : n === 5 ? { x: -40, y: 34, z: -110 } : { x: 34, y: 30, z: -100 },
    gullsAt: n === 3 ? { x: bx, y: 5.2, z: bz } : null, glint: n === 5 ? { x: 6.5, z: 16.5, r: .7, a: .55 } : null });
  light({ sky: tmpC, ground: tmpC2, hemiI: lerp(1.55, 1.25, storm) + flash * 3, sunC: tmpC3, sunI: lerp(2.3, .75, storm) + flash * 2, dir: SUN_DIR, focus, size, fogC: hor, fogN, fogF });
  for (const a of [cast.cap, cast.niko]) { a.update(t, camera);
    a.light({ key: tmpC.setScalar(lerp(.62, .3, storm) + flash * .9).multiply(tmpC3), ambient: tmpC2.set(lerp(.44, .3, storm), lerp(.46, .36, storm), lerp(.5, .48, storm)),
      rim: _rim.set(1, .86, .55).multiplyScalar(lerp(.45, .12, storm)).addScalar(flash * 1.2), rimDir: [1, .35], glow: .04 }); }
  fx.ink = .85; fx.inkFar = inkFar; fx.bloom = .4; fx.threshold = 1.5; fx.vignette = .32 + storm * .16; fx.flash = flash * .1; fx.glow = 0; fx.mblur.set(0, 0);
  fx.dof = n === 4 ? .8 : n === 6 ? .45 : 0; fx.focus = n === 4 ? 6.0 : 5.6; fx.dofRange = n === 4 ? 1.3 : 3.2;
}
const _rim = new THREE.Color();

const shots = new Shots(stage, [
  { t0: 0, t1: 1.55, xf: .2, apply: (t) => shotSeabed(t, 1) },
  { t0: 1.55, t1: 3.62, xf: .3, apply: (t) => shotSeabed(t, 2) },
  { t0: 3.62, t1: 5.33, xf: .2, apply: (t) => shotSea(t, 3) },
  { t0: 5.33, t1: 7.6, xf: .2, apply: (t) => shotSea(t, 4) },
  { t0: 7.6, t1: 9.25, xf: .2, apply: (t) => shotSea(t, 5) },
  { t0: 9.25, t1: DURATION + 1, xf: 0, apply: (t) => shotSea(t, 6) },
]);
stage.onRender = (t) => shots.render(t);

/* ---------- captions (timed from the voice-over) ---------- */
const WORDS = [[.03, 'Why did'], [.37, 'the 2,000'], [1.25, 'year-old'], [1.59, 'shipwreck'], [2.22, 'have a'], [2.49, 'computer'], [3.06, 'on board?'], [3.66, 'Spring,'], [4.36, '1900.'],
  [5.38, 'Greek'], [5.69, 'sponge'], [6.18, 'divers'], [6.69, 'hide'], [7.01, 'from the'], [7.25, 'storm'], [7.64, 'near a'], [8.03, 'tiny'], [8.52, 'island'], [9.08, 'called'], [9.35, 'Antikythera.']];

/* ---------- sound: voice-over in front, synthesized world under it ---------- */
function buildSound() {
  const ev = [], at = (t, fn) => ev.push({ t, fn });
  const amb = (t0, t1, type, f, q, peak, f2) => at(t0, (ctx, out, when) => { const s = ctx.createBufferSource(); s.buffer = Sound.noise; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, when); fl.Q.value = q;
    if (f2) fl.frequency.linearRampToValueAtTime(f2, when + (t1 - t0)); const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(peak, when + .35); g.gain.setValueAtTime(peak, when + (t1 - t0) - .3); g.gain.linearRampToValueAtTime(0, when + (t1 - t0));
    s.connect(fl); fl.connect(g); g.connect(out); s.start(when); s.stop(when + (t1 - t0) + .05); });
  // underwater: low drone + muffled water + bubbles
  at(0, (ctx, out, when) => { synth.osc(ctx, out, 'sine', 55, when, .3, .09, 3.6); synth.osc(ctx, out, 'sine', 82.5, when, .5, .05, 3.4); });
  amb(0, 3.75, 'lowpass', 260, .7, .09);
  for (const [t, f] of [[.25, 500], [.6, 720], [.95, 610], [1.4, 820], [1.9, 560], [2.25, 760], [3.25, 520], [3.33, 700], [3.4, 880], [3.47, 640], [3.54, 940], [3.6, 760]]) at(t, (ctx, out, when) => synth.osc(ctx, out, 'sine', f, when, .008, .03, .09, f * 1.7));
  // the mechanism wakes: shimmer + ticking gears
  at(2.49, (ctx, out, when) => { for (const [f, d] of [[880, 0], [1320, .05], [1760, .1], [2640, .16]]) synth.bell(ctx, out, f, when + d, .035, 1.1); });
  for (let i = 0; i < 9; i++) at(2.55 + i * .115, (ctx, out, when) => { synth.noise(ctx, out, when, 'highpass', 3200, 1, .05, .03); synth.osc(ctx, out, 'square', 1900 + (i % 2) * 300, when, .002, .012, .04); });
  at(3.42, (ctx, out, when) => synth.noise(ctx, out, when, 'bandpass', 300, 1.2, .16, .45, 2400));                       // whoosh up to the surface
  // the sea: waves, gulls, then wind, rain and thunder
  amb(3.6, 7.0, 'lowpass', 700, .5, .05); amb(6.5, 10.4, 'bandpass', 420, 1.4, .09, 760); amb(7.2, 10.4, 'highpass', 3800, .5, .045);
  for (const t of [3.95, 4.5, 5.6]) at(t, (ctx, out, when) => { synth.osc(ctx, out, 'triangle', 1750, when, .02, .028, .16, 1250); synth.osc(ctx, out, 'triangle', 1650, when + .2, .02, .022, .14, 1200); });
  const thunder = (t, a) => at(t, (ctx, out, when) => { synth.noise(ctx, out, when, 'highpass', 1800, .7, .22 * a, .12); synth.noise(ctx, out, when + .03, 'lowpass', 140, .8, .5 * a, 1.5, 55); synth.osc(ctx, out, 'sine', 48, when, .02, .3 * a, 1.1, 30); });
  thunder(7.25, 1); thunder(8.82, .5); thunder(9.86, .65);
  // a light plucked ostinato keeps the pace under the narration
  const N = { D3: 146.83, A3: 220, D4: 293.66, F4: 349.23, A4: 440, E4: 329.63, C4: 261.63, G3: 196 };
  const seq = ['D3', 'A3', 'D4', 'F4', 'A3', 'D4', 'F4', 'A4', 'C4', 'G3', 'C4', 'E4', 'G3', 'C4', 'E4', 'A4'];
  for (let i = 0; i * .2 < DURATION - .2; i++) at(.02 + i * .2, (ctx, out, when) => { const f = N[seq[i % seq.length]]; synth.osc(ctx, out, 'triangle', f * (i * .2 < 3.6 ? .5 : 1), when, .004, .022, .22); synth.osc(ctx, out, 'sine', f * 2, when, .003, .008, .12); });
  return ev;
}

/* ---------- boot ---------- */
(async () => {
  await Promise.all([loadFont('Fredoka', '../../assets/fonts/fredoka-700.woff2'), Sound.load('./vo.mp3', { t: 0, gain: 1.05 })]);
  const captions = new Captions(WORDS.map(([t, text]) => ({ t, text })), { end: 10.32 }); stage.overlay = captions;
  Sound.events = buildSound();
  await stage.boot({ warmTimes: [.4, 1.55, 2.7, 3.62, 4.4, 5.33, 6.2, 7.3, 7.6, 8.4, 9.25, 10] });
})();
