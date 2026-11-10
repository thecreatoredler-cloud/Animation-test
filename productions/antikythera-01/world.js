// Sets for "The Ancient Computer Found Underwater": seabed with the wreck and the mechanism,
// the sea with the sponge boat, and the tiny island. Toon materials; ink lines come from lib/post.js.
// Every animated part is a function of time (update(t, ...)), never of frame count.
import * as THREE from 'three';
import { toon, canvasTex, rng } from '../../lib/toon.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, k) => a + (b - a) * k;
const mesh = (g, m, x = 0, y = 0, z = 0, o = {}) => { const s = new THREE.Mesh(g, m); s.position.set(x, y, z); s.castShadow = o.cast !== false; s.receiveShadow = o.recv !== false; return s; };
const TONE = `#include <tonemapping_fragment>\n#include <colorspace_fragment>`;

/* =====================================================================
   Waves (shared by the water shader and the boat)
   ===================================================================== */
export function waveH(x, z, t, storm) {
  const A = lerp(.07, .40, storm);
  return A * (.5 * Math.sin(x * .35 + t * 1.1) + .3 * Math.sin(z * .5 + x * .12 + t * 1.5) + .2 * Math.sin((x + z) * .9 - t * 2.1));
}
const WAVE_GLSL = `
  float waveH(vec2 p, float t, float storm, out vec2 d){
    float A = mix(0.07, 0.40, storm);
    float a = p.x * 0.35 + t * 1.1, b = p.y * 0.5 + p.x * 0.12 + t * 1.5, c = (p.x + p.y) * 0.9 - t * 2.1;
    d = A * vec2(0.5 * 0.35 * cos(a) + 0.3 * 0.12 * cos(b) + 0.2 * 0.9 * cos(c), 0.3 * 0.5 * cos(b) + 0.2 * 0.9 * cos(c));
    return A * (0.5 * sin(a) + 0.3 * sin(b) + 0.2 * sin(c));
  }`;

/* =====================================================================
   1. Seabed: wreck, amphorae, statue, mechanism
   ===================================================================== */
function amphoraGeo() {
  const p = [[0, 0], [.05, .02], [.13, .2], [.17, .42], [.15, .6], [.08, .72], [.055, .8], [.055, .9], [.085, .93], [.085, .96], [.05, .96]];
  return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), 14);
}
function gearGeo(r, teeth, depth, spokes = 4, hole = .18) {
  const s = new THREE.Shape(), n = teeth * 2;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = i % 2 ? r : r * (1 - 2.2 / teeth - .03); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const ri = r * .78, rh = r * hole + r * .1, gap = .2;                                                // sector windows leave spokes
  for (let k = 0; k < spokes; k++) {
    const a0 = k / spokes * Math.PI * 2 + gap, a1 = (k + 1) / spokes * Math.PI * 2 - gap, h = new THREE.Path();
    h.moveTo(Math.cos(a0) * rh * 1.6, Math.sin(a0) * rh * 1.6); h.absarc(0, 0, ri, a0 * 1 + .02, a1 - .02, false); h.lineTo(Math.cos(a1) * rh * 1.6, Math.sin(a1) * rh * 1.6); h.absarc(0, 0, rh * 1.6, a1, a0, true);
    s.holes.push(h);
  }
  const c = new THREE.Path(); c.absarc(0, 0, r * hole * .5, 0, Math.PI * 2, true); s.holes.push(c);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 });
}

export function buildSeabed() {
  const G = new THREE.Group(), R = rng(7), anim = {};
  /* sand with dunes + moving caustics */
  const sandTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#d8c79c'; g.fillRect(0, 0, w, h); const r = rng(3);
    g.strokeStyle = 'rgba(150,125,85,.5)'; g.lineWidth = 3; for (let i = 0; i < 46; i++) { const y = i * 11.2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + 6 * Math.sin(x * .03 + i)); g.stroke(); }
    g.fillStyle = 'rgba(110,90,60,.5)'; for (let i = 0; i < 260; i++) g.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 2); }, { repeat: true });
  sandTex.repeat.set(7, 7);
  const caus = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const r = rng(11); g.strokeStyle = '#fff'; g.lineCap = 'round'; g.filter = 'blur(1.5px)';
    for (let i = 0; i < 70; i++) { g.lineWidth = 1.5 + r() * 3; g.globalAlpha = .35 + r() * .5; g.beginPath(); const x = r() * w, y = r() * h, rr = 14 + r() * 26; g.arc(x, y, rr, r() * 6, r() * 6 + 1.6 + r() * 2); g.stroke(); } }, { repeat: true, srgb: false });
  caus.wrapS = caus.wrapT = THREE.MirroredRepeatWrapping; caus.repeat.set(6, 6);
  const sandMat = toon('#ffffff', { map: sandTex, emissive: new THREE.Color('#7fd9ff'), emissiveMap: caus, emissiveIntensity: .5 });
  const dune = (x, z) => .22 * Math.sin(x * .5 + 1) * Math.cos(z * .4) + .12 * Math.sin(x * 1.3 + z * .9);
  { const g = new THREE.PlaneGeometry(60, 60, 70, 70); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, dune(p.getX(i), p.getZ(i))); g.computeVertexNormals();
    G.add(mesh(g, sandMat, 0, 0, 0, { cast: false })); }
  anim.caus = caus;

  /* the wreck: keel, ribs, surviving planking, fallen mast */
  const wood = toon('#6a4d38'), woodDark = toon('#4a3528'), wreck = new THREE.Group(); wreck.rotation.set(.0, .25, .16); wreck.position.set(-.4, .1, -.6); G.add(wreck);
  wreck.add(mesh(new THREE.BoxGeometry(7.6, .28, .34), woodDark, 0, .05, 0));
  for (let i = 0; i < 11; i++) {
    const x = -3.4 + i * .68, s = 1 - Math.pow(Math.abs(i - 5) / 6.2, 2.2), broken = [2, 6, 9].includes(i);
    for (const side of [-1, 1]) {
      const len = (side < 0 && broken ? .45 : 1) * Math.PI * .5;
      const rib = mesh(new THREE.TorusGeometry(1.5 * s + .15, .075, 6, 14, len), wood, x, 1.5 * s + .2, 0);
      rib.rotation.set(0, side > 0 ? Math.PI / 2 : -Math.PI / 2, -Math.PI / 2); rib.scale.set(1, 1, 1); wreck.add(rib);
    }
  }
  for (const [x0, x1, th0, th1] of [[-3.2, -.6, .15, .95], [.2, 2.9, .1, .7]]) {     // hull shell pieces
    const g = new THREE.CylinderGeometry(1.72, 1.72, x1 - x0, 10, 1, true, Math.PI + th0, th1 - th0); g.rotateZ(Math.PI / 2);
    const m = mesh(g, new THREE.MeshToonMaterial({ color: '#6b4f3a', side: THREE.DoubleSide, gradientMap: wood.gradientMap }), (x0 + x1) / 2, 1.7, 0); m.scale.set(1, 1, .95); wreck.add(m);
  }
  { const mast = mesh(new THREE.CylinderGeometry(.11, .15, 6.2, 8), wood, .6, 1.25, 1.5); mast.rotation.set(1.1, .3, 1.05); G.add(mast); }

  /* amphorae */
  const terra = toon('#c06a3c'), terraD = toon('#9a5230'), aGeo = amphoraGeo(), hGeo = new THREE.TorusGeometry(.06, .016, 5, 8, Math.PI);
  const amph = (x, z, rx, rz, s = 1, m = terra, y = null) => { const a = new THREE.Group(); a.add(mesh(aGeo, m));
    for (const sd of [-1, 1]) { const h = mesh(hGeo, m, sd * .1, .8, 0); h.rotation.z = -sd * Math.PI / 2; a.add(h); }
    a.position.set(x, y ?? dune(x, z) + .02, z); a.rotation.set(rx, R() * 6, rz); a.scale.setScalar(s); G.add(a); return a; };
  for (const [x, z, rx, rz, s] of [[.9, 1.6, 1.35, .2, 1.1], [2.4, 2.0, .2, -.35, 1], [2.75, 2.5, 1.45, 1.2, .95], [-1.6, 1.8, .15, .5, 1.05], [-2.4, 1.2, 1.5, -.4, 1], [-.5, 2.6, .5, .2, .9], [3.6, .6, .1, .2, 1.1],
    [-3.6, 2.6, 1.4, 2.0, 1], [.2, -2.4, .3, .1, 1.1], [-1.2, -2.0, 1.3, .7, 1], [4.4, 2.4, .25, -.2, 1], [.1, 4.2, 1.5, 2.4, 1.0], [-3.0, 3.9, .2, .1, .9], [3.3, 3.8, .4, .3, 1.05]]) amph(x, z, rx, rz, s, R() > .5 ? terra : terraD);
  for (let i = 0; i < 5; i++) amph(-.9 + i * .34, -.35 + (i % 2) * .22, .12 * (i - 2), .1, 1, i % 2 ? terra : terraD, .3);

  /* marble bust on its side + a bronze arm reaching out of the sand */
  const marble = toon('#e9eef0'), bronze = toon('#3f9c84');
  { const b = new THREE.Group(); const torso = mesh(new THREE.LatheGeometry([[0, 0], [.3, 0], [.34, .12], [.3, .32], [.13, .46], [.11, .56]].map(p => new THREE.Vector2(...p)), 12), marble);
    const head = mesh(new THREE.SphereGeometry(.19, 14, 10), marble, 0, .74, 0); head.scale.set(.9, 1.1, .95);
    const hair = mesh(new THREE.SphereGeometry(.2, 12, 8, 0, 7, 0, 1.7), toon('#cfd8dc'), 0, .78, -.03), nose = mesh(new THREE.ConeGeometry(.035, .1, 4), marble, 0, .72, .18); nose.rotation.x = 1.6;
    b.add(torso, head, hair, nose); b.position.set(-2.6, .28, 2.6); b.rotation.set(.3, .9, 1.25); G.add(b); }
  { const a = new THREE.Group(); a.add(mesh(new THREE.CylinderGeometry(.055, .075, .75, 8), bronze, 0, .37, 0)); a.add(mesh(new THREE.SphereGeometry(.085, 8, 6), bronze, 0, .8, 0));
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.CylinderGeometry(.016, .02, .16, 5), bronze, -.05 + i * .033, .93, .01); f.rotation.z = .25 - i * .16; a.add(f); }
    a.position.set(3.2, -.05, 1.5); a.rotation.set(.2, -.6, -.3); G.add(a); }

  /* rocks, seaweed */
  const rockM = toon('#5d7d90'), rockM2 = toon('#48687e');
  for (let i = 0; i < 16; i++) { const g = new THREE.IcosahedronGeometry(.3 + R() * .7, 1), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const n = .8 + .4 * Math.sin(p.getX(k) * 9 + p.getY(k) * 7 + i); p.setXYZ(k, p.getX(k) * n, p.getY(k) * n * .7, p.getZ(k) * n); }
    g.computeVertexNormals(); const a = R() * 6.28, d = 4.5 + R() * 9; const rx = Math.cos(a) * d, rz = Math.sin(a) * d - 1; if (Math.hypot(rx - 2.2, rz - 4) > 2.6) G.add(mesh(g, i % 2 ? rockM : rockM2, rx, .05, rz)); }
  anim.weeds = [];
  const weedM = new THREE.MeshToonMaterial({ color: '#2f9a6a', side: THREE.DoubleSide, gradientMap: wood.gradientMap }), weedM2 = new THREE.MeshToonMaterial({ color: '#57b86a', side: THREE.DoubleSide, gradientMap: wood.gradientMap });
  for (let i = 0; i < 34; i++) { const h = .7 + R() * 1.5, g = new THREE.PlaneGeometry(.16, h, 1, 6); g.translate(0, h / 2, 0); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const y = p.getY(k) / h; p.setX(k, p.getX(k) * (1 - y * .8) + .12 * Math.sin(y * 5 + i)); }
    const a = R() * 6.28, d = 2.6 + R() * 7.5, x = Math.cos(a) * d + (R() - .5), z = Math.sin(a) * d * .8 + .5; const w = mesh(g, i % 3 ? weedM : weedM2, x, dune(x, z) - .03, z, { cast: false }); w.rotation.y = R() * 3; G.add(w); anim.weeds.push(w); }

  /* fish school, bubbles, drifting particles, light shafts, the surface far above */
  const fishShape = new THREE.Shape(); fishShape.moveTo(.16, 0); fishShape.quadraticCurveTo(.02, .09, -.1, 0); fishShape.lineTo(-.17, .06); fishShape.lineTo(-.17, -.06); fishShape.lineTo(-.1, 0); fishShape.quadraticCurveTo(.02, -.09, .16, 0);
  anim.school = new THREE.InstancedMesh(new THREE.ShapeGeometry(fishShape), new THREE.MeshBasicMaterial({ color: '#9fd6ea', side: THREE.DoubleSide }), 46); anim.school.frustumCulled = false; G.add(anim.school);
  anim.schoolSeed = Array.from({ length: 46 }, () => [R(), R(), R(), R()]);
  const bubTex = canvasTex(64, 64, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(22, 22, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.fill(); });
  const bubM = new THREE.MeshBasicMaterial({ map: bubTex, transparent: true, depthWrite: false, color: '#dff7ff' });
  anim.bubbles = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), bubM, 150); anim.bubbles.frustumCulled = false; anim.bubbles.renderOrder = 5; G.add(anim.bubbles);
  anim.bubSeed = Array.from({ length: 150 }, () => [R(), R(), R(), R(), R()]);
  { const n = 260, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([(R() - .5) * 18, R() * 7, (R() - .5) * 16 + 2], i * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    anim.snow = new THREE.Points(g, new THREE.PointsMaterial({ color: '#bfefff', size: .035, transparent: true, opacity: .55, depthWrite: false })); G.add(anim.snow); }
  const rayTex = canvasTex(64, 256, (g, w, h) => { const a = g.createLinearGradient(0, 0, 0, h); a.addColorStop(0, 'rgba(255,255,255,.9)'); a.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h);
    const b = g.createLinearGradient(0, 0, w, 0); b.addColorStop(0, 'rgba(0,0,0,1)'); b.addColorStop(.5, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = b; g.fillRect(0, 0, w, h); });
  anim.rays = [];
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9 + R() * 1.6, 15), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending, color: '#9fe8ff', side: THREE.DoubleSide, fog: false }));
    m.position.set(-7 + i * 1.75 + R(), 6.2, -3 + R() * 5); m.rotation.set(0, R() * .5 - .25, .34 + R() * .1); m.renderOrder = 4; G.add(m); anim.rays.push(m); }
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ color: '#8fe6ff', fog: false, side: THREE.DoubleSide })); m.rotation.x = Math.PI / 2; m.position.y = 16; G.add(m); }

  /* ---- the mechanism (hero prop) ---- */
  const M = new THREE.Group(); M.position.set(1.62, .3, 2.66); M.rotation.set(-.5, -.12, .1); G.add(M);
  const patina = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4fa58c'; g.fillRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 240; i++) { g.fillStyle = ['rgba(40,110,95,.5)', 'rgba(120,200,170,.45)', 'rgba(150,120,70,.4)', 'rgba(30,80,75,.5)'][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 16, 3 + r() * 10, r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(20,50,50,.7)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .5) * 50; y += (r() - .5) * 50; g.lineTo(x, y); } g.stroke(); } });
  { const g = new THREE.BoxGeometry(.36, .34, .1, 8, 8, 2), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), n = .012 * Math.sin(x * 60 + y * 47) + .01 * Math.sin(y * 80 + z * 30);
      const edge = Math.max(Math.abs(x) / .18, Math.abs(y) / .17); p.setXYZ(k, x * (1 - .06 * edge * edge) + n, y * (1 - .05 * edge * edge) + n, z + n * .6); } g.computeVertexNormals();
    M.add(mesh(g, toon('#ffffff', { map: patina }))); }
  const caseM = toon('#7a573b');
  M.add(mesh(new THREE.BoxGeometry(.05, .42, .14), caseM, -.215, 0, -.01)); M.add(mesh(new THREE.BoxGeometry(.3, .05, .14), caseM, -.06, -.2, -.01));
  { const b = mesh(new THREE.BoxGeometry(.05, .2, .14), caseM, .215, -.11, -.01); b.rotation.z = .12; M.add(b); }
  anim.gearMat = new THREE.MeshToonMaterial({ color: '#78c2a2', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0, gradientMap: wood.gradientMap });
  anim.gears = [];
  for (const [r, teeth, x, y, z, ratio, sp] of [[.135, 44, .01, .015, .052, 1, 4], [.052, 18, .155, .12, .066, -2.6, 3], [.04, 14, -.13, -.115, .066, -3.4, 3], [.062, 22, -.1, .125, .078, 2.2, 4]]) {
    const gm = mesh(gearGeo(r, teeth, .012, sp), anim.gearMat, x, y, z); M.add(gm); anim.gears.push([gm, ratio]); }
  { const ring = mesh(new THREE.TorusGeometry(.165, .008, 5, 40), anim.gearMat, .01, .015, .05); M.add(ring);
    for (let i = 0; i < 9; i++) { const b = mesh(new THREE.SphereGeometry(.012 + R() * .012, 6, 5), toon('#e8e2d0'), (R() - .5) * .34, (R() - .5) * .32, .05 + R() * .01); M.add(b); } }
  anim.glowLight = new THREE.PointLight('#ffb040', 0, 2.2, 1.6); anim.glowLight.position.set(0, 0, .25); M.add(anim.glowLight);
  anim.mech = M;
  // a few amphora shards and a second sand mound so the mechanism sits IN the seabed
  { const mound = mesh(new THREE.SphereGeometry(.5, 14, 8), sandMat, 1.62, -.13, 2.6, { cast: false }); mound.scale.set(1.3, .45, 1); G.add(mound); }

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
  /** burst: 0..1 strength of the bubble rush that covers the transition to the surface */
  function update(t, camera, { glow = 0, burst = 0 } = {}) {
    caus.offset.set(t * .035, t * .05); sandMat.emissiveIntensity = .42 + .12 * Math.sin(t * 2.3);
    anim.weeds.forEach((w, i) => { w.rotation.z = .16 * Math.sin(t * 1.3 + i * 1.7); w.rotation.x = .08 * Math.sin(t * .9 + i); });
    anim.schoolSeed.forEach(([a, b, c, d], i) => { const u = t * (.55 + d * .25) + a * 9; _p.set(-7 + ((u * 1.6 + a * 14) % 14), 2.1 + b * 1.6 + .25 * Math.sin(u * 2 + c * 6), -2.2 + c * 3.2 + .3 * Math.sin(u + a * 5));
      _e.set(0, 0, .12 * Math.sin(u * 3)); _q.setFromEuler(_e); _s.setScalar(.45 + d * .4); _m.compose(_p, _q, _s); anim.school.setMatrixAt(i, _m); });
    anim.school.instanceMatrix.needsUpdate = true;
    _q.copy(camera.quaternion);
    anim.bubSeed.forEach(([a, b, c, d, e], i) => {
      if (i < 60) { const life = (t * (.35 + d * .3) + a * 5) % 1; _p.set((b - .5) * 11 + .12 * Math.sin(t * 3 + i), life * 6.5, (c - .5) * 8 + 1); _s.setScalar(.03 + e * .06); }
      else {                                                                                // the transition rush, in front of the camera
        const k = burst * 1.5 - e * .5, y = (k > 0 ? k : -9);
        _p.copy(camera.position).add(_s.set((a - .5) * 1.1, -.9 + y * 1.9 + .05 * Math.sin(t * 9 + i), -.55 - b * .9).applyQuaternion(camera.quaternion)); _s.setScalar(.03 + c * .16);
      }
      _m.compose(_p, _q, _s); anim.bubbles.setMatrixAt(i, _m); });
    anim.bubbles.instanceMatrix.needsUpdate = true;
    anim.snow.position.set(.3 * Math.sin(t * .3), .15 * Math.sin(t * .5), 0);
    anim.rays.forEach((r, i) => { r.material.opacity = .2 + .12 * Math.sin(t * 1.1 + i * 2.1); });
    anim.gearMat.emissiveIntensity = glow * (.6 + .12 * Math.sin(t * 14)); anim.glowLight.intensity = glow * .45;
    const spin = Math.max(0, t - 2.49) * 1.6; anim.gears.forEach(([g, ratio]) => { g.rotation.z = spin * ratio; });
  }
  return { group: G, update, mech: M, dune };
}

/* =====================================================================
   2. Sea, sky, weather
   ===================================================================== */
export function buildSea() {
  const G = new THREE.Group();
  const U = { time: { value: 0 }, storm: { value: 0 }, cDeep: { value: new THREE.Color('#0d6fb0') }, cShallow: { value: new THREE.Color('#35c3dc') }, cFoam: { value: new THREE.Color('#f4fbff') },
    fogColor: { value: new THREE.Color('#bfe3f5') }, fogNear: { value: 30 }, fogFar: { value: 160 }, sunDir: { value: V(.4, .8, .45).normalize() }, light: { value: new THREE.Color(1, 1, 1) },
    boat: { value: new THREE.Vector4(0, 0, 0, 0) }, glint: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 180, 180).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: `uniform float time, storm; varying vec3 vW; ${WAVE_GLSL}
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vec2 d; w.y += waveH(w.xz, time, storm, d); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float time, storm, fogNear, fogFar; uniform vec3 cDeep, cShallow, cFoam, fogColor, sunDir, light; uniform vec4 boat, glint; varying vec3 vW; ${WAVE_GLSL}
      void main(){
        vec2 d; float h = waveH(vW.xz, time, storm, d); float A = mix(0.07, 0.40, storm);
        vec2 p = vW.xz;
        // small painted ripples on top of the swell
        float r1 = sin(p.x * 1.7 + sin(p.y * 1.1 + time * 0.8) * 1.6 + time * 1.3), r2 = sin(p.y * 2.3 + sin(p.x * 0.9 - time) * 1.4 - time * 1.1);
        vec3 n = normalize(vec3(-d.x - 0.10 * r1, 1.0, -d.y - 0.10 * r2));
        float lit = dot(n, sunDir);
        float band = floor(clamp(lit * 0.5 + 0.55, 0.0, 1.0) * 4.0) / 4.0;
        vec3 col = mix(cDeep, cShallow, clamp(h / A * 0.5 + 0.5, 0.0, 1.0) * 0.55 + band * 0.45);
        vec3 v = normalize(cameraPosition - vW);
        float spec = step(0.992 - storm * 0.01, dot(reflect(-sunDir, n), v)); col += cFoam * spec * (0.55 - storm * 0.4);
        float crest = smoothstep(0.6, 0.88, h / A + 0.22 * r1 * r2 + storm * 0.08);
        float streak = smoothstep(0.93, 1.0, r1 * 0.5 + r2 * 0.5) * (0.25 + storm * 0.5);
        col = mix(col, cFoam, clamp(crest * (0.3 + storm * 0.3) + streak * 0.7, 0.0, 1.0));
        float bd = length(p - boat.xy); col *= 1.0 - 0.42 * boat.w * smoothstep(boat.z, boat.z * 0.35, bd);            // soft shade under the hull
        col = mix(col, cFoam, 0.7 * boat.w * smoothstep(0.25, 0.0, abs(bd - boat.z * 0.62) + 0.12 * r1));           // foam ring round the hull
        col *= light;
        float gd = length(p - glint.xy); col += vec3(1.0, 0.72, 0.25) * glint.w * exp(-gd * gd / (glint.z * glint.z)) * (0.8 + 0.2 * sin(time * 9.0));
        float dist = length(cameraPosition - vW); col = mix(col, fogColor, smoothstep(fogNear, fogFar, dist));
        gl_FragColor = vec4(col, 1.0);
${TONE}
      }` }));
  water.frustumCulled = false; G.add(water);

  /* sky dome */
  const SU = { top: { value: new THREE.Color('#1f6fd6') }, hor: { value: new THREE.Color('#bfe6fb') }, flash: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(190, 24, 12), new THREE.ShaderMaterial({ uniforms: SU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top, hor; uniform float flash; varying vec3 vP; void main(){ float k = clamp(normalize(vP).y * 1.5 + 0.02, 0.0, 1.0); vec3 c = mix(hor, top, pow(k, 0.6)) + vec3(flash * 0.7, flash * 0.75, flash); gl_FragColor = vec4(c, 1.0);
${TONE}
}` }));
  sky.renderOrder = -10; G.add(sky);

  /* clouds: graphic white puffs (calm) and heavy dark banks (storm) */
  const puff = (dark) => canvasTex(512, 256, (g, w, h) => { const r = rng(dark ? 21 : 9);
    const base = dark ? ['#56647b', '#6f7e96'] : ['#ffffff', '#e3f1fb'];
    for (let pass = 0; pass < 2; pass++) { g.fillStyle = base[pass ? 0 : 1]; for (let i = 0; i < 9; i++) { const x = 70 + i * 46, rr = 44 + 34 * Math.sin(i * 1.7 + 1) * Math.sin(i * .5) + r() * 10; g.beginPath(); g.arc(x, 150 - (pass ? 14 : 0) - rr * .35, rr, 0, 7); g.fill(); } }
    if (dark) { g.fillStyle = base[1]; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(60 + i * 36, 150 + r() * 26, 30 + r() * 22, 0, 7); g.fill(); } } else { g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 168, w, h); } });
  const cloudT = puff(false), darkT = puff(true), clouds = [], darks = [];
  const R = rng(4);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, .5), new THREE.MeshBasicMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false }));
    const a = -1.5 + i * .42 + R() * .2, d = 150, s = 40 + R() * 40; m.position.set(Math.sin(a) * d, 26 + R() * 42, -Math.cos(a) * d); m.scale.set(s, s, 1); m.renderOrder = -9; G.add(m); clouds.push(m); }
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, .5), new THREE.MeshBasicMaterial({ map: darkT, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
    const a = -2.2 + i * .42, d = 140, s = 120 + R() * 60; m.userData = { a, d, y: 34 + (i % 3) * 24 + R() * 8, s }; m.renderOrder = -8; G.add(m); darks.push(m); }

  /* lightning bolt + rain (rain rides on the camera) */
  const boltT = canvasTex(128, 512, (g, w, h) => { const r = rng(31); g.strokeStyle = '#fff'; g.lineJoin = 'miter'; g.shadowColor = '#bcd8ff'; g.shadowBlur = 14;
    const path = (x, y, y1, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); while (y < y1) { x += (r() - .5) * 46; y += 26 + r() * 30; g.lineTo(x, y); } g.stroke(); return x; };
    path(64, 0, 500, 9); path(70, 180, 380, 4); path(52, 260, 420, 3); });
  const bolt = new THREE.Mesh(new THREE.PlaneGeometry(14, 56), new THREE.MeshBasicMaterial({ map: boltT, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, color: new THREE.Color(6, 6, 7) }));
  bolt.renderOrder = -7; G.add(bolt);
  const rainT = canvasTex(256, 256, (g, w, h) => { const r = rng(17); g.strokeStyle = 'rgba(225,240,255,.9)'; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = r() * w, y = r() * h, l = 16 + r() * 30; g.lineWidth = 1 + r() * 1.6; g.globalAlpha = .3 + r() * .6;
      for (const oy of [0, -h, h]) for (const ox of [0, -w, w]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox - l * .28, y + oy + l); g.stroke(); } } }, { repeat: true });
  const rain = [];
  for (const [z, rep, sp] of [[-.6, 4.2, 2.2], [-1.4, 7.5, 1.6]]) { const t2 = rainT.clone(); t2.needsUpdate = true; t2.repeat.set(rep, rep * 1.6);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), new THREE.MeshBasicMaterial({ map: t2, transparent: true, depthWrite: false, depthTest: false, fog: false, opacity: 0 })); m.position.z = z; m.renderOrder = 20; m.userData.sp = sp; rain.push(m); }
  const rainRig = new THREE.Group(); rain.forEach(m => rainRig.add(m)); G.add(rainRig);

  /* gulls */
  const gullT = canvasTex(128, 64, (g) => { g.strokeStyle = '#fff'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(8, 40); g.quadraticCurveTo(40, 4, 64, 34); g.quadraticCurveTo(88, 4, 120, 40); g.stroke();
    g.strokeStyle = '#1d1418'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, 40); g.quadraticCurveTo(40, 4, 64, 34); g.quadraticCurveTo(88, 4, 120, 40); g.stroke(); });
  const gulls = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .45), new THREE.MeshBasicMaterial({ map: gullT, transparent: true, depthWrite: false, fog: false })); G.add(m); gulls.push(m); }

  const cCalm = { deep: new THREE.Color('#0d6fb0'), shal: new THREE.Color('#35c3dc'), top: new THREE.Color('#1c66d2'), hor: new THREE.Color('#c4e8fb') };
  const cStorm = { deep: new THREE.Color('#1d3d52'), shal: new THREE.Color('#4a7f8c'), top: new THREE.Color('#27344d'), hor: new THREE.Color('#7f93a8') };
  /** returns the horizon colour (use it for fog) */
  function update(t, camera, { storm = 0, flash = 0, boltAt = null, boat = null, glint = null, gullsAt = null, fogNear = 30, fogFar = 160 } = {}) {
    U.time.value = t; U.storm.value = storm; U.cDeep.value.lerpColors(cCalm.deep, cStorm.deep, storm); U.cShallow.value.lerpColors(cCalm.shal, cStorm.shal, storm);
    SU.top.value.lerpColors(cCalm.top, cStorm.top, storm); SU.hor.value.lerpColors(cCalm.hor, cStorm.hor, storm); SU.flash.value = flash;
    U.fogColor.value.copy(SU.hor.value); U.fogNear.value = fogNear; U.fogFar.value = fogFar; U.light.value.setScalar(1 + flash * 1.4);
    U.boat.value.set(boat ? boat.x : 0, boat ? boat.z : 0, boat ? boat.r : 1, boat ? 1 : 0); U.glint.value.set(glint ? glint.x : 0, glint ? glint.z : 0, glint ? glint.r : 1, glint ? glint.a : 0);
    sky.position.copy(camera.position); water.position.set(Math.round(camera.position.x / 10) * 10, 0, Math.round(camera.position.z / 10) * 10);
    clouds.forEach((m, i) => { m.material.opacity = 1 - storm * .95; m.quaternion.copy(camera.quaternion); m.position.x += 0; });
    darks.forEach((m, i) => { const u = m.userData, a = u.a + (1 - storm) * 1.1 + t * .012; m.position.set(camera.position.x + Math.sin(a) * u.d, u.y + (1 - storm) * 40, camera.position.z - Math.cos(a) * u.d);
      m.scale.set(u.s, u.s, 1); m.quaternion.copy(camera.quaternion); m.material.opacity = Math.min(.92, storm * 1.4); m.material.color.setScalar(1 + flash * 2.5); });
    bolt.visible = !!boltAt && flash > .25; if (boltAt) { bolt.position.set(boltAt.x, boltAt.y, boltAt.z); bolt.quaternion.copy(camera.quaternion); }
    rainRig.position.copy(camera.position); rainRig.quaternion.copy(camera.quaternion);
    rain.forEach((m, i) => { m.material.opacity = Math.max(0, storm - .35) * 1.25 * (i ? .38 : .5); m.material.map.offset.set(t * .35 * m.userData.sp * .3, t * m.userData.sp); });
    gulls.forEach((m, i) => { m.visible = !!gullsAt && storm < .5; if (!gullsAt) return; const a = t * .5 + i * 1.6, r = 5 + i * 1.6;
      m.position.set(gullsAt.x + Math.cos(a) * r, gullsAt.y + i * .8 + .4 * Math.sin(t * 1.3 + i), gullsAt.z - 6 + Math.sin(a) * r * .5); m.quaternion.copy(camera.quaternion); m.scale.set(1, .75 + .45 * Math.sin(t * 7 + i * 2), 1); });
    return SU.hor.value;
  }
  return { group: G, update };
}

/* =====================================================================
   3. The sponge boat (forward = +x, origin at the waterline amidships)
   ===================================================================== */
export function buildBoat() {
  const B = new THREE.Group(), anim = {};
  const halfW = (u) => 1.12 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.4)), .55);
  const gun = (u) => .62 + (u > 0 ? .62 : .42) * u * u, keel = (u) => -.5 * (1 - Math.pow(Math.abs(u), 3)), L = 3.4, DECK = .46;
  const hullTex = (withText) => canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#f5f0e3'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a3327'; g.fillRect(0, h * .56, w, h); g.fillStyle = '#1d1418'; g.fillRect(0, h * .545, w, 5);
    g.fillStyle = '#1f62ad'; g.fillRect(0, h * .1, w, h * .11); g.fillStyle = '#e9c24a'; g.fillRect(0, h * .215, w, 5);
    g.strokeStyle = 'rgba(60,45,40,.35)'; g.lineWidth = 2; for (const y of [.33, .44]) { g.beginPath(); g.moveTo(0, h * y); g.lineTo(w, h * y); g.stroke(); }
    if (withText) { g.fillStyle = '#1d1418'; g.font = '700 58px Georgia, serif'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('ΣΥΜΗ · 1900', w * .72, h * .39); } });
  const buildSide = (side) => { const nu = 30, nv = 9, pos = [], uv = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = -1 + 2 * i / nu, v = j / nv;
      pos.push(u * L, lerp(keel(u), gun(u), Math.pow(v, .75)), side * halfW(u) * Math.pow(Math.sin(v * Math.PI / 2), .6)); uv.push(i / nu, v); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; side > 0 ? idx.push(a, b, a + 1, b, b + 1, a + 1) : idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return mesh(g, new THREE.MeshToonMaterial({ map: hullTex(side > 0), side: THREE.DoubleSide, gradientMap: toon('#fff').gradientMap })); };
  B.add(buildSide(1), buildSide(-1));
  { const s = new THREE.Shape(); for (let i = 0; i <= 40; i++) { const u = -1 + 2 * i / 40; i ? s.lineTo(u * L * .985, halfW(u) * .96) : s.moveTo(u * L * .985, halfW(u) * .96); } for (let i = 40; i >= 0; i--) { const u = -1 + 2 * i / 40; s.lineTo(u * L * .985, -halfW(u) * .96); }
    const deckT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#c69a62'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,50,25,.7)'; g.lineWidth = 3; for (let y = 0; y < h; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, { repeat: true }); deckT.repeat.set(1.2, 1.2);
    const d = mesh(new THREE.ShapeGeometry(s), toon('#ffffff', { map: deckT }), 0, DECK, 0, { cast: false }); d.rotation.x = -Math.PI / 2; d.scale.y = -1; d.material.side = THREE.DoubleSide; B.add(d); }
  const woodM = toon('#7a5433'), darkM = toon('#3a2a20');
  for (const side of [-1, 1]) { const pts = []; for (let i = 0; i <= 30; i++) { const u = -1 + 2 * i / 30; pts.push(V(u * L, gun(u) + .02, side * halfW(u))); } B.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .045, 6), woodM)); }
  B.add(mesh(new THREE.BoxGeometry(.12, .7, .12), woodM, L - .03, gun(1) + .15, 0)); B.add(mesh(new THREE.BoxGeometry(.12, .5, .12), woodM, -L + .03, gun(-1) + .1, 0));
  /* mast, boom, gaff, sail, rigging, flag */
  const MX = 1.55, MH = 5.6;
  B.add(mesh(new THREE.CylinderGeometry(.055, .08, MH, 8), woodM, MX, DECK + MH / 2, 0));
  const sailT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f1e6c8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(150,120,80,.55)'; g.lineWidth = 3; for (let x = 32; x < w; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = '#d9c391'; g.fillRect(150, 150, 54, 46); g.strokeStyle = 'rgba(90,60,40,.8)'; g.setLineDash([6, 5]); g.strokeRect(150, 150, 54, 46); });
  { const g = new THREE.PlaneGeometry(1, 1, 8, 8), p = g.attributes.position; anim.sailBase = []; // quad: tack (mast,low) clew (aft,low) peak (aft,high) throat (mast,high)
    for (let k = 0; k < p.count; k++) { const u = p.getX(k) + .5, v = p.getY(k) + .5; const x = MX - .08 - u * 3.0, y = DECK + 2.42 + v * (2.0 + u * .9); anim.sailBase.push([x, y, u, v]); p.setXYZ(k, x, y, 0); }
    anim.sail = mesh(g, new THREE.MeshToonMaterial({ map: sailT, side: THREE.DoubleSide, gradientMap: woodM.gradientMap })); B.add(anim.sail); }
  { const boom = mesh(new THREE.CylinderGeometry(.04, .04, 3.2, 6), woodM, MX - 1.6, DECK + 2.38, 0); boom.rotation.z = Math.PI / 2; B.add(boom);
    const gaff = mesh(new THREE.CylinderGeometry(.035, .035, 3.3, 6), woodM, MX - 1.58, DECK + 4.9, 0); gaff.rotation.z = 1.28; B.add(gaff); }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([MX + .05, DECK + 1.2, 0, L - .1, gun(1) + .4, 0, MX + .02, DECK + MH - .2, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2)); g.computeVertexNormals();
    B.add(mesh(g, new THREE.MeshToonMaterial({ map: sailT, side: THREE.DoubleSide, gradientMap: woodM.gradientMap }))); }
  { const top = [MX, DECK + MH, 0], pts = [...top, L, gun(1) + .45, 0, ...top, -L, gun(-1) + .3, 0, ...top, MX - .5, gun(.3), 1.0, ...top, MX - .5, gun(.3), -1.0];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); B.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#1d1418' }))); }
  { const flagT = canvasTex(96, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f62ad'; for (let i = 0; i < 9; i += 2) g.fillRect(0, i * h / 9, w, h / 9); g.fillRect(0, 0, 36, 36); g.fillStyle = '#fff'; g.fillRect(14, 0, 8, 36); g.fillRect(0, 14, 36, 8); });
    anim.flag = mesh(new THREE.PlaneGeometry(.6, .4, 6, 1), new THREE.MeshBasicMaterial({ map: flagT, side: THREE.DoubleSide }), -L + .05, gun(-1) + .85, 0, { cast: false }); anim.flag.geometry.translate(-.3, 0, 0); B.add(anim.flag);
    B.add(mesh(new THREE.CylinderGeometry(.015, .015, 1.0, 5), darkM, -L + .05, gun(-1) + .6, 0)); }
  /* deckhouse, air pump, helmet, hose, sponge basket, crate */
  { const h = new THREE.Group(); h.add(mesh(new THREE.BoxGeometry(1.05, .5, .95), toon('#f3eee0'), 0, .25, 0)); h.add(mesh(new THREE.BoxGeometry(1.2, .07, 1.1), toon('#1f62ad'), 0, .53, 0));
    for (const z of [-.48, .48]) h.add(mesh(new THREE.CylinderGeometry(.1, .1, .02, 12).rotateX(Math.PI / 2), toon('#274b6d'), 0, .3, z)); h.position.set(-2.05, DECK, 0); B.add(h); }
  const brass = toon('#e3a83a'), copper = toon('#d0703a');
  { const p = new THREE.Group(); p.add(mesh(new THREE.BoxGeometry(.5, .46, .36), toon('#2f6b4f'), 0, .23, 0)); p.add(mesh(new THREE.BoxGeometry(.56, .05, .42), darkM, 0, .48, 0));
    anim.wheel = new THREE.Group(); anim.wheel.add(mesh(new THREE.TorusGeometry(.27, .028, 6, 20), brass)); for (let i = 0; i < 3; i++) { const s = mesh(new THREE.BoxGeometry(.52, .03, .03), brass); s.rotation.z = i * Math.PI / 3; anim.wheel.add(s); }
    anim.wheel.position.set(0, .34, .22); p.add(anim.wheel); p.position.set(-.95, DECK, -.35); B.add(p); }
  { const h = new THREE.Group(); h.add(mesh(new THREE.SphereGeometry(.2, 16, 12), copper, 0, .3, 0)); h.add(mesh(new THREE.CylinderGeometry(.26, .3, .12, 14), copper, 0, .08, 0));
    for (const [a, r] of [[0, .075], [1.5, .055], [-1.5, .055]]) { const ring = mesh(new THREE.TorusGeometry(r, .02, 6, 14), brass, Math.sin(a) * .19, .32, Math.cos(a) * .19); ring.rotation.y = a; h.add(ring);
      const gl = mesh(new THREE.CircleGeometry(r, 12), toon('#19323f'), Math.sin(a) * .186, .32, Math.cos(a) * .186); gl.rotation.y = a; h.add(gl); }
    h.position.set(1.3, DECK, .5); h.rotation.y = .5; B.add(h); }
  for (let i = 0; i < 3; i++) B.add(mesh(new THREE.TorusGeometry(.2 - i * .02, .035, 6, 16).rotateX(Math.PI / 2), toon('#b89a62'), -.2, DECK + .04 + i * .065, .6));
  { const b = new THREE.Group(); b.add(mesh(new THREE.CylinderGeometry(.34, .26, .34, 12, 1, true), new THREE.MeshToonMaterial({ color: '#a8743c', side: THREE.DoubleSide, gradientMap: woodM.gradientMap }), 0, .17, 0));
    const sp = toon('#e9b93c'), R = rng(8); for (let i = 0; i < 9; i++) { const g = new THREE.IcosahedronGeometry(.13 + R() * .06, 1); const a = i * 2.4; b.add(mesh(g, sp, Math.cos(a) * .17 * (i < 7 ? 1 : 0), .34 + (i % 3) * .07 + (i > 6 ? .12 : 0), Math.sin(a) * .17 * (i < 7 ? 1 : 0))); }
    b.position.set(.2, DECK, -.5); B.add(b); }
  { const t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b98a52'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a4526'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); for (const y of [88, 172]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.fillStyle = '#1d1418'; g.font = '700 58px Georgia, serif'; g.textAlign = 'center'; g.fillText('ΣΥΜΗ', w / 2, 68); g.font = '700 74px Georgia, serif'; g.fillText('1900', w / 2, 156); g.font = '700 40px Georgia, serif'; g.fillText('ΣΠΟΓΓΟΙ', w / 2, 232); });
    B.add(mesh(new THREE.BoxGeometry(.5, .5, .5), toon('#ffffff', { map: t }), 2.35, DECK + .25, .1)); }

  const _e = new THREE.Euler();
  /** place the boat on the waves. heading: rotation about y (0 = bow toward +x) */
  function update(t, x, z, heading, storm) {
    const c = Math.cos(heading), s = Math.sin(heading), fx = c, fz = -s;                              // forward vector
    const h0 = waveH(x, z, t, storm), hb = waveH(x + fx * 2.4, z + fz * 2.4, t, storm), hs = waveH(x - fx * 2.4, z - fz * 2.4, t, storm), hp = waveH(x - fz * .9, z + fx * .9, t, storm), hq = waveH(x + fz * .9, z - fx * .9, t, storm);
    B.position.set(x, h0 * .8 + .02, z);
    const pitch = Math.atan2(hb - hs, 4.8) * 1.5, roll = Math.atan2(hp - hq, 1.8) * 1.2 + storm * .09 * Math.sin(t * 2.3);
    B.rotation.set(0, 0, 0); B.rotateY(heading); B.rotateZ(pitch); B.rotateX(roll);
    const p = anim.sail.geometry.attributes.position; anim.sailBase.forEach(([bx, by, u, v], k) => { p.setZ(k, (.32 + storm * .2) * Math.sin(u * Math.PI) * Math.sin(v * Math.PI * .9 + .2) + storm * .12 * Math.sin(t * 11 + u * 6 + v * 4) * u); });
    p.needsUpdate = true; anim.sail.geometry.computeVertexNormals();
    const fp = anim.flag.geometry.attributes.position; for (let k = 0; k < fp.count; k++) fp.setZ(k, .06 * Math.sin(fp.getX(k) * 14 - t * (8 + storm * 8)) * (-fp.getX(k) / .6)); fp.needsUpdate = true;
    anim.wheel.rotation.z = t * 2.2;
  }
  return { group: B, update, DECK };
}

/* =====================================================================
   4. The island
   ===================================================================== */
export function islandH(x, z) {
  const r = Math.hypot(x, z), th = Math.atan2(z, x), Rr = 13 + 2 * Math.sin(3 * th + 1) + 1.2 * Math.sin(5 * th + 2);
  const sm = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const base = 1 - sm(Rr - 4.5, Rr + 1.5, r);
  let h = base * (1.5 + 6.5 * Math.exp(-((x + 3) ** 2 + (z + 3) ** 2) / 55) + 3.2 * Math.exp(-((x - 7) ** 2 + (z + 4) ** 2) / 26) + .35 * Math.sin(x * 1.1) * Math.sin(z * 1.3)) - 1.4;
  h -= 4.6 * Math.exp(-((x - 1) ** 2 / 16 + (z - 11.5) ** 2 / 20));                                   // the cove
  return Math.max(h, -2.2);
}
export function buildIsland() {
  const G = new THREE.Group(), anim = {}, R = rng(12);
  { const g = new THREE.PlaneGeometry(52, 52, 110, 110); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, islandH(p.getX(i), p.getZ(i)));
    g.computeVertexNormals(); const n = g.attributes.normal, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const sand = new THREE.Color('#ead8a6'), rock = new THREE.Color('#b98d5e'), rock2 = new THREE.Color('#8e6c4c'), scrub = new THREE.Color('#8fae55'), scrub2 = new THREE.Color('#6f9447');
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), ny = n.getY(i), k = .5 + .5 * Math.sin(p.getX(i) * 2.1 + p.getZ(i) * 1.7);
      if (y < .45) c.copy(sand); else if (ny < .78) c.lerpColors(rock, rock2, k); else c.lerpColors(scrub, scrub2, k); if (y < -.3) c.multiplyScalar(.7);
      col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const ng = g.toNonIndexed(); ng.computeVertexNormals();
    G.add(mesh(ng, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap }))); }
  /* houses with warm windows */
  anim.winMat = new THREE.MeshBasicMaterial({ color: '#31506e' });
  const white = toon('#f7f3ea'), blue = toon('#2a6fc0'), roofM = toon('#e6dccb');
  const house = (x, z, w, d, h, ry) => { const H = new THREE.Group(); H.add(mesh(new THREE.BoxGeometry(w, h, d), white, 0, h / 2, 0)); H.add(mesh(new THREE.BoxGeometry(w + .14, .1, d + .14), roofM, 0, h + .05, 0));
    H.add(mesh(new THREE.BoxGeometry(.42, .8, .04), blue, -w * .18, .4, d / 2 + .02)); for (const wx of [w * .22]) H.add(mesh(new THREE.BoxGeometry(.4, .42, .04), anim.winMat, wx, h * .58, d / 2 + .02, { cast: false }));
    H.add(mesh(new THREE.BoxGeometry(.04, .42, .4), anim.winMat, w / 2 + .02, h * .58, 0, { cast: false }));
    H.position.set(x, islandH(x, z) - .08, z); H.rotation.y = ry; G.add(H); };
  for (const [x, z, w, d, h, ry] of [[-3.6, 6.0, 1.9, 1.6, 1.5, .3], [-5.6, 5.0, 1.6, 1.5, 1.7, .5], [-2.2, 4.2, 1.7, 1.5, 1.4, .1], [-4.6, 3.0, 2.0, 1.6, 1.8, .4], [4.4, 3.0, 1.8, 1.5, 1.5, -.4], [6.2, 2.4, 1.6, 1.5, 1.4, -.5]]) house(x, z, w, d, h, ry);
  { const c = new THREE.Group(); c.add(mesh(new THREE.BoxGeometry(1.5, 1.4, 2.0), white, 0, .7, 0)); c.add(mesh(new THREE.SphereGeometry(.72, 16, 10, 0, 7, 0, Math.PI / 2), blue, 0, 1.4, -.2));
    c.add(mesh(new THREE.BoxGeometry(.06, .5, .06), white, 0, 2.35, -.2)); c.add(mesh(new THREE.BoxGeometry(.28, .06, .06), white, 0, 2.42, -.2)); c.add(mesh(new THREE.BoxGeometry(.5, .9, .04), blue, 0, .45, 1.02));
    const x = .6, z = 1.4; c.position.set(x, islandH(x, z) - .1, z); c.rotation.y = .15; G.add(c); }
  { const w = new THREE.Group(); w.add(mesh(new THREE.CylinderGeometry(.75, .95, 2.4, 14), white, 0, 1.2, 0)); w.add(mesh(new THREE.ConeGeometry(.95, .9, 14), toon('#9a6b3d'), 0, 2.85, 0));
    anim.mill = new THREE.Group(); const cloth = new THREE.MeshToonMaterial({ color: '#f3ead2', side: THREE.DoubleSide, gradientMap: white.gradientMap });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, sp = mesh(new THREE.BoxGeometry(.04, 1.7, .04), toon('#5a4030'), 0, .85, 0), arm = new THREE.Group(); arm.add(sp);
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute([0, .25, 0, 0, 1.65, 0, .5, 1.5, .03], 3)); tg.computeVertexNormals(); arm.add(mesh(tg, cloth)); arm.rotation.z = a; anim.mill.add(arm); }
    anim.mill.position.set(0, 2.3, 1.0); w.add(anim.mill); const x = -7.2, z = -1.5; w.position.set(x, islandH(x, z) - .1, z); w.rotation.y = .5; G.add(w); }
  /* olive trees */
  const leaf = toon('#8fa26a'), leaf2 = toon('#74905a'), trunk = toon('#5a4636');
  for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = 2 + R() * 8, x = Math.cos(a) * d - 1, z = Math.sin(a) * d * .8 - 1, y = islandH(x, z); if (y < .8) continue;
    const T = new THREE.Group(); T.add(mesh(new THREE.CylinderGeometry(.07, .12, .8, 6), trunk, 0, .4, 0)); for (let k = 0; k < 3; k++) { const b = mesh(new THREE.IcosahedronGeometry(.5 + R() * .25, 1), k % 2 ? leaf : leaf2, (R() - .5) * .6, 1.0 + R() * .3, (R() - .5) * .6); b.scale.y = .7; T.add(b); }
    T.position.set(x, y - .05, z); T.scale.setScalar(.9 + R() * .5); G.add(T); }
  /* stone jetty in the cove + bollard + beached rowboat */
  const stone = toon('#b9b2a4');
  for (let i = 0; i < 7; i++) G.add(mesh(new THREE.BoxGeometry(1.25 + (i % 2) * .1, .6, .82), stone, -1.6 + (i % 2) * .05, .0, 6.2 + i * .8));
  G.add(mesh(new THREE.CylinderGeometry(.09, .11, .4, 8), toon('#3a2a20'), -1.5, .5, 10.9));
  { const rb = mesh(new THREE.SphereGeometry(.7, 12, 8, 0, 7, Math.PI / 2, Math.PI / 2), new THREE.MeshToonMaterial({ color: '#d4573a', side: THREE.DoubleSide, gradientMap: white.gradientMap }), 3.6, .42, 5.7); rb.scale.set(1.6, .5, .6); rb.rotation.y = .7; G.add(rb); }
  /* signpost on a rock at the edge of the cove */
  const SIGN = new THREE.Group(); { const x = -4.8, z = 13.7;
    const rockG = new THREE.IcosahedronGeometry(1.25, 1); const p = rockG.attributes.position; for (let k = 0; k < p.count; k++) { const n = .85 + .3 * Math.sin(p.getX(k) * 4 + p.getY(k) * 5); p.setXYZ(k, p.getX(k) * n * 1.25, p.getY(k) * n * .62, p.getZ(k) * n); } rockG.computeVertexNormals();
    SIGN.add(mesh(rockG, toon('#a98a66'), 0, .1, 0));
    SIGN.add(mesh(new THREE.CylinderGeometry(.055, .07, 2.0, 7), toon('#5a4030'), 0, 1.5, 0));
    const board = (txt, font, w, y, rz) => { const t = canvasTex(1024, 220, (g, cw, ch) => { g.fillStyle = '#d9b77c'; g.fillRect(0, 0, cw, ch); g.strokeStyle = 'rgba(110,75,40,.55)'; g.lineWidth = 4; for (const yy of [50, 112, 170]) { g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(300, yy - 12, 700, yy + 12, cw, yy); g.stroke(); }
        g.strokeStyle = '#6a4526'; g.lineWidth = 14; g.strokeRect(7, 7, cw - 14, ch - 14); g.fillStyle = '#1d1418'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, cw / 2, ch / 2 + 6);
        g.fillStyle = '#3a2a20'; for (const xx of [34, cw - 34]) for (const yy of [34, ch - 34]) { g.beginPath(); g.arc(xx, yy, 8, 0, 7); g.fill(); } });
      const b = mesh(new THREE.BoxGeometry(w, w * .215, .05), [0, 1, 2, 3].map(() => toon('#b8935c')).concat([toon('#ffffff', { map: t }), toon('#b8935c')]), 0, 0, .06); const piv = new THREE.Group(); piv.add(b); piv.position.y = y; piv.rotation.z = rz; SIGN.add(piv); return piv; };
    anim.boards = [board('ΑΝΤΙΚΥΘΗΡΑ', '700 124px Georgia, serif', 1.9, 2.26, .03), board('ANTIKYTHERA', '700 118px Georgia, serif', 1.9, 1.78, -.04)];
    SIGN.position.set(x, Math.max(islandH(x, z), 0) + .35, z); SIGN.rotation.y = -.686; G.add(SIGN); }
  /* a lantern on the sign post: warm light in the storm */
  { const l = mesh(new THREE.BoxGeometry(.16, .22, .16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.9, .6) }), .0, 2.62, .0, { cast: false }); SIGN.add(l); anim.lantern = l;
    anim.lampLight = new THREE.PointLight('#ffb050', 0, 9, 1.5); anim.lampLight.position.set(.2, 2.5, .5); SIGN.add(anim.lampLight); }
  const cWinDay = new THREE.Color('#31506e'), cWinLit = new THREE.Color(3.0, 1.7, .55);
  function update(t, storm) {
    anim.mill.rotation.z = -t * (.8 + storm * 3.2);
    anim.winMat.color.lerpColors(cWinDay, cWinLit, storm);
    anim.boards[0].rotation.z = .03 + storm * .05 * Math.sin(t * 5.2); anim.boards[1].rotation.z = -.04 + storm * .07 * Math.sin(t * 4.3 + 1);
    anim.lantern.visible = storm > .3; anim.lampLight.intensity = storm * (1.5 + .25 * Math.sin(t * 13));
  }
  return { group: G, update, sign: SIGN };
}
