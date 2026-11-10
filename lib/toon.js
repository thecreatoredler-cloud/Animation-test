// Toon look helpers (STYLE_GUIDE.md section 8): flat painted materials for the 3D world,
// and simple pose-to-pose 2D characters.
//
// A ToonActor is one camera-facing card. Every pose is drawn once into its own texture
// (Canvas 2D) at load time; during playback poses are hard-swapped on the beat, with a
// 3-frame squash "settle" and a small idle bob. Scene light is applied as a tint, plus a
// rim light on one side, so the flat card still belongs to the 3D world. The card casts a
// real shadow.
import * as THREE from 'three';

export const INK = '#1d1418';

/* ---------- world materials ---------- */
let _grad;
export function toonGradient() {
  if (_grad) return _grad;
  const d = new Uint8Array([105, 105, 105, 255, 175, 175, 175, 255, 228, 228, 228, 255, 255, 255, 255, 255]);
  _grad = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat); _grad.minFilter = _grad.magFilter = THREE.NearestFilter; _grad.needsUpdate = true;
  return _grad;
}
export const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...o });
export function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** deterministic random numbers (animation must not depend on Math.random at runtime) */
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- character drawing ---------- */
// Canvas is 512 x 768; the feet stand at (256, 720). 1 unit = 1 px at that size.
const P = { W: 512, H: 768, footY: 720 };
function line(g, pts, w = 9) { g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke(); }
function limb(g, x, y, a1, l1, a2, l2, w = 9) {        // angles: 0 = straight down, positive = toward +x
  const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1, hx = ex + Math.sin(a2) * l2, hy = ey + Math.cos(a2) * l2;
  g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(ex, ey, hx, hy); g.stroke();
  return [hx, hy];
}
function blob(g, fill, path, lw = 9) { g.beginPath(); path(g); g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }

/**
 * design: { body, bodyW, bodyH, skin, headRX, headRY, legL, armL, drawBody?(g, box), drawHat?(g, head), drawFaceExtra?(g, head, face) }
 * pose:   { lean, crouch, armL:[a1,a2], armR:[a1,a2], legL:[a1,a2], legR:[a1,a2], headDX, headDY, headTilt,
 *           face: { look:[x,y], eyes, brows, mouth, sweat }, hatUp, held?(g, handL, handR, head) , fx?(g, head) }
 */
export function drawToon(g, D, pose) {
  const p = { lean: 0, crouch: 0, armL: [-.25, -.1], armR: [.25, .1], legL: [-.06, 0], legR: [.06, 0], headDX: 0, headDY: 0, headTilt: 0, hatUp: 0, face: {}, ...pose };
  const f = { look: [0, 0], eyes: 'open', brows: 'flat', mouth: 'smile', sweat: false, ...p.face };
  const legL = D.legL * (1 - p.crouch * .55), hipY = P.footY - legL, cx = 256 + p.lean * 40;
  const bw = D.bodyW, bh = D.bodyH * (1 - p.crouch * .12), topY = hipY - bh + 18;
  // legs (behind body)
  for (const [s, a] of [[-1, p.legL], [1, p.legR]]) {
    const x = cx + s * bw * .2, y = hipY - 8;
    const k = p.crouch * .9 * s;                                   // crouch: knees out
    const [fx, fy] = limb(g, x, y, a[0] + k, legL * .52, a[1] - k * 1.2, legL * .52);
    line(g, [[fx, fy], [fx + s * 16 + 6, fy]], 11);                // little shoe
  }
  // far arm is drawn before the body, near arm after — both simply drawn here; body covers shoulders
  const shY = topY + bh * .22, hands = {};
  const drawArm = (s, a) => { hands[s < 0 ? 'L' : 'R'] = limb(g, cx + s * bw * .42 + p.lean * 6, shY, a[0], D.armL * .5, a[1], D.armL * .5); };
  // body: a bean
  g.save(); g.translate(cx, hipY); g.rotate(p.lean * .25);
  blob(g, D.body, (g) => { const w = bw / 2, h = bh; g.moveTo(-w * .78, -h + 26); g.bezierCurveTo(-w * .5, -h - 10, w * .5, -h - 10, w * .78, -h + 26);
    g.bezierCurveTo(w * 1.12, -h * .5, w * 1.1, -10, w * .62, 6); g.bezierCurveTo(w * .3, 16, -w * .3, 16, -w * .62, 6); g.bezierCurveTo(-w * 1.1, -10, -w * 1.12, -h * .5, -w * .78, -h + 26); });
  if (D.drawBody) { g.save(); g.clip(); D.drawBody(g, { w: bw, h: bh }); g.restore();
    g.beginPath(); const w = bw / 2, h = bh; g.moveTo(-w * .78, -h + 26); g.bezierCurveTo(-w * .5, -h - 10, w * .5, -h - 10, w * .78, -h + 26);
    g.bezierCurveTo(w * 1.12, -h * .5, w * 1.1, -10, w * .62, 6); g.bezierCurveTo(w * .3, 16, -w * .3, 16, -w * .62, 6); g.bezierCurveTo(-w * 1.1, -10, -w * 1.12, -h * .5, -w * .78, -h + 26);
    g.closePath(); g.lineWidth = 9; g.strokeStyle = INK; g.stroke(); }
  g.restore();
  drawArm(-1, p.armL); drawArm(1, p.armR);
  // head
  const hx = cx + p.lean * 22 + p.headDX, hy = topY - D.headRY * .78 + p.headDY;
  const head = { x: hx, y: hy, rx: D.headRX, ry: D.headRY };
  g.save(); g.translate(hx, hy); g.rotate(p.headTilt);
  for (const s of [-1, 1]) blob(g, D.skin, (g) => g.ellipse(s * (D.headRX - 2), 8, 15, 20, 0, 0, 7), 8);         // ears
  blob(g, D.skin, (g) => g.ellipse(0, 0, D.headRX, D.headRY, 0, 0, 7), 10);
  // soft cheek shade on the far side keeps the head from looking like a sticker
  const sh = g.createRadialGradient(-D.headRX * .25, -D.headRY * .3, D.headRX * .4, 0, 0, D.headRX * 1.05); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(60,40,70,.16)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(0, 0, D.headRX - 5, D.headRY - 5, 0, 0, 7); g.fill();
  // face slides inside the head to show look direction
  const lx = f.look[0] * D.headRX * .26, ly = f.look[1] * D.headRY * .2 + 6;
  g.translate(lx, ly);
  const ex = D.headRX * .36, ey = -D.headRY * .1;
  for (const s of [-1, 1]) {
    g.fillStyle = 'rgba(240,120,110,.38)'; g.beginPath(); g.ellipse(s * D.headRX * .56, D.headRY * .3, 20, 13, 0, 0, 7); g.fill();   // rosy cheeks
    g.lineCap = 'round'; g.strokeStyle = INK; g.fillStyle = INK;
    if (f.eyes === 'open') { g.beginPath(); g.ellipse(s * ex, ey, 9, 13, 0, 0, 7); g.fill(); }
    else if (f.eyes === 'wide') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * ex, ey, 21, 24, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(s * ex + f.look[0] * 6, ey + f.look[1] * 7, 7, 0, 7); g.fill(); }
    else if (f.eyes === 'happy') { g.lineWidth = 8; g.beginPath(); g.arc(s * ex, ey + 6, 14, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); }
    else if (f.eyes === 'squint') { g.lineWidth = 8; g.beginPath(); g.moveTo(s * ex - s * 14, ey - 8); g.lineTo(s * ex + s * 8, ey + 2); g.lineTo(s * ex - s * 14, ey + 10); g.stroke(); }
    else if (f.eyes === 'half') { g.beginPath(); g.ellipse(s * ex, ey + 3, 9, 9, 0, 0, 7); g.fill(); g.lineWidth = 7; g.beginPath(); g.moveTo(s * ex - 16, ey - 6); g.lineTo(s * ex + 16, ey - 6); g.stroke(); }
    // brows
    g.lineWidth = 8; g.beginPath(); const by = ey - (f.eyes === 'wide' ? 40 : 30);
    if (f.brows === 'up') { g.moveTo(s * ex - 16, by - 6); g.quadraticCurveTo(s * ex, by - 20, s * ex + 16, by - 6); }
    else if (f.brows === 'worry') { g.moveTo(s * (ex - 16), by - 14); g.lineTo(s * (ex + 16), by + 2); }
    else if (f.brows === 'angry') { g.moveTo(s * (ex - 16), by + 4); g.lineTo(s * (ex + 16), by - 10); }
    else { g.moveTo(s * ex - 15, by); g.lineTo(s * ex + 15, by); }
    g.stroke();
  }
  blob(g, '#f1b9a0', (g) => g.ellipse(0, D.headRY * .14, 11, 9, 0, 0, 7), 6);                                         // small round nose
  const my = D.headRY * .46; g.lineWidth = 8; g.strokeStyle = INK;
  if (!D.hideMouth) {
    if (f.mouth === 'smile') { g.beginPath(); g.arc(0, my - 14, 26, Math.PI * .2, Math.PI * .8); g.stroke(); }
    else if (f.mouth === 'grin') { blob(g, '#fff', (g) => { g.moveTo(-30, my - 8); g.quadraticCurveTo(0, my + 30, 30, my - 8); }, 7); line(g, [[-18, my + 4], [18, my + 4]], 4); }
    else if (f.mouth === 'o') { blob(g, '#5a2630', (g) => g.ellipse(0, my + 2, 13, 17, 0, 0, 7), 7); }
    else if (f.mouth === 'teeth') { blob(g, '#fff', (g) => g.roundRect(-28, my - 12, 56, 28, 9), 7); line(g, [[-28, my + 2], [28, my + 2]], 4); for (const x of [-12, 2, 14]) line(g, [[x, my - 12], [x, my + 16]], 4); }
    else if (f.mouth === 'frown') { g.beginPath(); g.arc(0, my + 26, 22, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
    else { line(g, [[-16, my], [16, my]], 8); }
  }
  if (D.drawFaceExtra) D.drawFaceExtra(g, head, f);
  g.translate(-lx, -ly);
  if (D.drawHat) { g.save(); g.translate(0, -p.hatUp); D.drawHat(g, head, f); g.restore(); }
  if (f.sweat) for (const [sx, sy, r] of [[D.headRX * .8, -D.headRY * .62, 13], [-D.headRX * .98, -D.headRY * .2, 10]]) {
    blob(g, '#8fd3ff', (g) => { g.moveTo(sx, sy - r * 1.7); g.quadraticCurveTo(sx + r * 1.3, sy + r * .4, sx, sy + r); g.quadraticCurveTo(sx - r * 1.3, sy + r * .4, sx, sy - r * 1.7); }, 5); }
  g.restore();
  // tiny mitt hands, then anything held
  for (const k of ['L', 'R']) blob(g, D.skin, (g) => g.arc(hands[k][0], hands[k][1], 10, 0, 7), 6);
  if (p.held) p.held(g, hands.L, hands.R, head);
  if (p.fx) p.fx(g, head);
}
export const drawHelpers = { line, limb, blob };

/* ---------- actor ---------- */
const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `uniform sampler2D map; uniform vec3 keyC, ambC, rimC; uniform vec2 rimDir; uniform float glow; varying vec2 vUv;
  void main(){
    vec4 c = texture2D(map, vUv); if (c.a < 0.5) discard;
    float lum = dot(c.rgb, vec3(0.3, 0.59, 0.11)), paint = smoothstep(0.12, 0.4, lum);
    vec3 light = ambC + keyC * (0.86 + 0.14 * vUv.y);
    vec3 col = c.rgb * light;
    float edge = 1.0 - texture2D(map, vUv + rimDir * 0.022).a;          // pixels whose neighbour toward the rim light is empty
    col += rimC * edge * paint;
    col += c.rgb * glow * paint;                                          // pale heads glow a little, as in the references
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export class ToonActor {
  /**
   * poses: { name: pose }   timeline: [{ t, pose }] (hard swaps)   height: world height of the 768 px canvas
   */
  constructor(design, poses, { height = 1.5, timeline = [], draw = drawToon, canvas = [P.W, P.H], footY = P.footY } = {}) {
    this.tex = {};
    for (const [name, pose] of Object.entries(poses)) this.tex[name] = canvasTex(canvas[0], canvas[1], (g) => draw(g, design, pose));
    this.timeline = timeline; this.height = height;
    const w = height * canvas[0] / canvas[1], geo = new THREE.PlaneGeometry(w, height); geo.translate(0, height * (.5 - (canvas[1] - footY) / canvas[1]), 0);
    const first = Object.values(this.tex)[0];
    this.u = { map: { value: first }, keyC: { value: new THREE.Color(1, 1, 1) }, ambC: { value: new THREE.Color(.2, .2, .25) }, rimC: { value: new THREE.Color(0, 0, 0) },
               rimDir: { value: new THREE.Vector2(1, .3) }, glow: { value: 0 } };
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.u, side: THREE.DoubleSide }));
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: first, alphaTest: .5 });
    this.root = new THREE.Group(); this.root.add(this.mesh);
    this.bobAmp = .012; this.bobHz = 1.3; this.phase = 0; this.flip = 1;
  }
  poseAt(t) { let name = this.timeline.length ? this.timeline[0].pose : Object.keys(this.tex)[0], age = 99; for (const k of this.timeline) if (k.t <= t + 1e-4) { name = k.pose; age = t - k.t; } return { name, age }; }
  /** call every frame: swaps the pose, faces the camera, applies settle + bob */
  update(t, camera) {
    const { name, age } = this.poseAt(t), tex = this.tex[name];
    this.u.map.value = tex; this.mesh.customDepthMaterial.map = tex;
    // face the camera (yaw only), compensating for a rotated parent (e.g. a rocking boat)
    this.root.updateWorldMatrix(true, false);
    const wp = _v.setFromMatrixPosition(this.root.matrixWorld);
    let yaw = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
    if (this.root.parent) { this.root.parent.getWorldQuaternion(_q); _e.setFromQuaternion(_q, 'YXZ'); yaw -= _e.y; }
    this.mesh.rotation.y = yaw;
    const settle = age < .12 ? Math.sin(Math.PI * age / .12) : 0;          // 3-4 frames
    const bob = Math.sin((t + this.phase) * Math.PI * 2 * this.bobHz);
    this.mesh.scale.set(this.flip * (1 + settle * .05 - bob * .006), 1 - settle * .07 + bob * .012, 1);
    this.mesh.position.y = bob * this.bobAmp * .3;
  }
  light({ key, ambient, rim, rimDir, glow = 0 }) {
    if (key) this.u.keyC.value.copy(key); if (ambient) this.u.ambC.value.copy(ambient);
    if (rim) this.u.rimC.value.copy(rim); if (rimDir) this.u.rimDir.value.set(rimDir[0] * this.flip, rimDir[1]).normalize(); this.u.glow.value = glow;
  }
}
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
