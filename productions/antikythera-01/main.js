// "The Ancient Computer Found Underwater" — full video (60.4 s). See PLAN.md.
// 33 set-ups joined by short cross-dissolves; the owner's voice-over drives the timing.
// Everything is a function of time t.
import * as THREE from 'three';
import { Stage, installGrade, Sound, synth } from '../../lib/stage.js';
import { Shots, moveK } from '../../lib/shots.js';
import { Captions, loadFont } from '../../lib/captions.js';
import { buildSeabed, buildSea, buildBoat, buildIsland } from './world.js';
import { buildCast } from './cast.js';
import { buildStatues, STATUES, buildGalley, buildLump, buildRestored, buildRoom, buildVoid, buildGreek } from './world2.js';
import { mesh, amphoraGeo } from './world.js';
import { toon, canvasTex } from '../../lib/toon.js';
import { CARDS, VO_END } from './words.js';

const DURATION = 60.4;
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
const galley = buildGalley(), room = buildRoom(), vd = buildVoid(), greek = buildGreek();
buildStatues(seabed.group, seabed.dune);
const GROUPS = { seabed: seabed.group, sea: sea.group, boat: boat.group, island: island.group, galley: galley.group, room: room.group, vd: vd.group, greek: greek.group };
scene.add(...Object.values(GROUPS));
const only = (...names) => { for (const [k, g] of Object.entries(GROUPS)) g.visible = names.includes(k); };
// props that live on the boat, in the room, on the pedestal
const ROOF = boat.deckhouseTop;
const lumpDeck = buildLump(); boat.group.add(lumpDeck);
const lumpRoom = buildLump(); room.group.add(lumpRoom);
const restoredRoom = buildRestored(); room.group.add(restoredRoom); restoredRoom.position.set(.42, room.tableY, .15);
const restoredEra = buildRestored(); greek.group.add(restoredEra); restoredEra.position.set(0, 1.31, 0); restoredEra.scale.setScalar(1.7);
const shoebox = new THREE.Group(); { const lab = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#c9a26a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f7f1e1'; g.fillRect(30, 26, 196, 76); g.strokeStyle = '#1d1418'; g.lineWidth = 5; g.strokeRect(30, 26, 196, 76);
    g.fillStyle = '#1d1418'; g.font = '700 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('ΥΠΟΔΗΜΑΤΑ', 128, 62); g.font = '700 22px Georgia, serif'; g.fillText('No 42', 128, 90); });
  const k = toon('#c9a26a'); shoebox.add(mesh(new THREE.BoxGeometry(.36, .15, .22), [k, k, k, k, toon('#ffffff', { map: lab }), k], 0, .075, 0)); shoebox.add(mesh(new THREE.BoxGeometry(.38, .05, .24), toon('#b8402e'), 0, .165, 0)); boat.group.add(shoebox); }
const treasure = new THREE.Group(); { const terra = toon('#c06a3c'), aG = amphoraGeo(); const a1 = mesh(aG, terra, .78, boat.DECK, .28); const a2 = mesh(aG, terra, 1.0, boat.DECK + .14, -.15); a2.rotation.z = 1.45; treasure.add(a1, a2);
  const h = mesh(new THREE.SphereGeometry(.17, 12, 9), toon('#eef1f2'), .42, boat.DECK + .18, .66); h.scale.y = 1.12; treasure.add(h); treasure.add(mesh(new THREE.ConeGeometry(.03, .09, 4).rotateX(1.6), toon('#eef1f2'), .42, boat.DECK + .17, .83));
  const arm = mesh(new THREE.CylinderGeometry(.045, .06, .7, 8), toon('#3f9c84'), -.6, boat.DECK + .3, .6); arm.rotation.z = -.5; treasure.add(arm); treasure.add(mesh(new THREE.SphereGeometry(.07, 8, 6), toon('#3f9c84'), -.42, boat.DECK + .62, .6)); boat.group.add(treasure); }
const hose = mesh(new THREE.CylinderGeometry(.03, .03, 16, 6), toon('#b89a62'), 0, 0, 0, { cast: false }); seabed.group.add(hose);
const spook = new THREE.PointLight('#7dffc0', 0, 7, 1.3); seabed.group.add(spook);

seabed.group.add(cast.fish.root, cast.suit.root);
boat.group.add(cast.cap.root, cast.niko.root);
cast.cap.root.position.set(-.5, boat.DECK, .15); cast.niko.root.position.set(.62, boat.DECK, .22);
cast.cap.timeline = [{ t: 0, pose: 'proud' }, { t: 6.69, pose: 'alarm' }, { t: 7.25, pose: 'panic' }, { t: 10.4, pose: 'skeptic' }, { t: 23.8, pose: 'proud' }, { t: 57.72, pose: 'hold' }];
cast.niko.timeline = [{ t: 0, pose: 'show' }, { t: 6.74, pose: 'alarm' }, { t: 7.29, pose: 'duck' }, { t: 10.4, pose: 'babble' }, { t: 12.22, pose: 'babble2' }, { t: 12.77, pose: 'babble' }, { t: 13.29, pose: 'babble2' }, { t: 20, pose: 'show' }, { t: 57.83, pose: 'amazed' }];
cast.fish.timeline = [{ t: 0, pose: 'curious' }, { t: 2.49, pose: 'shock' }, { t: 10, pose: 'curious' }];
cast.suit.timeline = [{ t: 0, pose: 'sink' }, { t: 13, pose: 'scared' }, { t: 16.0, pose: 'calm' }];
cast.doc.timeline = [{ t: 0, pose: 'look' }, { t: 26.43, pose: 'lean' }, { t: 26.88, pose: 'spot' }];
cast.philon.timeline = [{ t: 0, pose: 'file' }, ...Array.from({ length: 9 }, (_, i) => ({ t: 30.02 + i * .19, pose: i % 2 ? 'file' : 'file2' })), { t: 31.74, pose: 'crank' }, { t: 35.5, pose: 'point' }, { t: 38, pose: 'ready' }, { t: 41.2, pose: 'go' }];
cast.sA.timeline = [{ t: 0, pose: 'guide' }, ...Array.from({ length: 10 }, (_, i) => ({ t: 42.9 + i * .36, pose: i % 2 ? 'guide' : 'guide2' })), { t: 46.44, pose: 'watch' }, { t: 50.62, pose: 'stun' }];
cast.sB.timeline = [{ t: 0, pose: 'watch' }, { t: 50.66, pose: 'stun2' }];
cast.runners.forEach((r, i) => { r.timeline = [{ t: 0, pose: 'ready' }, ...Array.from({ length: 6 }, (_, k) => ({ t: 41.2 + k * .11 + i * .03, pose: k % 2 ? 'run2' : 'run1' }))]; });
const put = (a, parent, x, y, z, sc = 1) => { if (a.root.parent !== parent) parent.add(a.root); a.root.position.set(x, y, z); a.root.scale.setScalar(sc); };
const lit = (a, t, key, amb, rim = 0, rimDir = [1, .35], glow = .04) => { a.update(t, camera); a.light({ key, ambient: amb, rim: _rim.set(1, .86, .55).multiplyScalar(rim), rimDir, glow }); };
const _k = new THREE.Color(), _amb = new THREE.Color();

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
  seabed.surface.visible = true; only('seabed'); cast.suit.root.position.y = -99; hose.visible = false; spook.intensity = 0; cast.fish.root.scale.setScalar(1);
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
  only('sea', 'boat', 'island'); lumpDeck.visible = shoebox.visible = treasure.visible = false; put(cast.cap, boat.group, -.5, boat.DECK, .15); put(cast.niko, boat.group, .62, boat.DECK, .22);
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

/* =====================================================================
   Part 2 shots (10.36 s onward)
   ===================================================================== */
const DUSK = { sky: C('#ffd9b0'), ground: C('#566a96'), sunC: C('#ffb070') }, NIGHT = { sky: C('#3f5486'), ground: C('#141c30'), sunC: C('#93a9dc') };
const _o = V(0, 0, 0), _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _c4 = new THREE.Color();
/** outdoor light + sky for sea and land shots; returns { key, amb } colours for the actors */
function outdoor(t, { storm = 0, dusk = 0, night = 0, flash = 0, focus, size = 8, dir = SUN_DIR, boatAt = null, boltAt = null, water = true, fogN = 40, fogF = 190, sunMul = 1, gullsAt = null, glint = null }) {
  _c1.lerpColors(CALM.sky, STORM.sky, storm).lerp(DUSK.sky, dusk).lerp(NIGHT.sky, night); _c2.lerpColors(CALM.ground, STORM.ground, storm).lerp(DUSK.ground, dusk).lerp(NIGHT.ground, night); _c3.lerpColors(CALM.sunC, STORM.sunC, storm).lerp(DUSK.sunC, dusk).lerp(NIGHT.sunC, night);
  const hor = sea.update(t, camera, { storm, dusk, night, flash, fogNear: fogN, fogFar: fogF, boat: boatAt, boltAt, water, gullsAt, glint });
  const sunI = (lerp(2.3, .75, storm) * (1 - night * .62) * (1 - dusk * .2) + flash * 2) * sunMul;
  light({ sky: _c1, ground: _c2, hemiI: lerp(1.55, 1.25, storm) * (1 - night * .5) + flash * 3, sunC: _c3, sunI, dir, focus, size, fogC: hor, fogN, fogF });
  const key = _c4.copy(_c3).multiplyScalar((lerp(.62, .3, storm) * (1 - night * .45) + flash * .9) * Math.min(1, sunMul));
  _amb.set(lerp(.44, .3, storm), lerp(.46, .36, storm), lerp(.5, .48, storm)).multiplyScalar(1 - night * .4); if (dusk) _amb.lerp(_c1.set(.5, .4, .38), dusk * .6);
  return { key, amb: _amb };
}
function fxBase({ ink = .85, inkFar = 40, bloom = .4, thr = 1.5, vig = .34, dof = 0, focus = 5, range = 1.5 } = {}) {
  fx.ink = ink; fx.inkFar = inkFar; fx.bloom = bloom; fx.threshold = thr; fx.vignette = vig; fx.flash = 0; fx.glow = 0; fx.mblur.set(0, 0); fx.dof = dof; fx.focus = focus; fx.dofRange = range;
}
/** camera given in boat-local coordinates (x forward, z to starboard), ignoring pitch and roll */
function camBoat(k, bx, bz, h, p0, p1, t0, t1, fov0, fov1, roll0 = 0, roll1 = 0) {
  const by = boat.group.position.y, cs = Math.cos(h), sn = Math.sin(h), W = (v, out) => out.set(bx + v.x * cs + v.z * sn, v.y + by, bz - v.x * sn + v.z * cs);
  cam(k, W(p0, _w0), W(p1, _w1), W(t0, _w2), W(t1, _w3), fov0, fov1, roll0, roll1);
}
const _w0 = V(0, 0, 0), _w1 = V(0, 0, 0), _w2 = V(0, 0, 0), _w3 = V(0, 0, 0), _w4 = V(0, 0, 0);
const glowAt = (p, amt, r = 1, g = .7, b = .3) => { _b.copy(p).project(camera); fx.glowUV.set(_b.x * .5 + .5, _b.y * .5 + .5); fx.glow = amt; fx.glowColor.setRGB(r, g, b); };
const HORSE = seabed.group.children.find(c => c.userData.horseHead).userData.horseHead.clone().add(STATUES);

function uwLight(n, dark = 0) {
  _c1.copy(UW.sky).lerp(_c2.set('#0d3a36'), dark); _c3.copy(UW.fog).lerp(_c4.set('#04161c'), dark);
  light({ sky: _c1, ground: UW.ground, hemiI: lerp(1.9, .5, dark), sunC: UW.sunC, sunI: lerp(1.7, .12, dark), dir: UW.dir, focus: n, size: 9, fogC: _c3, fogN: lerp(2.5, .8, dark), fogF: lerp(30, 9.5, dark) });
}
function s7(t) {                                              // the diver goes down
  seabed.surface.visible = true; only('seabed'); const k = moveK(t, 10.36, 11.76, .2), y = lerp(5.6, 2.3, k); uwLight(_o.set(1.8, 0, 1.2));
  cast.fish.root.position.y = -99; put(cast.suit, seabed.group, 1.8, y, 1.2); hose.visible = true; hose.position.set(1.86, y + 9.3, 1.2); spook.intensity = 0;
  cam(k, V(5.0, 5.6, 6.6), V(4.5, 2.9, 5.9), V(1.5, 6.3, 1.0), V(1.5, 3.0, 1.0), 44, 40, .06, 0);
  seabed.update(t, camera, {}); lit(cast.suit, t, _k.set(.66, .8, .88), _amb.set(.3, .42, .5), .25, [-.4, 1]);
  fxBase({ ink: .9, inkFar: 18, bloom: .5, thr: 1.3, vig: .5, dof: .4, focus: camera.position.distanceTo(cast.suit.root.position), range: 1.4 });
}
function s9(t, clear) {                                       // "dead bodies and horses" -> "They were statues."
  only('seabed'); const S = STATUES, dark = clear ? 0 : 1; seabed.surface.visible = !!clear; uwLight(_o.set(S.x, 0, S.z), dark); hose.visible = false;
  if (clear) { cam(moveK(t, 16, 17.22, .3), V(S.x + 1.5, 1.2, S.z + 6.6), V(S.x + 1.3, 1.3, S.z + 6.1), V(S.x - .1, 1.25, S.z), V(S.x - .1, 1.25, S.z), 50, 48, 0, 0); spook.intensity = 0;
    cast.fish.root.position.set(HORSE.x - .05, HORSE.y + .3, HORSE.z + .1); cast.fish.root.scale.setScalar(2.2); }
  else { cam(moveK(t, 13.55, 16, .3), V(S.x + 2.2, .7, S.z + 6.4), V(S.x + 1.3, .95, S.z + 4.7), V(S.x - .2, 1.3, S.z), V(S.x + .2, 1.5, S.z), 44, 40, .14, .08);
    const onHorse = t >= 14.55; spook.position.copy(onHorse ? HORSE : _w4.set(S.x - 1.2, 1.6, S.z + .2)).add(_w2.set(.4, .3, 1.4)); spook.intensity = (onHorse ? 5 : 3.2) * (.7 + .3 * Math.sin(t * 17)) * smooth((t - 13.7) / .25);
    cast.fish.root.position.y = -99; cast.fish.root.scale.setScalar(1); }
  put(cast.suit, seabed.group, S.x + 1.85 + (clear ? 0 : .012 * Math.sin(t * 46)), .05, S.z + 2.6);
  seabed.update(t, camera, {});
  cast.fish.update(t, camera); cast.fish.light({ key: _k.set(.62, .78, .86), ambient: _amb.set(.3, .42, .5), rim: _rim.set(0, 0, 0), rimDir: [1, 0] });
  lit(cast.suit, t, _k.set(.66, .8, .88).multiplyScalar(clear ? 1 : .32), _amb.set(.3, .42, .5).multiplyScalar(clear ? 1 : .4), clear ? .2 : .5, [-1, .4]);
  if (!clear) cast.suit.u.rimC.value.set(.3, 1, .7).multiplyScalar(.5);
  fxBase({ ink: .9, inkFar: clear ? 20 : 9, bloom: .5, thr: 1.3, vig: clear ? .45 : .7, dof: .35, focus: 5.5, range: 1.6 });
}
function s11(t) {                                             // the ancient ship goes down
  only('sea', 'galley'); const gx = 0, gz = 200, sink = smooth((t - 18.05) / 1.9); let flash = 0; for (const [ts, a] of [[18.05, 1], [18.2, .6], [19.3, .5]]) if (t >= ts) flash = Math.max(flash, a * Math.exp(-(t - ts) * 8));
  galley.update(t, gx, gz, .55, 1, sink);
  cam(moveK(t, 17.22, 19.98, .4), V(-8.5, 1.1, 210.5), V(-7, 3.4, 211.8), V(.2, 3.2, 200), V(0, 1.6, 200), 46, 44, -.09, -.03);
  outdoor(t, { storm: 1, night: .5, sunMul: 1.7, flash, focus: _o.set(gx, 0, gz), size: 10, boatAt: { x: gx, z: gz, r: 4.4 * (1 - sink * .5) }, boltAt: { x: 16 - (t > 18.15 ? 26 : 0), y: 30, z: 90 }, fogN: 18, fogF: 120 });
  fxBase({ inkFar: 50, vig: .5 }); fx.flash = flash * .1;
}
function deck(t, n) {                                         // 8: babbling · 12-14: the lump · 32-33: finale
  only('sea', 'boat', 'island'); const fin = n >= 32, moored = n === 8;
  const bx = moored ? .15 : fin ? 6 : (t - 19.9) * 1.0, bz = moored ? 10.3 : fin ? 27 : 80, h = moored ? Math.PI / 2 : fin ? .22 : 0;
  const storm = moored ? .55 : 0, dusk = fin ? .85 : 0;
  boat.update(t, bx, bz, h, moored ? .3 : fin ? .25 : 0); island.update(t, moored ? .5 : fin ? .6 : 0);
  lumpDeck.visible = treasure.visible = n >= 12 && n <= 14; shoebox.visible = n === 14; let dof = .8, focus = 6, range = 1.3, inkFar = 36, mb = 0;
  if (n === 8) { put(cast.cap, boat.group, -.5, boat.DECK, .15); put(cast.niko, boat.group, .62, boat.DECK, .22);
    camBoat(moveK(t, 11.76, 13.55, .4), bx, bz, h, V(.35, 1.95, 6.4), V(.2, 1.8, 5.5), V(.08, 1.2, 0), V(.1, 1.2, 0), 34, 32, 0, 0); }
  else if (n <= 14) { put(cast.cap, boat.group, -2.1, boat.DECK, -.74); cast.niko.root.position.y = -99;
    const drop = clamp01((t - 23.5) / .22), bounce = t > 23.72 ? .1 * Math.exp(-(t - 23.72) * 9) * Math.abs(Math.cos((t - 23.72) * 16)) : 0;
    lumpDeck.position.set(n === 14 ? -2.28 : -2.05, ROOF, .12); lumpDeck.userData.reveal(0, t); shoebox.position.set(-1.78, ROOF + (1 - drop * drop) * 1.6 + bounce, .14); shoebox.rotation.z = (1 - drop) * .5;
    if (n === 12) { camBoat(moveK(t, 19.98, 20.98, .3), bx, bz, h, V(1.9, 1.5, 3.3), V(-1.3, 1.6, 3.0), V(1.1, .75, 0), V(-1.9, 1.0, 0), 40, 38, .03, 0); mb = .012; dof = .4; focus = 3.3; range = 2; }
    else if (n === 13) { camBoat(moveK(t, 20.98, 23.18, .4), bx, bz, h, V(-1.55, 1.6, 2.5), V(-1.8, 1.5, 1.95), V(-2.05, 1.22, 0), V(-2.05, 1.2, 0), 30, 28, -.03, 0); focus = 2.2; range = .9; }
    else { camBoat(moveK(t, 23.18, 24.95, .4), bx, bz, h, V(-1.6, 1.75, 3.0), V(-1.75, 1.7, 2.75), V(-2.0, 1.25, 0), V(-2.0, 1.25, 0), 34, 33, 0, 0); focus = 3; range = 1.1; } }
  else { put(cast.cap, boat.group, -.5, boat.DECK, .15); put(cast.niko, boat.group, .62, boat.DECK, .22);
    if (n === 32) camBoat(moveK(t, 55.78, 57.7, .4), bx, bz, h, V(.4, 1.95, 6.3), V(.2, 1.85, 5.6), V(.08, 1.2, 0), V(.06, 1.2, 0), 34, 32, 0, 0);
    else { const k = moveK(t, 57.7, 60.4, 0), e = k <= 0 ? k : k * k * (3 - 2 * Math.min(1, k)); camBoat(e, bx, bz, h, V(-.3, 1.5, 3.0), V(5.5, 11, 24), V(-.48, .98, .15), V(-1.5, 2.2, -6), 30, 42, 0, -.04); dof = .8 * (1 - smooth(k * 3)); focus = 3.1; inkFar = lerp(36, 130, smooth(k * 2)); } }
  const L = outdoor(t, { storm, dusk, focus: _o.set(bx, 0, bz), size: n === 33 ? 26 : 6, boatAt: { x: bx, z: bz, r: 3.3 }, gullsAt: fin ? { x: bx, y: 6, z: bz } : null });
  for (const a of [cast.cap, cast.niko]) lit(a, t, L.key, L.amb, fin ? .7 : lerp(.45, .2, storm), fin ? [-1, .3] : [1, .35], .04);
  fxBase({ inkFar, dof, focus, range, vig: fin ? .42 : .34, bloom: fin ? .55 : .4, thr: fin ? 1.35 : 1.5 }); fx.mblur.set(mb, 0);
  if (n === 33) { const g = smooth((t - 57.75) / .3); cast.cap.root.getWorldPosition(_w0); _w0.y += .62; glowAt(_w0, g * .22); }
}
function roomLight(kind) {
  const warm = kind !== 'lab';
  light({ sky: _c1.set(kind === 'lab' ? '#d6ecff' : kind === 'workshop' ? '#f2e2c6' : '#f1ece0'), ground: _c2.set(kind === 'lab' ? '#5c6c80' : '#6a5038'), hemiI: kind === 'lab' ? 1.5 : kind === 'workshop' ? .75 : 1.05,
    sunC: _c3.set(warm ? '#cfe0ff' : '#eef6ff'), sunI: kind === 'workshop' ? .45 : .95, dir: _o.set(.5, .7, .6).normalize(), focus: _w3.set(0, 1, 0), size: 4.5, fogC: _c4.set(kind === 'lab' ? '#b9cfdd' : kind === 'workshop' ? '#4a3524' : '#6f8a74'), fogN: 8, fogF: 40 });
}
function inRoom(t, n) {
  only('room'); const kind = n <= 17 ? 'museum' : n <= 21 ? 'workshop' : 'lab'; roomLight(kind);
  lumpRoom.visible = n <= 17 || n >= 27; restoredRoom.visible = n === 20 || n === 21; let o = {}, dof = .6, focus = 2.5, range = 1.4, glow = null;
  for (const a of [cast.doc, cast.philon, cast.sA, cast.sB]) if (a.root.parent === room.group) a.root.position.y = -99;
  const amb = _amb.set(.42, .38, .36);
  if (n === 15) { const f1 = clamp01((t - 25.02) / .36), f2 = clamp01((t - 25.5) / .36); o = { year: f1 >= 1 ? (f2 >= 1 ? 2 : 1) : 0, flip: f1 < 1 ? f1 : f2 < 1 ? f2 : 0 }; lumpRoom.position.set(-.2, room.tableY, .08);
    cam(moveK(t, 24.95, 26, .4), V(-1.0, 1.8, .7), V(-1.2, 1.78, .25), V(-1.45, 1.78, -1.68), V(-1.45, 1.76, -1.68), 32, 30, .03, 0); focus = 2.1; }
  else if (n === 16 || n === 17) { o = { year: 2 }; lumpRoom.position.set(-.2, room.tableY, .08); lumpRoom.rotation.y = .25; lumpRoom.userData.reveal(smooth((t - 26.8) / .25), t);
    put(cast.doc, room.group, .62, 0, -.5, 1.42); lit(cast.doc, t, _k.set(1, .86, .66).multiplyScalar(.6), amb, .5, [-1, .1]);
    if (n === 16) { cam(moveK(t, 26, 27.95, .4), V(.5, 1.5, 3.2), V(.3, 1.4, 2.5), V(.02, 1.17, -.2), V(0, 1.15, -.2), 36, 34, 0, 0); focus = 2.7; }
    else { cam(moveK(t, 27.95, 29, .4), V(.25, 1.12, 1.15), V(.02, 1.04, .78), V(-.17, .94, .2), V(-.18, .94, .2), 30, 27, .03, 0); focus = .9; range = .6; dof = 1; glow = [_w0.set(-.17, .94, .24), .16, 1, .7, .3]; } }
  else if (n === 19) { o = { file: 1 }; put(cast.philon, room.group, .8, 0, -.5, 1.42); lit(cast.philon, t, _k.set(1, .72, .42).multiplyScalar(.7), _amb.set(.36, .28, .24), .6, [-1, .2]);
    cam(moveK(t, 30.02, 31.74, .4), V(-.75, 1.4, 1.95), V(-.5, 1.3, 1.55), V(.22, 1.17, 0), V(.22, 1.15, 0), 36, 34, -.03, 0); focus = 2; }
  else if (n === 20 || n === 21) { restoredRoom.userData.turn((t - 31.76) * 2.2); put(cast.philon, room.group, 1.2, 0, -.35, 1.42); lit(cast.philon, t, _k.set(1, .72, .42).multiplyScalar(.7), _amb.set(.36, .28, .24), .6, [-1, .2]);
    if (n === 20) { cam(moveK(t, 31.74, 32.6, .4), V(.2, 1.25, 1.35), V(.3, 1.2, 1.1), V(.5, 1.06, .1), V(.5, 1.06, .1), 36, 34, 0, 0); focus = 1.2; range = .9; }
    else { cam(moveK(t, 32.6, 33.42, .2), V(.42, 1.07, 1.0), V(.42, 1.07, .62), V(.42, 1.07, .15), V(.42, 1.07, .15), 32, 30, 0, .1); focus = .5; range = .7; dof = .9; } }
  else if (n === 27) { o = { scanOn: 1 }; lumpRoom.position.set(0, 1.0, -.62); lumpRoom.rotation.y = 0; lumpRoom.userData.reveal(0, t);
    cam(moveK(t, 46.44, 47.56, .4), V(.6, 1.45, 2.7), V(.22, 1.28, 1.5), V(0, 1.1, -.7), V(0, 1.1, -.7), 36, 34, .03, 0); focus = 2.5; glow = [_w0.set(0, 1.12, -.72), .2, .4, .8, 1]; }
  else { o = { scanOn: .6, manualK: clamp01((t - 50.48) / .24) }; lumpRoom.position.set(0, 1.0, -.62); put(cast.sA, room.group, -.55, 0, -.55, 1.42); put(cast.sB, room.group, .55, 0, -.6, 1.42);
    for (const a of [cast.sA, cast.sB]) lit(a, t, _k.set(.86, .94, 1).multiplyScalar(.62), _amb.set(.4, .44, .5), .4, [0, 1]);
    cam(moveK(t, 50.4, 51.72, .4), V(.1, 1.5, 3.0), V(.02, 1.42, 2.55), V(0, 1.16, 0), V(0, 1.16, 0), 40, 38, 0, 0); focus = 2.7; }
  room.set(kind, t, o);
  fxBase({ inkFar: 14, dof, focus, range, vig: kind === 'workshop' ? .55 : .4, bloom: .5, thr: 1.35 }); if (glow) glowAt(...glow);
}
function inVoid(t, n) {
  only('vd'); const what = n === 18 ? 'burst' : n === 22 ? 'sky' : n === 23 ? 'eclipse' : 'xray'; vd.show(what);
  const bg = _c4.set(n === 18 ? '#0d0b18' : n === 28 ? '#041a30' : '#0a1030'); let ecl = -1, glow = null;
  if (n === 23) { ecl = clamp01((t - 35.85) / 1.05); bg.set('#3466b0').lerp(_c1.set('#05060f'), smooth(ecl)); }
  light({ sky: _c1.set('#fff3d8'), ground: _c2.set('#3a2c50'), hemiI: 1.3, sunC: _c3.set('#ffffff'), sunI: 1.2, dir: _o.set(.3, .5, .8).normalize(), focus: _w3.set(0, 0, 0), size: 5, fogC: bg, fogN: 30, fogF: 90 });
  if (cast.philon.root.parent === vd.group) cast.philon.root.position.y = -99;
  if (n === 18) { vd.updateBurst(t, clamp01((t - 29.0) / .55)); cam(easeOutK(moveK(t, 29, 30.02, 0)), V(0, 0, 1.0), V(.1, .05, 3.3), V(0, 0, 0), V(0, 0, 0), 40, 40, .1, 0); glow = [_w0.set(0, 0, 0), .18, 1, .7, .3]; }
  else if (n === 22) { const hi = t >= 34.84 ? 'planets' : t >= 34.1 && t < 34.75 ? 'moon' : t >= 33.4 && t < 34.05 ? 'sun' : null; cam(moveK(t, 33.42, 35.76, .3), V(0, -1.5, 9.5), V(.4, -.6, 7.2), V(0, 0, 0), V(0, 0, 0), 62, 58, .08, -.04); vd.updateSky(t, camera, { hi }); }
  else if (n === 23) { cam(moveK(t, 35.76, 37.29, .3), V(.3, -1.5, 8.2), V(.2, -1.3, 7.2), V(0, -.5, 0), V(0, -.4, 0), 44, 42, 0, 0); vd.updateSky(t, camera, { ecl });
    put(cast.philon, vd.group, .62, -2.75, 3.4); lit(cast.philon, t, _k.set(1, .9, .7).multiplyScalar(lerp(.6, .12, smooth(ecl))), _amb.set(.3, .3, .4).multiplyScalar(lerp(1, .35, smooth(ecl))), .9, [-.5, 1]); }
  else { vd.updateXray(t, clamp01((t - 47.9) / 2.0)); cam(moveK(t, 47.56, 50.4, .3), V(-.2, .5, 6.2), V(.3, -.3, 2.3), V(0, .1, 0), V(.3, -.3, 0), 44, 40, -.04, .03); }
  fxBase({ ink: n === 18 ? .8 : 0, inkFar: 20, bloom: .6, thr: 1.2, vig: .5 }); if (glow) glowAt(...glow);
}
function inGreece(t, n) {
  only('sea', 'greek'); let env = { water: false, focus: _o.set(0, 0, 0), size: 12, fogN: 50, fogF: 200 }, inkFar = 60, dof = 0, focus = 5;
  for (const a of [cast.philon, cast.sA, cast.sB, ...cast.runners]) if (a.root.parent === greek.group) a.root.position.y = -99;
  restoredEra.visible = n === 31; const who = [];
  if (n === 24) { const a = lerp(-1.15, 1.15, clamp01((t - 37.29) / 1.17)); env.dir = _w3.set(Math.sin(a) * .9, Math.cos(a) * .8 + .22, .38).normalize(); env.dusk = Math.pow(Math.abs(a) / 1.15, 2) * .9; env.size = 6;
    cam(moveK(t, 37.29, 38.46, .3), V(2.4, 3.5, 3.6), V(2.0, 3.25, 3.1), V(0, 1.1, 0), V(0, 1.1, 0), 38, 36, .03, 0); greek.show('court', t); }
  else if (n === 25) { const go = Math.max(0, t - 41.2), cheer = smooth((t - 41.1) / .2); env.size = 14;
    cast.runners.forEach((r, i) => { put(r, greek.group, -1.35 + i * 1.35, .27, -1.2 + go * (8.5 + i * .8), 1.25); who.push(r); }); put(cast.philon, greek.group, -2.35, .27, 1.0, 1.25); who.push(cast.philon);
    cam(moveK(t, 38.46, 41.63, .4), V(.9, .95, 7.4), V(.3, 1.25, 6.0), V(-.3, 1.5, -1.5), V(-.3, 1.45, -1.5), 44, 42, -.03, 0); greek.show('olympia', t, { cheer }); }
  else if (n === 26) { env.dusk = .3; env.size = 30; cam(moveK(t, 41.63, 42.9, .3), V(15, 9.5, 17), V(12, 8, 14), V(-7, 5.5, -20), V(-7, 5.2, -20), 48, 46, .03, 0); greek.show('athens', t, { truckX: -30 }); inkFar = 120; }
  else if (n === 27) { const k = clamp01((t - 42.9) / 2.7), e = 1 - Math.pow(1 - k, 2.2), x = lerp(-17, -1.4, e), st = t - 45.6; env.dusk = .25; env.focus = _o.set(x, 0, 2); env.size = 12;
    put(cast.sA, greek.group, .9, .27, 6.6, 1.3); put(cast.sB, greek.group, 2.2, .27, 7.0, 1.3); who.push(cast.sA, cast.sB);
    cam(moveK(t, 42.9, 46.44, .2), V(x + 5.5, 2.0, 15), V(x + 4.2, 2.3, 14), V(x + .2, 2.5, 3.0), V(x + .6, 2.5, 2.6), 46, 44, 0, 0); greek.show('athens', t, { truckX: x, squash: .65 + (st > 0 ? .5 * Math.exp(-st * 5) * Math.cos(st * 17) : 0) }); }
  else { const k = clamp01((t - 51.9) / 3.5), night = .5 - .5 * Math.cos((t - 51.72) * 5.2); env.night = night * .8; env.focus = _o.set(0, 0, -4); env.size = 16; restoredEra.userData.turn(t * 3);
    const a = lerp(-.4, .4, moveK(t, 51.72, 55.78, .3)); cam(0, _w0.set(Math.sin(a) * 4.4, lerp(1.9, 2.3, k), Math.cos(a) * 4.4), _w1, _w2.set(0, 1.5, -2), _w3, 48, 48, 0, 0); greek.show('eras', t, { eraK: k * 2 }); dof = .35; focus = 4.4; }
  const L = outdoor(t, env); for (const a of who) lit(a, t, L.key, L.amb, .45, [1, .35], .04);
  fxBase({ inkFar, dof, focus, range: 2.5 });
}

const SH = (t0, t1, fn, xf = .2) => ({ t0, t1, xf, apply: fn });
const shots = new Shots(stage, [
  SH(0, 1.55, (t) => shotSeabed(t, 1)), SH(1.55, 3.62, (t) => shotSeabed(t, 2), .3), SH(3.62, 5.33, (t) => shotSea(t, 3)), SH(5.33, 7.6, (t) => shotSea(t, 4)), SH(7.6, 9.25, (t) => shotSea(t, 5)), SH(9.25, 10.36, (t) => shotSea(t, 6)),
  SH(10.36, 11.76, s7), SH(11.76, 13.55, (t) => deck(t, 8)), SH(13.55, 16.0, (t) => s9(t, false), .1), SH(16.0, 17.22, (t) => s9(t, true)), SH(17.22, 19.98, s11),
  SH(19.98, 20.98, (t) => deck(t, 12)), SH(20.98, 23.18, (t) => deck(t, 13), .1), SH(23.18, 24.95, (t) => deck(t, 14)),
  SH(24.95, 26.0, (t) => inRoom(t, 15)), SH(26.0, 27.95, (t) => inRoom(t, 16)), SH(27.95, 29.0, (t) => inRoom(t, 17)), SH(29.0, 30.02, (t) => inVoid(t, 18)),
  SH(30.02, 31.74, (t) => inRoom(t, 19)), SH(31.74, 32.6, (t) => inRoom(t, 20)), SH(32.6, 33.42, (t) => inRoom(t, 21), .3), SH(33.42, 35.76, (t) => inVoid(t, 22)), SH(35.76, 37.29, (t) => inVoid(t, 23)),
  SH(37.29, 38.46, (t) => inGreece(t, 24)), SH(38.46, 41.63, (t) => inGreece(t, 25)), SH(41.63, 42.9, (t) => inGreece(t, 26)), SH(42.9, 46.44, (t) => inGreece(t, 27)),
  SH(46.44, 47.56, (t) => inRoom(t, 27)), SH(47.56, 50.4, (t) => inVoid(t, 28)), SH(50.4, 51.72, (t) => inRoom(t, 29)), SH(51.72, 55.78, (t) => inGreece(t, 31)),
  SH(55.78, 57.7, (t) => deck(t, 32)), SH(57.7, DURATION + 1, (t) => deck(t, 33), 0),
]);
stage.onRender = (t) => shots.render(t);

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
  // ---- part 2 ----
  const blip = (t, f, p = .03, d = .09, f2) => at(t, (ctx, out, when) => synth.osc(ctx, out, 'sine', f, when, .008, p, d, f2 || f * 1.6));
  const click = (t, p = .05) => at(t, (ctx, out, when) => { synth.noise(ctx, out, when, 'highpass', 3000, 1, p, .03); synth.osc(ctx, out, 'square', 1800, when, .002, p * .25, .04); });
  const thud = (t, p = .3) => at(t, (ctx, out, when) => { synth.osc(ctx, out, 'sine', 90, when, .005, p, .22, 45); synth.noise(ctx, out, when, 'lowpass', 400, .8, p * .5, .12); });
  const chime = (t, f, p = .04) => at(t, (ctx, out, when) => synth.bell(ctx, out, f, when, p, 1.2));
  amb(10.3, 11.8, 'lowpass', 260, .7, .09); for (const t of [10.5, 10.8, 11.1, 11.4, 11.6]) blip(t, 500 + (t * 977 % 400));
  amb(11.7, 13.6, 'lowpass', 700, .5, .05); amb(13.5, 17.3, 'lowpass', 220, .7, .1);
  at(13.6, (ctx, out, when) => { synth.osc(ctx, out, 'sawtooth', 58, when, .4, .05, 2.2, 52); synth.osc(ctx, out, 'sine', 87, when + .9, .3, .05, 1.2, 82); }); chime(16.02, 1046, .05); chime(16.1, 1568, .04);
  amb(17.2, 20.0, 'bandpass', 420, 1.4, .1, 700); amb(17.2, 20.0, 'highpass', 3800, .5, .04); thunder(18.05, 1); thunder(19.3, .5); at(18.4, (ctx, out, when) => synth.noise(ctx, out, when, 'lowpass', 900, .8, .22, 1.3, 120));
  amb(19.9, 25.0, 'lowpass', 700, .5, .05); at(20.0, (ctx, out, when) => synth.noise(ctx, out, when, 'bandpass', 500, 1.2, .1, .5, 1800)); thud(23.72, .32); thud(23.9, .12); chime(23.76, 784, .03);
  for (const t of [25.05, 25.52]) at(t, (ctx, out, when) => synth.noise(ctx, out, when, 'bandpass', 2400, 1.5, .1, .16, 900)); chime(26.88, 1760, .05); chime(26.95, 2637, .04);
  for (let i = 0; i < 8; i++) click(28.0 + i * .12, .04); at(29.0, (ctx, out, when) => { synth.noise(ctx, out, when, 'bandpass', 400, 1.2, .18, .5, 3000); for (const [f, d] of [[660, 0], [880, .06], [1320, .12], [1760, .18]]) synth.bell(ctx, out, f, when + d, .035, 1.0); });
  for (let i = 0; i < 9; i++) at(30.05 + i * .19, (ctx, out, when) => synth.noise(ctx, out, when, 'bandpass', 2600, 2.5, .07, .12, 3400));
  for (let i = 0; i < 12; i++) click(31.8 + i * .13, .035); chime(33.48, 523, .06); chime(34.18, 784, .05); for (const [d, f] of [[0, 988], [.12, 1175], [.24, 1319], [.36, 1568]]) chime(34.9 + d, f, .03);
  at(35.85, (ctx, out, when) => { synth.osc(ctx, out, 'sine', 110, when, .5, .08, 1.3, 70); synth.osc(ctx, out, 'sine', 165, when, .5, .05, 1.3, 105); }); chime(36.9, 1976, .03);
  for (let i = 0; i < 5; i++) click(37.35 + i * .2, .03);
  amb(38.4, 41.7, 'bandpass', 900, .6, .05, 1300); at(41.2, (ctx, out, when) => { synth.osc(ctx, out, 'sawtooth', 330, when, .02, .07, .5, 440); synth.noise(ctx, out, when, 'bandpass', 1200, .5, .16, .7, 1800); });
  amb(41.6, 46.5, 'lowpass', 500, .5, .04); at(42.9, (ctx, out, when) => { synth.osc(ctx, out, 'sawtooth', 62, when, .3, .07, 2.6, 48); synth.osc(ctx, out, 'square', 31, when, .3, .04, 2.6, 24); }); at(45.5, (ctx, out, when) => synth.noise(ctx, out, when, 'bandpass', 2600, 6, .07, .35, 1500)); thud(45.62, .3);
  at(46.44, (ctx, out, when) => { synth.osc(ctx, out, 'sine', 180, when, .3, .06, 4.6); synth.osc(ctx, out, 'sine', 272, when, .3, .03, 4.6); }); for (let i = 0; i < 22; i++) blip(48.0 + i * .1, 1400 + (i * 613 % 900), .012, .05);
  at(50.5, (ctx, out, when) => { synth.osc(ctx, out, 'sine', 420, when, .005, .1, .14, 900); synth.bell(ctx, out, 1568, when + .08, .05, .9); });
  for (let i = 0; i < 16; i++) click(51.8 + i * .25, .03); chime(55.3, 392, .05);
  amb(55.7, 60.4, 'lowpass', 700, .5, .06); for (const t of [56.1, 56.9]) at(t, (ctx, out, when) => { synth.osc(ctx, out, 'triangle', 1750, when, .02, .025, .16, 1250); }); for (const [d, f] of [[0, 523], [.15, 659], [.3, 784], [.5, 1046]]) chime(57.75 + d, f, .05); chime(59.5, 1568, .04);
  for (let i = 0; i * .2 < DURATION - .2; i++) at(.02 + i * .2, (ctx, out, when) => { const f = N[seq[i % seq.length]]; synth.osc(ctx, out, 'triangle', f * (i * .2 < 3.6 || (i * .2 > 13.5 && i * .2 < 20) || (i * .2 > 33.4 && i * .2 < 37.3) ? .5 : 1), when, .004, .022, .22); synth.osc(ctx, out, 'sine', f * 2, when, .003, .008, .12); });
  return ev;
}

/* ---------- boot ---------- */
(async () => {
  await Promise.all([loadFont('Fredoka', '../../assets/fonts/fredoka-700.woff2'), Sound.load('./vo-full-tight.mp3', { t: 0, gain: 1.0 })]);
  const captions = new Captions(CARDS.map(([t, text]) => ({ t, text })), { end: VO_END + .12 }); stage.overlay = captions;
  Sound.events = buildSound();
  await stage.boot({ warmTimes: shots.shots.map(s => Math.min(DURATION, (s.t0 + Math.min(s.t1, DURATION)) / 2)) });
})();
