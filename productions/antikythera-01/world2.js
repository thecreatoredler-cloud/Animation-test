// Sets and props for part 2 (10.4–60.3 s): statue field, ancient ship, the lump and the restored
// machine, a room dressed three ways, a dark stage, and Greek exteriors. See PLAN.md.
import * as THREE from 'three';
import { toon, canvasTex, rng } from '../../lib/toon.js';
import { mesh, amphoraGeo, gearGeo, waveH } from './world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
const GRAD = toon('#fff').gradientMap;
const toon2 = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: GRAD, side: THREE.DoubleSide, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0, o) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, o);
const cyl = (r0, r1, h, m, x = 0, y = 0, z = 0, seg = 12, o) => mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z, o);
const textTex = (w, h, draw) => canvasTex(w, h, (g) => { g.textAlign = 'center'; g.textBaseline = 'middle'; draw(g, w, h); });
const sign = (txt, { w = 512, h = 128, bg = '#f3ead2', fg = '#1d1418', font = '700 80px Georgia, serif', border = '#6a4526' } = {}) =>
  textTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); } g.fillStyle = fg; g.font = font; g.fillText(txt, w / 2, h / 2 + 4); });

/* =====================================================================
   Statue field on the seabed (added to the seabed group, away from the wreck)
   ===================================================================== */
export const STATUES = V(-10, 0, 6);
export function buildStatues(seabedGroup, dune) {
  const G = new THREE.Group(), marble = toon('#eef1f2'), marbleD = toon('#cfd6da');
  // rearing horse, half buried
  { const H = new THREE.Group(); const body = mesh(new THREE.SphereGeometry(.55, 16, 12), marble, 0, 1.0, 0); body.scale.set(1.5, .9, .8); H.add(body);
    const neck = cyl(.2, .3, .9, marble, .75, 1.55, 0); neck.rotation.z = -.6; H.add(neck);
    const head = box(.62, .3, .28, marble, 1.15, 2.0, 0); head.rotation.z = -.5; H.add(head); H.add(box(.1, .2, .08, marble, .88, 2.18, .09)); H.add(box(.1, .2, .08, marble, .88, 2.18, -.09));
    for (let i = 0; i < 5; i++) { const m = box(.1, .22, .34, marbleD, .5 + i * .1, 1.5 + i * .13, 0); m.rotation.z = -.6; H.add(m); }
    for (const [x, z, rz] of [[.6, .25, .9], [.7, -.25, 1.2]]) { const l = cyl(.08, .07, .8, marble, x + .35, 1.0, z); l.rotation.z = rz; H.add(l); }
    for (const [x, z] of [[-.6, .25], [-.6, -.25]]) H.add(cyl(.09, .08, .9, marble, x, .45, z));
    H.position.set(.6, -.25, -.4); H.rotation.set(0, -.5, .18); G.add(H); G.userData.horseHead = V(.6 + .95, 1.95, -.9); }
  const figure = (x, z, ry, rz, armUp) => { const F = new THREE.Group();
    F.add(mesh(new THREE.LatheGeometry([[0, 0], [.2, 0], [.22, .5], [.17, .95], [.26, 1.25], [.24, 1.45], [.1, 1.55]].map(p => new THREE.Vector2(...p)), 12), marble));
    const h = mesh(new THREE.SphereGeometry(.17, 14, 10), marble, 0, 1.76, 0); h.scale.set(.92, 1.1, .95); F.add(h); F.add(mesh(new THREE.SphereGeometry(.18, 12, 8, 0, 7, 0, 1.5), marbleD, 0, 1.8, -.02));
    const a1 = cyl(.05, .045, .62, marble, -.3, armUp ? 1.62 : 1.12, 0); a1.rotation.z = armUp ? -2.5 : -.15; F.add(a1); const a2 = cyl(.05, .045, .62, marble, .3, 1.12, .05); a2.rotation.z = .2; F.add(a2);
    F.position.set(x, dune(STATUES.x + x, STATUES.z + z) - .3, z); F.rotation.set(0, ry, rz); G.add(F); };
  figure(-1.2, .2, .4, -.16, true); figure(-2.5, -1.0, -.3, .3, false);
  { const F = new THREE.Group(); F.add(cyl(.2, .22, 1.4, marble, 0, 0, 0)); const h = mesh(new THREE.SphereGeometry(.17, 12, 8), marble, 0, .88, 0); F.add(h); F.position.set(2.3, .12, 1.0); F.rotation.set(0, .3, 1.45); G.add(F); }
  const terra = toon('#c06a3c'), aG = amphoraGeo(); for (const [x, z, rx] of [[-.2, 1.5, 1.4], [1.7, -.3, .2], [-3.2, .9, .3]]) { const a = mesh(aG, terra, x, .02, z); a.rotation.set(rx, x, .3); G.add(a); }
  G.position.copy(STATUES); seabedGroup.add(G);
  return G;
}

/* =====================================================================
   Ancient merchant ship (forward = +x)
   ===================================================================== */
export function buildGalley() {
  const B = new THREE.Group(), L = 4.6, DECK = .8;
  const halfW = (u) => 1.45 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.2)), .5), gun = (u) => 1.0 + .9 * u * u, keel = (u) => -.7 * (1 - Math.pow(Math.abs(u), 3));
  const tex = canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#8a5a34'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(50,30,15,.6)'; g.lineWidth = 3; for (let y = 20; y < h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#3a2416'; g.fillRect(0, h * .18, w, 22); g.fillStyle = '#c23b2b'; g.fillRect(0, h * .05, w, 18);
    g.fillStyle = '#f5efe0'; g.beginPath(); g.ellipse(w * .86, h * .42, 44, 26, 0, 0, 7); g.fill(); g.fillStyle = '#1d1418'; g.beginPath(); g.arc(w * .87, h * .42, 15, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#1d1418'; g.beginPath(); g.ellipse(w * .86, h * .42, 44, 26, 0, 0, 7); g.stroke(); });
  const mat = toon2('#ffffff', { map: tex });
  for (const side of [1, -1]) { const nu = 26, nv = 8, pos = [], uv = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const u = -1 + 2 * i / nu, v = j / nv; pos.push(u * L, lerp(keel(u), gun(u), Math.pow(v, .75)), side * halfW(u) * Math.pow(Math.sin(v * Math.PI / 2), .6)); uv.push(i / nu, v); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; side > 0 ? idx.push(a, b, a + 1, b, b + 1, a + 1) : idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); B.add(mesh(g, mat)); }
  { const s = new THREE.Shape(); for (let i = 0; i <= 30; i++) { const u = -1 + 2 * i / 30; i ? s.lineTo(u * L * .98, halfW(u) * .95) : s.moveTo(u * L * .98, halfW(u) * .95); } for (let i = 30; i >= 0; i--) { const u = -1 + 2 * i / 30; s.lineTo(u * L * .98, -halfW(u) * .95); }
    const d = mesh(new THREE.ShapeGeometry(s), toon2('#a9794a'), 0, DECK, 0); d.rotation.x = -Math.PI / 2; B.add(d); }
  const wood = toon('#6b4528');
  { const st = mesh(new THREE.TorusGeometry(1.1, .12, 6, 14, 2.2), wood, -L + .2, gun(-1) + .55, 0); st.rotation.z = 1.2; B.add(st); B.add(box(.16, 1.1, .16, wood, L - .05, gun(1) + .3, 0)); }
  B.add(cyl(.09, .12, 5.4, wood, .3, DECK + 2.7, 0, 8)); { const y = cyl(.06, .06, 5.0, wood, .3, DECK + 4.9, 0, 6); y.rotation.x = Math.PI / 2; B.add(y); }
  const sailT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#efe2c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8402e'; for (const x of [40, 118, 196]) g.fillRect(x, 0, 22, h); g.strokeStyle = 'rgba(120,90,60,.5)'; g.lineWidth = 3; for (let y = 50; y < h; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
  const sg = new THREE.PlaneGeometry(4.6, 3.6, 8, 6); const sail = mesh(sg, toon2('#ffffff', { map: sailT }), .3, DECK + 3.05, 0); sail.rotation.y = Math.PI / 2; B.add(sail);
  const sb = Array.from({ length: sg.attributes.position.count }, (_, k) => [sg.attributes.position.getX(k), sg.attributes.position.getY(k)]);
  for (const z of [-1.25, 1.25]) { const o = cyl(.04, .04, 2.6, wood, -L + 1.1, .6, z * 1.0, 6); o.rotation.z = .5; o.rotation.x = z > 0 ? .2 : -.2; B.add(o); B.add(box(.5, .9, .05, wood, -L + .45, -.35, z * 1.08)); }
  const cargo = new THREE.Group(), terra = toon('#c06a3c'), aG = amphoraGeo(); for (let i = 0; i < 12; i++) { const a = mesh(aG, terra, -1.6 + (i % 6) * .42, DECK, -.35 + Math.floor(i / 6) * .7); a.rotation.z = .1 * ((i % 3) - 1); cargo.add(a); }
  cargo.add(box(.5, .4, .4, toon('#3f9c84'), 1.6, DECK + .2, 0)); B.add(cargo);
  function update(t, x, z, heading, storm, sink) {
    const h0 = waveH(x, z, t, storm); B.position.set(x, h0 * .8 + .05 - sink * 2.6, z);
    B.rotation.set(0, 0, 0); B.rotateY(heading); B.rotateZ(.12 * Math.sin(t * 2.1) * storm + sink * .75); B.rotateX(.16 * Math.sin(t * 1.7 + 1) * storm + sink * .3);
    const p = sg.attributes.position; sb.forEach(([bx, by], k) => p.setZ(k, .55 * Math.cos(bx * .68) * Math.cos(by * .5) + .1 * Math.sin(t * 9 + by * 3))); p.needsUpdate = true; sg.computeVertexNormals();
    cargo.position.set(-sink * 1.6, 0, sink * .3);
  }
  return { group: B, update };
}

/* =====================================================================
   The corroded lump and the restored machine
   ===================================================================== */
const patinaTex = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4fa58c'; g.fillRect(0, 0, w, h); const r = rng(5);
  for (let i = 0; i < 240; i++) { g.fillStyle = ['rgba(40,110,95,.5)', 'rgba(120,200,170,.45)', 'rgba(150,120,70,.4)', 'rgba(30,80,75,.5)'][i % 4]; g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 16, 3 + r() * 10, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(20,50,50,.7)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .5) * 50; y += (r() - .5) * 50; g.lineTo(x, y); } g.stroke(); } });
let _patina;
export function buildLump() {
  const M = new THREE.Group(), R = rng(9); _patina ||= patinaTex();
  const g = new THREE.BoxGeometry(.36, .2, .3, 8, 5, 6), p = g.attributes.position;
  for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), n = .014 * Math.sin(x * 60 + y * 47) + .012 * Math.sin(y * 80 + z * 30), e = Math.max(Math.abs(x) / .18, Math.abs(z) / .15); p.setXYZ(k, x * (1 - .08 * e * e) + n, y * (1 - .1 * e) + n, z * (1 - .06 * e * e) + n); }
  g.computeVertexNormals(); M.add(mesh(g, toon('#ffffff', { map: _patina }), 0, .1, 0));
  for (let i = 0; i < 12; i++) M.add(mesh(new THREE.SphereGeometry(.012 + R() * .014, 6, 5), toon('#e8e2d0'), (R() - .5) * .32, .2 + R() * .01, (R() - .5) * .26));
  const gearMat = new THREE.MeshToonMaterial({ color: '#d9a441', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0, gradientMap: GRAD });
  const gear = mesh(gearGeo(.085, 30, .012, 4), gearMat, .02, .105, .153); gear.scale.setScalar(.001); M.add(gear);
  const crack = mesh(new THREE.CircleGeometry(.1, 20), new THREE.MeshBasicMaterial({ color: '#12302c' }), .02, .105, .151, { cast: false }); crack.scale.setScalar(.001); M.add(crack);
  /** k: 0 = closed lump, 1 = gear visible and glowing */
  M.userData.reveal = (k, t) => { const s = Math.max(.001, k); gear.scale.setScalar(s); crack.scale.setScalar(s); gear.rotation.z = t * 1.5; gearMat.emissiveIntensity = k * (.55 + .15 * Math.sin(t * 12)); };
  return M;
}
export function buildRestored() {
  const M = new THREE.Group(), wood = toon('#8a5a34'), bronze = toon('#d9a441'), bronzeD = toon('#b07f2a');
  M.add(box(.36, .44, .14, wood, 0, .22, 0)); for (const y of [.01, .43]) M.add(box(.4, .03, .18, toon('#5f3d22'), 0, y, 0));
  const dialT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#d9a441'; g.fillRect(0, 0, w, h); g.translate(w / 2, h / 2); g.strokeStyle = '#6b4a14'; g.fillStyle = '#6b4a14';
    for (const [r, lw] of [[236, 8], [196, 5], [150, 4], [60, 4]]) { g.lineWidth = lw; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
    for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, r0 = i % 6 ? 204 : 198; g.lineWidth = i % 6 ? 2 : 5; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 234, Math.sin(a) * 234); g.stroke(); }
    g.font = '700 30px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; 'ΑΒΓΔΕΖΗΘΙΚΛΜ'.split('').forEach((c, i) => { const a = (i + .5) / 12 * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(Math.cos(a) * 173, Math.sin(a) * 173); g.rotate(a + Math.PI / 2); g.fillText(c, 0, 0); g.restore(); }); });
  const dial = mesh(new THREE.CircleGeometry(.165, 40), toon('#ffffff', { map: dialT }), 0, .235, .0715, { cast: false }); M.add(dial);
  M.add(mesh(new THREE.TorusGeometry(.168, .008, 6, 40), bronzeD, 0, .235, .072));
  const pointers = [];
  for (const [len, col, rate, bead] of [[.15, '#ffd24a', 1, .02], [.12, '#dfe6ee', 13.4, .016], [.1, '#e2603a', .53, .011], [.085, '#58b0e0', 1.9, .011], [.07, '#9bd06a', 3.3, .01]]) {
    const piv = new THREE.Group(); piv.position.set(0, .235, .076 + pointers.length * .004); piv.add(box(.008, len, .003, toon('#3a2a12'), 0, len / 2, 0, { cast: false }));
    piv.add(mesh(new THREE.SphereGeometry(bead, 10, 8), new THREE.MeshToonMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: .25, gradientMap: GRAD }), 0, len, .004)); M.add(piv); pointers.push([piv, rate]); }
  M.add(mesh(new THREE.SphereGeometry(.012, 8, 6), bronzeD, 0, .235, .1));
  const crank = new THREE.Group(); crank.position.set(.19, .2, 0); crank.add(cyl(.012, .012, .05, bronzeD, .02, 0, 0, 8).rotateZ(Math.PI / 2)); crank.add(box(.012, .09, .012, bronze, .05, .04, 0)); crank.add(cyl(.014, .014, .05, toon('#5f3d22'), .075, .085, 0, 8).rotateZ(Math.PI / 2)); M.add(crank);
  const side = mesh(gearGeo(.06, 20, .01, 4), bronze, -.185, .28, 0); side.rotation.y = Math.PI / 2; M.add(side);
  M.userData.turn = (a) => { crank.rotation.x = a * 3; side.rotation.x = a * 2; pointers.forEach(([p, rate]) => { p.rotation.z = -a * rate * .5 - rate; }); };
  M.userData.crankHandle = crank;
  return M;
}

/* =====================================================================
   A room dressed three ways: 'museum' (1902), 'workshop' (ancient), 'lab' (2005)
   ===================================================================== */
export function buildRoom() {
  const G = new THREE.Group(), R = rng(14);
  const wallM = toon('#8aa58c'), floorM = toon('#9b6b43'), tableM = toon('#7a4f2e'), trimM = toon('#5a3a22');
  const stripes = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.09)'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 30, h); }, { repeat: true }); stripes.repeat.set(5, 1);
  const planks = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 4; for (let y = 0; y < h; y += 42) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, { repeat: true }); planks.repeat.set(3, 3);
  wallM.map = stripes; floorM.map = planks;
  const fl = mesh(new THREE.PlaneGeometry(9, 8), floorM, 0, 0, .5, { cast: false }); fl.rotation.x = -Math.PI / 2; G.add(fl);
  G.add(mesh(new THREE.PlaneGeometry(9, 4), wallM, 0, 2, -1.7, { cast: false })); const lw = mesh(new THREE.PlaneGeometry(8, 4), wallM, -3.2, 2, 1, { cast: false }); lw.rotation.y = Math.PI / 2; G.add(lw);
  const rw = mesh(new THREE.PlaneGeometry(8, 4), wallM, 3.2, 2, 1, { cast: false }); rw.rotation.y = -Math.PI / 2; G.add(rw);
  G.add(box(9, .14, .06, trimM, 0, .07, -1.66)); G.add(box(9, .08, .05, trimM, 0, 1.05, -1.67));
  G.add(box(1.8, .07, .95, tableM, 0, .8, 0)); for (const [x, z] of [[-.8, -.38], [.8, -.38], [-.8, .38], [.8, .38]]) G.add(box(.08, .78, .08, tableM, x, .39, z));
  const lamp = new THREE.PointLight('#ffc070', 0, 7, 1.4); lamp.position.set(-.55, 1.45, .25); G.add(lamp);

  /* museum storeroom */
  const mus = new THREE.Group(); G.add(mus);
  const terra = toon('#c06a3c'), marble = toon('#eef1f2'), bronze = toon('#3f9c84'), aG = amphoraGeo();
  for (const y of [1.45, 2.15]) { mus.add(box(3.2, .06, .34, trimM, .9, y, -1.5)); }
  for (const [x, y, k] of [[-.4, 1.48, 0], [.1, 1.48, 1], [.7, 1.48, 2], [1.3, 1.48, 0], [1.9, 1.48, 3], [-.2, 2.18, 3], [.5, 2.18, 0], [1.1, 2.18, 1], [1.8, 2.18, 2]]) {
    if (k === 0) { const a = mesh(aG, terra, x, y, -1.5); a.scale.setScalar(.6); mus.add(a); } else if (k === 1) { const h = mesh(new THREE.SphereGeometry(.16, 12, 9), marble, x, y + .17, -1.5); h.scale.y = 1.15; mus.add(h); }
    else if (k === 2) { const a = cyl(.04, .055, .5, bronze, x, y + .13, -1.5, 8); a.rotation.z = 1.2; mus.add(a); } else mus.add(box(.34, .22, .24, toon('#b98a52'), x, y + .11, -1.5)); }
  const calTex = ['1900', '1901', '1902'].map(y => textTex(256, 330, (g, w, h) => { g.fillStyle = '#fbf6e9'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0392b'; g.fillRect(0, 0, w, 86); g.fillStyle = '#fff'; g.font = '700 40px Georgia, serif'; g.fillText('ΑΘΗΝΑΙ', w / 2, 46);
    g.fillStyle = '#1d1418'; g.font = '700 104px Georgia, serif'; g.fillText(y, w / 2, 190); g.font = '700 26px Georgia, serif'; g.fillText('ΕΘΝΙΚΟΝ ΜΟΥΣΕΙΟΝ', w / 2, 284); g.strokeStyle = '#1d1418'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); }));
  const cal = mesh(new THREE.PlaneGeometry(.52, .67), new THREE.MeshToonMaterial({ map: calTex[0], gradientMap: GRAD }), -1.45, 1.75, -1.68, { cast: false }); mus.add(cal);
  const page = mesh(new THREE.PlaneGeometry(.52, .67).translate(0, -.335, 0), new THREE.MeshToonMaterial({ map: calTex[0], gradientMap: GRAD }), -1.45, 2.085, -1.67, { cast: false }); mus.add(page);
  { const l = new THREE.Group(); l.add(cyl(.09, .11, .03, toon('#c9a03a'), 0, .015, 0)); l.add(cyl(.012, .012, .34, toon('#c9a03a'), 0, .18, 0, 6)); const sh = cyl(.06, .15, .1, new THREE.MeshToonMaterial({ color: '#2f8a5a', emissive: new THREE.Color('#3fae6e'), emissiveIntensity: .5, gradientMap: GRAD }), 0, .38, .03, 14); sh.rotation.x = .25; l.add(sh);
    l.add(mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 1) }), 0, .34, .05, { cast: false })); l.position.set(-.62, .835, -.12); mus.add(l); }
  for (const [x, z, s] of [[.62, -.2, 1], [.72, .1, .8]]) { const b = box(.2 * s, .035, .27 * s, toon(s === 1 ? '#7a2e2e' : '#2e4a7a'), x, .853 + (s < 1 ? .035 : 0), z); b.rotation.y = .3 * s; mus.add(b); }

  /* ancient workshop */
  const ws = new THREE.Group(); G.add(ws); const br = toon('#d9a441'), iron = toon('#555c66');
  for (let i = 0; i < 7; i++) { const x = -1.9 + i * .5; if (i % 3 === 0) { const g = mesh(gearGeo(.11 + (i % 2) * .04, 18, .012, 4), br, x, 1.9, -1.66); ws.add(g); } else { const t = box(.04, .42, .03, i % 2 ? iron : trimM, x, 1.82, -1.66); t.rotation.z = .1 * (i - 3); ws.add(t); ws.add(box(.1, .06, .04, iron, x, 2.05, -1.66)); } }
  ws.add(box(2.6, .05, .25, trimM, 1.2, 1.4, -1.55)); for (let i = 0; i < 4; i++) { const p = mesh(new THREE.LatheGeometry([[0, 0], [.07, 0], [.1, .1], [.05, .2], [.06, .24]].map(q => new THREE.Vector2(...q)), 10), toon('#c06a3c'), .3 + i * .55, 1.43, -1.55); ws.add(p); }
  { const l = new THREE.Group(); l.add(mesh(new THREE.LatheGeometry([[0, 0], [.07, 0], [.1, .04], [.06, .08], [.02, .09]].map(q => new THREE.Vector2(...q)), 12), toon('#c06a3c'))); l.add(mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.4, .8) }), .08, .11, 0, { cast: false })); l.position.set(-.62, .835, -.15); ws.add(l); G.userData.flame = l.children[1]; }
  const vise = new THREE.Group(); vise.add(box(.16, .1, .14, iron, 0, .05, 0)); vise.add(box(.03, .14, .14, iron, -.05, .15, 0)); vise.add(box(.03, .14, .14, iron, .05, .15, 0));
  const vgear = mesh(gearGeo(.12, 26, .014, 4), br, 0, .28, -.007); vise.add(vgear); vise.position.set(.05, .835, .1); ws.add(vise);
  for (const [x, z, r] of [[-.3, .25, .05], [.45, .28, .07], [.6, -.1, .04]]) { const gg = mesh(gearGeo(r, 14, .01, 3), br, x, .845, z); gg.rotation.x = -Math.PI / 2; ws.add(gg); }
  { const sc = cyl(.035, .035, .4, toon('#efe2c0'), .5, .87, -.3, 10); sc.rotation.z = Math.PI / 2; ws.add(sc); }
  const filings = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, .006, .012), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, .8) }), 24); filings.frustumCulled = false; ws.add(filings);
  const fseed = Array.from({ length: 24 }, () => [R(), R(), R()]);

  /* modern lab */
  const lab = new THREE.Group(); G.add(lab); const white = toon('#eef2f5'), grey = toon('#9aa6b2');
  const scT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#e9eef2'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; g.fillRect(0, h - 70, w, 70); g.fillStyle = '#1d1418'; for (let x = -70; x < w; x += 70) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 35, h); g.lineTo(x + 105, h - 70); g.lineTo(x + 70, h - 70); g.fill(); }
    g.font = '700 64px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('X-RAY', w / 2, 80); g.font = '700 44px system-ui, sans-serif'; g.fillText('8 t', w - 70, 150); g.strokeStyle = '#9aa6b2'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); });
  const scan = new THREE.Group(); scan.add(mesh(new THREE.BoxGeometry(2.3, 2.0, .7), [white, white, white, white, toon('#ffffff', { map: scT }), white], 0, 1.0, 0));
  const ringM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 1.6, 3) }); scan.add(mesh(new THREE.TorusGeometry(.42, .05, 8, 30), ringM, 0, 1.12, .37, { cast: false })); scan.add(mesh(new THREE.CircleGeometry(.42, 30), new THREE.MeshBasicMaterial({ color: '#0b1d2e' }), 0, 1.12, .355, { cast: false }));
  scan.position.set(0, 0, -1.1); lab.add(scan);
  const monT = canvasTex(256, 192, (g, w, h) => { g.fillStyle = '#06203a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8fe0ff'; g.lineWidth = 3; for (const [x, y, r] of [[110, 100, 60], [180, 60, 26], [60, 50, 20], [190, 140, 30]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, r * .3, 0, 7); g.stroke(); } });
  { const m = new THREE.Group(); m.add(box(.62, .46, .05, toon('#2a2f36'), 0, .32, 0)); m.add(mesh(new THREE.PlaneGeometry(.56, .4), new THREE.MeshBasicMaterial({ map: monT, color: new THREE.Color(1.5, 1.5, 1.5) }), 0, .32, .027, { cast: false })); m.add(box(.06, .1, .06, grey, 0, .05, 0)); m.add(box(.26, .02, .16, grey, 0, .01, 0)); m.position.set(.58, .835, -.15); m.rotation.y = -.35; lab.add(m); }
  const manT = textTex(256, 330, (g, w, h) => { g.fillStyle = '#f7f1e1'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1d1418'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#1d1418'; g.font = '700 38px Georgia, serif'; g.fillText('ΟΔΗΓΙΕΣ', w / 2, 56); g.font = '700 30px Georgia, serif'; g.fillText('ΧΡΗΣΕΩΣ', w / 2, 98);
    g.strokeStyle = '#b07f2a'; g.lineWidth = 9; g.beginPath(); g.arc(w / 2, 192, 52, 0, 7); g.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 52, 192 + Math.sin(a) * 52); g.lineTo(w / 2 + Math.cos(a) * 68, 192 + Math.sin(a) * 68); g.stroke(); } g.font = '700 30px system-ui, sans-serif'; g.fillText('MANUAL', w / 2, 290); });
  const manual = mesh(new THREE.PlaneGeometry(.34, .44).translate(0, .22, 0), new THREE.MeshToonMaterial({ map: manT, gradientMap: GRAD, side: THREE.DoubleSide }), -.1, .84, .25); lab.add(manual);

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V(1, 1, 1), _p = V(0, 0, 0);
  const PAL = { museum: ['#a3bca8', '#b39a78', '#9a8468'], workshop: ['#d6cdb6', '#b3ada0', '#9c8a70'], lab: ['#cfe0ea', '#8f9ba6', '#e6ebee'] };
  function set(kind, t, { year = 0, flip = 0, file = 0, manualK = 0, scanOn = 1 } = {}) {
    mus.visible = kind === 'museum'; ws.visible = kind === 'workshop'; lab.visible = kind === 'lab';
    wallM.color.set(PAL[kind][0]); floorM.color.set(PAL[kind][1]); tableM.color.set(PAL[kind][2]); stripes.repeat.set(kind === 'museum' ? 5 : .01, 1);
    lamp.intensity = kind === 'lab' ? 0 : (kind === 'workshop' ? 1.5 : 1.0) + .15 * Math.sin(t * 11) * (kind === 'workshop' ? 1 : 0); lamp.color.set(kind === 'workshop' ? '#ffc88a' : '#ffdcae');
    if (kind === 'museum') { cal.material.map = calTex[Math.min(2, year + (flip > 0 ? 1 : 0))]; page.material.map = calTex[Math.min(2, year)]; page.visible = flip > 0 && flip < 1; page.rotation.x = -flip * 2.6; }
    if (kind === 'workshop') { vgear.rotation.z = .05 * Math.sin(t * 30) * file; G.userData.flame.scale.setScalar(1 + .15 * Math.sin(t * 17));
      fseed.forEach(([a, b, c], i) => { const life = (t * 2.2 + a) % 1; _p.set(.05 + .13 + life * (.15 + b * .25), .835 + .34 + life * .25 - life * life * .6, .1 + (c - .5) * .2); _s.setScalar(file * (1 - life)); _m.compose(_p, _q, _s); filings.setMatrixAt(i, _m); }); filings.instanceMatrix.needsUpdate = true; }
    if (kind === 'lab') { ringM.color.setRGB(.5, 1.6, 3).multiplyScalar(scanOn * (.8 + .3 * Math.sin(t * 9))); const k = manualK <= 0 ? 0 : 1 + 2.2 * Math.pow(manualK - 1, 3) + 1.2 * Math.pow(manualK - 1, 2); manual.scale.setScalar(Math.max(.001, k)); manual.rotation.z = .12 * Math.sin(t * 6) * (1 - manualK) - .08; }
  }
  return { group: G, set, tableY: .835 };
}

/* =====================================================================
   Dark stage: exploding gears, sky machine (Sun, Moon, planets), eclipse, X-ray image
   ===================================================================== */
export function buildVoid() {
  const G = new THREE.Group(), R = rng(22);
  /* thirty gears */
  const burst = new THREE.Group(); G.add(burst);
  const gm = new THREE.MeshToonMaterial({ color: '#d9a441', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: .5, gradientMap: GRAD });
  const geos = [gearGeo(.11, 30, .012, 4), gearGeo(.075, 22, .012, 4), gearGeo(.05, 16, .01, 3), gearGeo(.035, 12, .01, 3)], gears = [];
  for (let i = 0; i < 30; i++) { const m = mesh(geos[i === 0 ? 0 : 1 + (i % 3)], gm, 0, 0, 0, { cast: false }); const a = i * 2.39996, r = .1 + .09 * Math.sqrt(i) * 1.55; m.userData = { x: Math.cos(a) * r * .78, y: Math.sin(a) * r * 1.25, z: (R() - .5) * .25, sp: (i % 2 ? 1 : -1) * (1.5 + R() * 2), d: R() * .15 }; burst.add(m); gears.push(m); }
  /* sky machine */
  const sky = new THREE.Group(); G.add(sky);
  { const n = 420, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([(R() - .5) * 26, (R() - .5) * 30, -6 - R() * 8], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sky.add(new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(2, 2, 2.4), size: .05, fog: false }))); }
  const glowT = canvasTex(128, 128, (g) => { const a = g.createRadialGradient(64, 64, 4, 64, 64, 64); a.addColorStop(0, 'rgba(255,255,255,1)'); a.addColorStop(.35, 'rgba(255,255,255,.35)'); a.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = a; g.fillRect(0, 0, 128, 128); });
  const orb = (r, col, glow) => { const o = new THREE.Group(); const mat = new THREE.MeshToonMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: .35, gradientMap: GRAD }); o.add(mesh(new THREE.SphereGeometry(r, 20, 14), mat, 0, 0, 0, { cast: false }));
    const h = new THREE.Mesh(new THREE.PlaneGeometry(r * 7, r * 7), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: col, opacity: glow, fog: false })); o.add(h); o.userData = { mat, halo: h, glow }; sky.add(o); return o; };
  const sun = orb(.55, '#ffc23a', .9), moon = orb(.26, '#dfe6ee', .35), planets = [['#e2603a', .13, 2.3, .9], ['#58b0e0', .16, 3.0, .6], ['#e8c27a', .22, 3.8, .4], ['#9bd06a', .12, 1.6, 1.4], ['#c79be0', .14, 4.5, .3]].map(([c, r, d, sp]) => { const o = orb(r, c, .3); o.userData.d = d; o.userData.sp = sp; return o; });
  const ringM = new THREE.MeshBasicMaterial({ color: '#7a6230', fog: false }); const rings = [1.25, 1.6, 2.3, 3.0, 3.8, 4.5].map(r => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 4, 90), ringM); sky.add(m); return m; });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.1, 1.0, .9), opacity: 0, fog: false })); sky.add(corona);
  /* X-ray image */
  const xr = new THREE.Group(); G.add(xr);
  const xT = canvasTex(512, 896, (g, w, h) => { g.fillStyle = '#041a30'; g.fillRect(0, 0, w, h); const r = rng(40); g.strokeStyle = 'rgba(140,220,255,.9)';
    for (const [x, y, rr, n] of [[256, 430, 190, 60], [120, 190, 80, 30], [400, 210, 66, 26], [390, 690, 96, 36], [130, 700, 70, 26], [256, 430, 60, 20]]) { g.lineWidth = 5; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(x, y, rr * .25, 0, 7); g.stroke();
      for (let i = 0; i < n; i++) { const a = i / n * 6.283; g.beginPath(); g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); g.lineTo(x + Math.cos(a) * (rr + 9), y + Math.sin(a) * (rr + 9)); g.stroke(); } for (let i = 0; i < 4; i++) { const a = i * 1.5708 + x; g.beginPath(); g.moveTo(x + Math.cos(a) * rr * .25, y + Math.sin(a) * rr * .25); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); g.stroke(); } }
    g.fillStyle = 'rgba(120,200,255,.08)'; for (let i = 0; i < 500; i++) g.fillRect(r() * w, r() * h, 2, 2); });
  xr.add(new THREE.Mesh(new THREE.PlaneGeometry(4, 7), new THREE.MeshBasicMaterial({ map: xT, color: new THREE.Color(1.3, 1.3, 1.3), fog: false })));
  const letters = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ', lT = [0, 1, 2].map(s => canvasTex(512, 896, (g, w, h) => { const r = rng(50 + s); g.fillStyle = '#fff'; g.font = '700 15px Georgia, serif';
    for (let y = 14; y < h; y += 19) for (let x = 6 + ((y / 19) % 2) * 5; x < w; x += 13.5) if (r() < .34) g.fillText(letters[Math.floor(r() * 24)], x, y); }));
  const lay = lT.map((t, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.6, 1.25, .5), opacity: 0, fog: false })); m.position.z = .01 + i * .005; xr.add(m); return m; });
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .5), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(.6, 1.6, 2.4), fog: false })); scanLine.position.z = .03; xr.add(scanLine);

  function show(what) { burst.visible = what === 'burst'; sky.visible = what === 'sky' || what === 'eclipse'; xr.visible = what === 'xray'; }
  /** k: 0 packed in the lump .. 1 spread */
  function updateBurst(t, k) { const e = 1 + 2.0 * Math.pow(k - 1, 3) + 1.0 * Math.pow(k - 1, 2); gears.forEach((m, i) => { const u = m.userData, kk = clamp01((k - u.d) / (1 - u.d)), ee = kk <= 0 ? 0 : 1 + 2.0 * Math.pow(kk - 1, 3) + 1.0 * Math.pow(kk - 1, 2);
    m.position.set(u.x * ee * 1.05, u.y * ee * 1.05 + .03 * Math.sin(t * 2 + i), u.z * ee); m.rotation.z = t * u.sp; m.scale.setScalar((.25 + .75 * Math.min(1, ee)) * 1.5); }); gm.emissiveIntensity = .45 + .2 * Math.sin(t * 10); }
  /** hi: which body is named right now ('sun' | 'moon' | 'planets' | null); ecl: 0..1 eclipse progress */
  function updateSky(t, camera, { hi = null, ecl = -1 } = {}) {
    const E = ecl >= 0; rings.forEach(r => { r.visible = !E; }); planets.forEach(p => { p.visible = !E; });
    const a = t * .5; sun.position.set(0, 0, 0); sun.scale.setScalar(E ? 2.2 : 1 + (hi === 'sun' ? .25 : 0));
    if (E) { moon.position.set(lerp(-3.2, .0, smooth(ecl)), lerp(.5, 0, smooth(ecl)), .9); moon.scale.setScalar(4.75); moon.userData.mat.color.set('#10131c'); moon.userData.mat.emissiveIntensity = 0; moon.userData.halo.visible = false;
      corona.position.set(0, 0, -.2); corona.material.opacity = smooth((ecl - .75) / .25) * .7; corona.scale.setScalar(1.25 + .06 * Math.sin(t * 7)); sun.userData.halo.material.opacity = .9 * (1 - smooth((ecl - .5) / .4) * .85); }
    else { moon.position.set(Math.cos(a * 2.6 + 1) * 1.25, Math.sin(a * 2.6 + 1) * 1.25, 0); moon.scale.setScalar(1 + (hi === 'moon' ? .5 : 0)); moon.userData.mat.color.set('#dfe6ee'); moon.userData.mat.emissiveIntensity = hi === 'moon' ? 1.2 : .35; moon.userData.halo.visible = true; corona.material.opacity = 0; sun.userData.halo.material.opacity = .9; }
    sun.userData.mat.emissiveIntensity = hi === 'sun' ? 1.6 : .7; moon.userData.halo.material.opacity = hi === 'moon' ? .9 : .35;
    planets.forEach((p, i) => { const u = p.userData, an = a * u.sp + i * 1.9; p.position.set(Math.cos(an) * u.d, Math.sin(an) * u.d, 0); p.scale.setScalar(hi === 'planets' ? 1.5 : 1); u.mat.emissiveIntensity = hi === 'planets' ? 1.2 : .35; u.halo.material.opacity = hi === 'planets' ? .9 : .3; });
    for (const o of [sun, moon, ...planets]) o.userData.halo.quaternion.copy(camera.quaternion); corona.quaternion.copy(camera.quaternion);
  }
  function updateXray(t, k) { lay.forEach((m, i) => { m.material.opacity = smooth((k - i * .22) / .35) * (.75 + .25 * Math.sin(t * 5 + i * 2)); }); scanLine.position.y = 3.3 - ((t * .9) % 1) * 6.6; }
  return { group: G, show, updateBurst, updateSky, updateXray };
}

/* =====================================================================
   Greek exteriors: sundial court, Olympia, Athens 2005, the hill of passing eras
   ===================================================================== */
function temple({ cols = 6, w = 7, sign: txt = null, colH = 3.2 } = {}) {
  const T = new THREE.Group(), stone = toon('#efe7d6'), stoneD = toon('#d8cdb6'), roof = toon('#c0603c');
  for (let i = 0; i < 3; i++) T.add(box(w + 1.2 - i * .4, .22, 4.6 - i * .4, i % 2 ? stone : stoneD, 0, .11 + i * .22, 0));
  for (let i = 0; i < cols; i++) { const x = -w / 2 + .35 + i * (w - .7) / (cols - 1); T.add(cyl(.24, .28, colH, stone, x, .66 + colH / 2, 1.5, 10)); T.add(box(.66, .14, .66, stoneD, x, .66 + colH + .07, 1.5)); }
  T.add(box(w - .6, colH, 2.6, stoneD, 0, .66 + colH / 2, -.3)); T.add(box(1.2, 2.2, .1, toon('#3a2a20'), 0, 1.76, 1.02));
  const ent = mesh(new THREE.BoxGeometry(w + .3, .55, 4.0), [stone, stone, stone, stone, txt ? toon('#ffffff', { map: sign(txt, { w: 1024, h: 80, bg: '#efe7d6', font: '700 60px Georgia, serif', border: null }) }) : stone, stone], 0, .66 + colH + .42, 0); T.add(ent);
  const s = new THREE.Shape(); s.moveTo(-w / 2 - .3, 0); s.lineTo(w / 2 + .3, 0); s.lineTo(0, 1.3); const ped = mesh(new THREE.ExtrudeGeometry(s, { depth: 4.0, bevelEnabled: false }), stone, 0, .66 + colH + .7, -2.0); T.add(ped);
  for (const sd of [-1, 1]) { const r = box(w / 2 + .6, .1, 4.3, roof, sd * (w / 4 + .1), .66 + colH + 1.4, 0); r.rotation.z = -sd * Math.atan2(1.3, w / 2 + .3); T.add(r); }
  return T;
}
export function buildGreek() {
  const G = new THREE.Group(), R = rng(33);
  const groundM = toon('#9cc45a'); const ground = mesh(new THREE.PlaneGeometry(260, 260), groundM, 0, .25, 0, { cast: false }); ground.rotation.x = -Math.PI / 2; G.add(ground);
  const stone = toon('#efe7d6'), stoneD = toon('#cfc4ad');
  const tree = (x, z, s = 1, par = G) => { const T = new THREE.Group(); T.add(cyl(.09, .14, 1.0, toon('#5a4636'), 0, .5, 0, 6)); for (let k = 0; k < 3; k++) { const b = mesh(new THREE.IcosahedronGeometry(.6 + R() * .25, 1), toon(k % 2 ? '#7fa55a' : '#6a9150'), (R() - .5) * .6, 1.2 + R() * .4, (R() - .5) * .6); b.scale.y = .8; T.add(b); } T.position.set(x, .25, z); T.scale.setScalar(s); par.add(T); };
  const cypress = (x, z, par) => { const c = mesh(new THREE.ConeGeometry(.45, 3.4, 8), toon('#3f6b46'), x, 1.95, z); par.add(c); };

  /* sundial court */
  const court = new THREE.Group(); G.add(court);
  court.add(cyl(2.6, 2.7, .12, stoneD, 0, .31, 0, 28)); court.add(cyl(.5, .6, .8, stone, 0, .7, 0, 12));
  const dT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#efe7d6'; g.fillRect(0, 0, w, h); g.translate(w / 2, h / 2); g.strokeStyle = '#6a5a40'; g.fillStyle = '#6a5a40'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 236, 0, 7); g.stroke(); g.font = '700 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    'ΑΒΓΔΕΖΗΘΙΙΑΙΒ'.length; ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'ΙΑ', 'ΙΒ'].forEach((c, i) => { const a = Math.PI + (i + .5) / 11 * Math.PI; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.cos(a) * 60, Math.sin(a) * 60); g.lineTo(Math.cos(a) * 160, Math.sin(a) * 160); g.stroke(); g.fillText(c, Math.cos(a) * 196, Math.sin(a) * 196); }); });
  { const d = mesh(new THREE.CircleGeometry(.95, 40), toon('#ffffff', { map: dT }), 0, 1.115, 0, { cast: false }); d.rotation.x = -Math.PI / 2; court.add(d); court.add(cyl(.95, .95, .1, stone, 0, 1.06, 0, 40)); const gn = mesh(new THREE.ConeGeometry(.05, .75, 4), toon('#b07f2a'), 0, 1.45, -.05); gn.rotation.x = -.35; court.add(gn); }
  { const t = temple({ cols: 4, w: 5 }); t.position.set(-5, .25, -9); t.rotation.y = .3; court.add(t); for (const [x, z] of [[4, -6], [6.5, -3], [-8, -3], [3, -10]]) cypress(x, z, court); for (const [x, z] of [[5, -8], [-3.5, -5]]) tree(x, z, 1.2, court); }

  /* Olympia */
  const oly = new THREE.Group(); G.add(oly);
  const trackT = canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#e2b77c'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.85)'; for (const x of [4, 86, 168, 248]) g.fillRect(x, 0, 5, h); const r = rng(2); g.fillStyle = 'rgba(150,100,50,.3)'; for (let i = 0; i < 300; i++) g.fillRect(r() * w, r() * h, 3, 3); }, { repeat: true }); trackT.repeat.set(1, 6);
  { const tr = mesh(new THREE.PlaneGeometry(6.6, 70), toon('#ffffff', { map: trackT }), 0, .27, -10, { cast: false }); tr.rotation.x = -Math.PI / 2; oly.add(tr); oly.add(box(6.6, .08, .5, stone, 0, .29, -2)); }
  const crowdM = new THREE.MeshBasicMaterial({ color: '#ffffff' }), crowd = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 8, 6), crowdM, 260); crowd.frustumCulled = false; oly.add(crowd);
  const cseed = []; const cc = new THREE.Color(), pal = ['#f8f1e2', '#e9d9bf', '#d9836a', '#7fb0d9', '#e8c24a', '#b98fd0', '#8fc98a'];
  for (const sd of [-1, 1]) { const bank = box(7, .5, 70, toon('#86b24c'), sd * 7.6, 1.0, -10); bank.rotation.z = sd * .32; oly.add(bank); }
  for (let i = 0; i < 260; i++) { const sd = i % 2 ? 1 : -1, row = Math.floor(R() * 5), z = 4 - R() * 40; cseed.push([sd * (4.9 + row * 1.0), .75 + row * .34, z, R() * 6]); crowd.setColorAt(i, cc.set(pal[i % pal.length])); }
  { const t = temple({ cols: 6, w: 8 }); t.position.set(0, .25, -44); oly.add(t); for (const x of [-3.9, 3.9]) oly.add(cyl(.07, .09, 4.2, toon('#5a4030'), x, 2.3, -2.4, 8));
    const b = mesh(new THREE.PlaneGeometry(7.6, 1.0, 12, 1), toon2('#ffffff', { map: sign('ΟΛΥΜΠΙΑ', { w: 1024, h: 128, bg: '#fbf3dc', font: '700 96px Georgia, serif', border: '#b8402e' }) }), 0, 3.8, -2.4); oly.add(b); oly.userData.banner = b; for (const [x, z] of [[-12, -20], [12, -26], [-13, -36], [11, -8]]) cypress(x, z, oly); }

  /* Athens 2005 */
  const ath = new THREE.Group(); G.add(ath);
  const roadT = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#4a4f57'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2ee'; g.fillRect(20, 28, 90, 8); }, { repeat: true }); roadT.repeat.set(16, 1);
  { const rd = mesh(new THREE.PlaneGeometry(90, 5.2), toon('#ffffff', { map: roadT }), 0, .27, 3.2, { cast: false }); rd.rotation.x = -Math.PI / 2; ath.add(rd); ath.add(box(90, .16, 2.6, toon('#cfc9bd'), 0, .29, -.6)); }
  { const t = temple({ cols: 6, w: 8, sign: 'ΕΘΝΙΚΟΝ ΑΡΧΑΙΟΛΟΓΙΚΟΝ ΜΟΥΣΕΙΟΝ' }); t.position.set(1, .25, -5.5); ath.add(t); }
  const winT = (c) => canvasTex(128, 256, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = '#5c7fa0'; for (let y = 14; y < h - 20; y += 40) for (let x = 12; x < w - 20; x += 38) g.fillRect(x, y, 24, 26); g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 46; y < h; y += 40) g.fillRect(0, y, w, 4); });
  for (const [x, z, w, h, c] of [[-9, -5, 5, 7, '#e8dcc4'], [-15, -6, 5, 9, '#d9c8b0'], [10.5, -5, 5, 6, '#e3d2c0'], [16, -6, 5, 8.5, '#ecdcc8'], [-21, -5, 5, 6, '#e0d4c2'], [22, -6, 5, 7, '#d8cbb8']]) ath.add(mesh(new THREE.BoxGeometry(w, h, 4), toon('#ffffff', { map: winT(c) }), x, .25 + h / 2, z));
  { const hill = mesh(new THREE.CylinderGeometry(14, 22, 12, 10), toon('#b9a27e'), -8, 6, -55); ath.add(hill); const t = temple({ cols: 8, w: 11, colH: 4 }); t.position.set(-8, 12, -55); ath.add(t); for (let i = 0; i < 14; i++) ath.add(mesh(new THREE.BoxGeometry(4 + R() * 3, 3 + R() * 5, 4), toon(['#e8dcc4', '#efe6d6', '#d9c8b0'][i % 3]), -40 + i * 6 + R() * 2, 2.5, -30 - R() * 10)); }
  for (const x of [-4.6, 6.6]) { ath.add(cyl(.06, .08, 4.6, toon('#39424d'), x, 2.5, .5, 8)); }
  { const b = mesh(new THREE.PlaneGeometry(10.6, 1.05, 12, 1), toon2('#ffffff', { map: sign('ΑΘΗΝΑ 2005', { w: 1024, h: 110, bg: '#1f62ad', fg: '#ffffff', font: '700 84px Georgia, serif', border: '#ffffff' }) }), 1, 4.3, .5); ath.add(b); ath.userData.banner = b; }
  for (const [x, z] of [[-6.5, -1.2], [8.5, -1.2]]) tree(x, z, 1.1, ath);
  // the truck
  const truck = new THREE.Group(), red = toon('#d2452f'), dark = toon('#2a2f36'); const bodyG = new THREE.Group(); truck.add(bodyG);
  bodyG.add(box(1.5, 1.5, 1.9, red, 2.3, 1.25, 0)); bodyG.add(box(.06, .62, 1.6, toon('#9fd3ee'), 3.06, 1.5, 0)); bodyG.add(box(4.4, .22, 2.0, dark, -.5, .68, 0)); bodyG.add(box(.5, .3, 1.9, dark, 3.1, .62, 0));
  const crT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c9a26a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5630'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16); g.beginPath(); g.moveTo(8, 8); g.lineTo(w - 8, h - 8); g.moveTo(w - 8, 8); g.lineTo(8, h - 8); g.globalAlpha = .35; g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#1d1418'; g.textAlign = 'center'; g.font = '700 120px system-ui, sans-serif'; g.fillText('X-RAY', w / 2, 220); g.font = '700 150px system-ui, sans-serif'; g.fillText('8 t', w / 2, 400); });
  const crM = toon('#ffffff', { map: crT }); bodyG.add(mesh(new THREE.BoxGeometry(3.6, 3.0, 2.3), [toon('#b8905a'), toon('#b8905a'), toon('#b8905a'), toon('#b8905a'), crM, toon('#b8905a')], -.8, 2.3, 0));
  const wheels = []; for (const [x, z] of [[2.4, .9], [2.4, -.9], [-1.0, .95], [-1.0, -.95], [-2.0, .95], [-2.0, -.95]]) { const wh = cyl(.42, .42, .3, dark, x, .42, z, 14); wh.rotation.x = Math.PI / 2; truck.add(wh); wheels.push(wh); }
  truck.position.set(0, .27, 3.4); ath.add(truck);

  /* hill of passing eras */
  const era = new THREE.Group(); G.add(era);
  era.add(cyl(.34, .42, 1.0, stone, 0, .75, 0, 12)); era.add(cyl(.5, .5, .08, stoneD, 0, 1.27, 0, 12));
  const e1 = temple({ cols: 6, w: 8 }); e1.position.y = .25; const e2 = new THREE.Group(), e3 = new THREE.Group(); const cs = toon('#a9a39a'), csD = toon('#8a8479');
  for (const x of [-3.4, 3.4]) { e2.add(cyl(1.3, 1.4, 6.5, cs, x, 3.5, 0, 12)); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; e2.add(box(.5, .5, .5, csD, x + Math.cos(a) * 1.2, 7.0, Math.sin(a) * 1.2)); } e2.add(mesh(new THREE.ConeGeometry(1.5, 1.8, 12), toon('#b8402e'), x, 8.1, 0)); }
  e2.add(box(6.8, 4.4, 1.2, cs, 0, 2.45, 0)); for (let i = 0; i < 7; i++) e2.add(box(.55, .5, 1.2, csD, -2.7 + i * .9, 4.9, 0)); e2.add(box(1.4, 2.4, .1, toon('#5a4030'), 0, 1.45, .62));
  e3.add(box(3.6, 9.5, 3.6, toon('#d9c7a4'), 0, 5.0, 0)); e3.add(mesh(new THREE.ConeGeometry(2.9, 3.2, 4).rotateY(Math.PI / 4), toon('#3f5f8a'), 0, 11.3, 0));
  const clockT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#24467e'; g.fillRect(0, 0, w, h); g.translate(128, 128); g.fillStyle = '#f3ead2'; g.beginPath(); g.arc(0, 0, 112, 0, 7); g.fill(); g.strokeStyle = '#e3a83a'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#1d1418'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.arc(Math.cos(a) * 92, Math.sin(a) * 92, 7, 0, 7); g.fill(); } });
  e3.add(mesh(new THREE.PlaneGeometry(2.6, 2.6), toon('#ffffff', { map: clockT }), 0, 7.2, 1.81, { cast: false })); const hands = [box(.1, 1.0, .04, toon('#1d1418'), 0, .5, 0), box(.14, .7, .04, toon('#1d1418'), 0, .35, 0)].map(hm => { const p = new THREE.Group(); p.add(hm); p.position.set(0, 7.2, 1.84); e3.add(p); return p; });
  e3.add(mesh(gearGeo(.7, 16, .1, 4), toon('#e3a83a'), -.9, 3.6, 1.82)); e3.add(mesh(gearGeo(.5, 12, .1, 4), toon('#e3a83a'), .35, 3.9, 1.82)); e3.userData.g = [e3.children[e3.children.length - 2], e3.children[e3.children.length - 1]];
  const eras = [e1, e2, e3]; eras.forEach(e => { e.position.z = -15; era.add(e); });
  const years = ['100 BC', '300 AD', '700 AD', '1000 AD', '1300 AD'].map(y => sign(y, { w: 512, h: 150, bg: '#efe7d6', font: '700 96px Georgia, serif', border: '#6a5a40' }));
  const board = mesh(new THREE.BoxGeometry(1.5, .44, .1), [stone, stone, stone, stone, new THREE.MeshToonMaterial({ map: years[0], gradientMap: GRAD }), stone], 0, .52, .62); board.rotation.x = -.25; era.add(board);
  for (const [x, z] of [[-9, -9], [9, -11], [-13, -18], [13, -19], [-6, -22], [7, -24]]) cypress(x, z, era);

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = V(1, 1, 1), _p = V(0, 0, 0);
  function show(what, t, { cheer = 0, truckX = 0, squash = 0, eraK = 0 } = {}) {
    court.visible = what === 'court'; oly.visible = what === 'olympia'; ath.visible = what === 'athens'; era.visible = what === 'eras';
    groundM.color.set(what === 'athens' ? '#bdb7ab' : what === 'court' ? '#c9d49a' : '#9cc45a');
    if (what === 'olympia') { cseed.forEach(([x, y, z, ph], i) => { _p.set(x, y + .12 * Math.abs(Math.sin(t * (5 + cheer * 6) + ph)) * (.4 + cheer), z); _m.compose(_p, _q, _s); crowd.setMatrixAt(i, _m); }); crowd.instanceMatrix.needsUpdate = true;
      const p = oly.userData.banner.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, .12 * Math.sin(p.getX(k) * 1.2 + t * 4)); p.needsUpdate = true; }
    if (what === 'athens') { truck.position.x = truckX; bodyG.position.y = -squash * .16 + .02 * Math.sin(t * 30); bodyG.rotation.z = -squash * .035; wheels.forEach(w => { w.rotation.z = -truckX / .42; w.scale.set(1 + squash * .1, 1, 1 - squash * .14); });
      const p = ath.userData.banner.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, .1 * Math.sin(p.getX(k) * 1.0 + t * 3)); p.needsUpdate = true; }
    if (what === 'eras') { eras.forEach((e, i) => { const d = i - eraK; e.position.x = d * 26; e.visible = Math.abs(d) < 1.2; }); board.material[4].map = years[Math.min(4, Math.floor(eraK * 2 + .25))];
      hands[0].rotation.z = -t * 6; hands[1].rotation.z = -t * .5; e3.userData.g[0].rotation.z = t * 2; e3.userData.g[1].rotation.z = -t * 2.8; }
  }
  return { group: G, show, truck };
}
