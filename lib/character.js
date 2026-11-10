// Illustrated 2.5D character system.
// - Parts are layered SVG artwork rasterised at 2x into textures, each with a blurred "shape"
//   map that the shader turns into form shading and rim light (cards stay flat but read as round).
// - Face rig: eye whites, pupils (look-at), lids (blink / half-lid), brows, swappable mouths,
//   glasses and a flip-up loupe — expressions are animated, not swapped as whole heads.
// - Hands have shapes (open / pinch / grip / point). Arms can be posed or driven by 2-bone IK.
// - Lit by two screen-space lights (key + rim) plus ambient; a hidden twin rig casts the shadow.
// - Poses come from a keyed PoseTrack (eased, with overshoot) — everything is a function of time.
import * as THREE from 'three';

/* ---------- SVG -> texture ---------- */
export async function rasterSVG(svg, w, h, scale = 2) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const r = Math.max(4, Math.round(Math.max(c.width, c.height) * .035));
  const s = document.createElement('canvas'); s.width = c.width; s.height = c.height;
  const g = s.getContext('2d'); g.filter = `blur(${r}px)`; g.drawImage(c, 0, 0);
  const shape = new THREE.CanvasTexture(s); shape.colorSpace = THREE.NoColorSpace;
  return { map, shape, texel: 1.6 * r / Math.max(c.width, c.height), aspect: w / h };
}

/* ---------- shader ---------- */
const VERT = `varying vec2 vUv; varying float vY;
  void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = `
  uniform sampler2D map; uniform sampler2D shape; uniform float texel, form;
  uniform vec2 Lk; uniform vec2 Lr; uniform vec3 keyC; uniform vec3 rimC; uniform vec3 ambC;
  uniform float shadeAmt, baseY, height;
  varying vec2 vUv; varying float vY;
  void main(){
    vec4 c = texture2D(map, vUv);
    if (c.a < 0.5) discard;
    float s  = texture2D(shape, vUv).a;
    float gx = texture2D(shape, vUv + vec2(texel, 0.0)).a - texture2D(shape, vUv - vec2(texel, 0.0)).a;
    float gy = texture2D(shape, vUv + vec2(0.0, texel)).a - texture2D(shape, vUv - vec2(0.0, texel)).a;
    vec2 n = -vec2(gx, gy); float nl = length(n); n = nl > 1e-4 ? n / nl : vec2(0.0);
    float edge = smoothstep(0.0, 0.55, 1.0 - s) * form;
    float dk = dot(n, Lk), dr = dot(n, Lr);
    float h = clamp((vY - baseY) / height, 0.0, 1.0);
    float lum = dot(c.rgb, vec3(0.3, 0.59, 0.11));
    float ink = smoothstep(0.10, 0.35, lum);
    vec3 light = ambC * (0.8 + 0.35 * h) + keyC * (0.78 + 0.22 * clamp(dk * 0.5 + 0.5, 0.0, 1.0)) * (1.0 - shadeAmt * edge * clamp(-dk + 0.2, 0.0, 1.0));
    vec3 col = c.rgb * light;
    col += rimC * pow(edge, 1.1) * clamp(dr, 0.0, 1.0) * ink;
    col += keyC * 0.3 * pow(edge, 1.5) * clamp(dk, 0.0, 1.0) * ink;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const hiddenMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

/* ---------- easing + pose tracks ---------- */
export const ease = {
  linear: k => k,
  inOut: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  back: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },  // overshoot then settle
  snap: k => 1 - Math.pow(1 - k, 5),
};
/** keys: [{ t, dur?, ease?, p: { channel: value | string } }]. Numeric channels blend from the
 *  previous key's value over `dur` seconds (default 0.35) ending at t; strings switch at t. */
export class PoseTrack {
  constructor(defaults, keys) {
    this.defaults = defaults; this.ch = {};
    for (const k of keys) for (const [c, v] of Object.entries(k.p)) (this.ch[c] ||= []).push({ t: k.t, v, dur: k.dur ?? .35, ease: ease[k.ease || 'inOut'] });
    for (const list of Object.values(this.ch)) list.sort((a, b) => a.t - b.t);
  }
  value(c, t) {
    const list = this.ch[c], d = this.defaults[c];
    if (!list) return d;
    let prev = d, cur = null;
    for (const k of list) { if (k.t - (typeof k.v === 'number' ? k.dur : 0) <= t) { if (cur) prev = cur.v; cur = k; } else break; }
    if (!cur) return d;
    if (typeof cur.v !== 'number') return cur.v;
    const k = Math.min(1, Math.max(0, 1 - (cur.t - t) / cur.dur));
    return prev + (cur.v - prev) * cur.ease(k);
  }
  /** time since a string channel last changed (for expression pops) */
  age(c, t) { const list = this.ch[c]; if (!list) return 99; let a = 99; for (const k of list) if (k.t <= t) a = t - k.t; return a; }
  eval(t, out = {}) { for (const c of new Set([...Object.keys(this.defaults), ...Object.keys(this.ch)])) out[c] = this.value(c, t); return out; }
}

/** 2-bone IK in a plane. Bones hang along -y at rotation 0. Returns [upper, fore] rotations (z). */
export function solveIK2(L1, L2, x, y, bend = 1) {
  const d = Math.min(L1 + L2 - 1e-4, Math.max(Math.abs(L1 - L2) + 1e-4, Math.hypot(x, y)));
  const phi = Math.atan2(x, -y);
  const a1 = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const a2 = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
  return [phi - bend * a1, bend * (Math.PI - a2)];
}

/* ---------- the character ---------- */
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3();
export class Character {
  /**
   * spec.art: rasterised parts { head, torso, upper, fore, thigh, shin, hands:{open,pinch,grip,point},
   *   eyeWhite, pupil, lid, brow, mouths:{...}, glasses?, loupe?, bun? }
   * spec.dims: sizes/positions in metres (see showcase for an example)
   */
  constructor(scene, spec, { shadow = true, scale = 1 } = {}) {
    this.spec = spec; this.d = spec.dims; this.scale = scale;
    this.u = { Lk: { value: new THREE.Vector2(1, 0) }, Lr: { value: new THREE.Vector2(-1, 0) }, keyC: { value: new THREE.Color(1, 1, 1) },
               rimC: { value: new THREE.Color(0, 0, 0) }, ambC: { value: new THREE.Color(.3, .3, .35) }, shadeAmt: { value: .42 }, baseY: { value: 0 }, height: { value: 1.6 } };
    this.rig = this._build(false);
    scene.add(this.rig.root);
    if (shadow) { this.twin = this._build(true); scene.add(this.twin.root); }
    this.flipDir = 1;
  }
  _mat(art, form = 1) {
    return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide,
      uniforms: { map: { value: art.map }, shape: { value: art.shape }, texel: { value: art.texel }, form: { value: form }, ...this.u } });
  }
  _card(art, w, h, px, py, z, proxy, form = 1) {
    const g = new THREE.PlaneGeometry(w, h); g.translate((.5 - px) * w, (py - .5) * h, 0);
    let m;
    if (proxy) { m = new THREE.Mesh(g, hiddenMat); m.castShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: art.map, alphaTest: .5 }); }
    else m = new THREE.Mesh(g, this._mat(art, form));
    m.position.z = z; return m;
  }
  _build(proxy) {
    const A = this.spec.art, D = this.d, R = {};
    R.root = new THREE.Group(); R.flip = new THREE.Group(); R.body = new THREE.Group(); R.hips = new THREE.Group(); R.torso = new THREE.Group();
    R.root.add(R.flip); R.flip.add(R.body); R.body.add(R.hips); R.hips.position.y = D.hip; R.hips.add(R.torso);
    R.legs = {};
    for (const s of ['L', 'R']) {
      const th = new THREE.Group(); th.position.set(s === 'L' ? -D.legGap : D.legGap, 0, 0); R.hips.add(th);
      th.add(this._card(A.thigh, D.thighW, D.thighL + .06, .5, .06 / (D.thighL + .06), s === 'L' ? -.012 : -.016, proxy));
      const kn = new THREE.Group(); kn.position.y = -D.thighL; th.add(kn);
      kn.add(this._card(A.shin, D.shinW, D.shinL + .04, .5, .04 / (D.shinL + .04), s === 'L' ? -.014 : -.018, proxy));
      R.legs[s] = { th, kn };
    }
    R.torso.add(this._card(A.torso, D.torsoW, D.torsoH, .5, .96, 0, proxy));
    R.neck = new THREE.Group(); R.neck.position.y = D.neckY; R.torso.add(R.neck);
    R.head = new THREE.Group(); R.neck.add(R.head);
    const S = D.headS, HP = D.headPivot;                                    // head art coords (512 box) -> metres
    const hp = (px, py) => [(px - 256) / 512 * S, (HP * 512 - py) / 512 * S];
    R.head.add(this._card(A.head, S, S, .5, HP, .012, proxy));
    if (A.bun) { R.bun = new THREE.Group(); const [bx, by] = hp(...D.bunAt); R.bun.position.set(bx, by, .006); R.head.add(R.bun); R.bun.add(this._card(A.bun, D.bunS, D.bunS, .5, .85, 0, proxy)); }
    if (!proxy) {
      R.eyes = {};
      for (const [s, ex, ey] of [['L', ...D.eyeL], ['R', ...D.eyeR]]) {
        const [x, y] = hp(ex, ey), g = new THREE.Group(); g.position.set(x, y, .014); R.head.add(g);
        const ew = D.eyeW, eh = ew * 130 / 120;
        g.add(this._card(A.eyeWhite, ew, eh, .5, .5, 0, false, 0));
        const pupil = this._card(A.pupil, ew * .4, ew * .4, .5, .5, .002, false, 0); g.add(pupil);
        const lidPivot = new THREE.Group(); lidPivot.position.y = eh / 2; lidPivot.position.z = .004; g.add(lidPivot);
        lidPivot.add(this._card(A.lid, ew * 1.04, eh * 1.04, .5, 0, 0, false, 0));
        const [bx, by] = hp(ex, ey - D.browUp), brow = new THREE.Group(); brow.position.set(bx, by, .018); R.head.add(brow);
        brow.add(this._card(A.brow, D.browW, D.browW * 60 / 140, .5, .5, 0, false, 0));
        if (s === 'R') brow.scale.x = -1;
        R.eyes[s] = { g, pupil, lidPivot, brow, bx, by, ew, eh };
      }
      const [mx, my] = hp(...D.mouthAt); R.mouth = this._card(Object.values(A.mouths)[0], D.mouthW, D.mouthW * 120 / 180, .5, .5, 0, false, 0);
      R.mouth.position.set(mx, my, .016); R.head.add(R.mouth);
      if (A.glasses) R.head.add(this._card(A.glasses, S, S, .5, HP, .022, false, 0));
      if (A.loupe) { const [lx, ly] = hp(...D.loupeHinge); R.loupe = new THREE.Group(); R.loupe.position.set(lx, ly, .026); R.head.add(R.loupe);
        R.loupe.add(this._card(A.loupe, D.loupeS, D.loupeS * 1.25, .5, .02, 0, false, 0)); }
    }
    R.arms = {};
    for (const s of ['L', 'R']) {
      const sh = new THREE.Group(); sh.position.set((s === 'L' ? -1 : 1) * D.shoulderX, D.shoulderY, 0); R.torso.add(sh);
      sh.add(this._card(A.upper, D.armW, D.upperL + .05, .5, .05 / (D.upperL + .05), s === 'L' ? .03 : .034, proxy));
      const el = new THREE.Group(); el.position.y = -D.upperL; sh.add(el);
      el.add(this._card(A.fore, D.armW, D.foreL + .05, .5, .04 / (D.foreL + .05), s === 'L' ? .032 : .036, proxy));
      const wr = new THREE.Group(); wr.position.y = -D.foreL; el.add(wr);
      const hand = this._card(A.hands.open, D.handS, D.handS, .5, .08, s === 'L' ? .034 : .038, proxy); wr.add(hand);
      const tip = new THREE.Object3D(); tip.position.y = -D.handS * .62; wr.add(tip);        // where a held object sits
      R.arms[s] = { sh, el, wr, hand, tip };
    }
    return R;
  }
  /** world position of a hand's grip point */
  handWorld(side, out = new THREE.Vector3()) { return this.rig.arms[side].tip.getWorldPosition(out); }

  /** apply a pose (object from PoseTrack.eval) — cameraPos turns the card to face the camera */
  apply(p, camera, { faceAge = 99 } = {}) {
    const yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    this._applyRig(this.rig, p, yaw, faceAge);
    if (this.twin) this._applyRig(this.twin, p, p.shadowYaw ?? yaw, 99);
    // IK after the body is placed
    for (const s of ['L', 'R']) {
      const ik = p['ik' + s]; if (!ik || !(p['ikW' + s] > 0)) continue;
      for (const R of this.twin ? [this.rig, this.twin] : [this.rig]) {
        const a = R.arms[s]; R.root.updateMatrixWorld(true);
        _v.copy(ik); a.sh.parent.worldToLocal(_v); _v.sub(a.sh.position);
        // aim the wrist so the grip point (not the wrist) lands on the target
        const [u, f] = solveIK2(this.d.upperL, this.d.foreL + this.d.handS * .55, _v.x, _v.y, (s === 'L' ? -1 : 1) * (p['ikBend' + s] ?? 1));
        const w = p['ikW' + s];
        a.sh.rotation.z += (u - a.sh.rotation.z) * w; a.el.rotation.z += (f - a.el.rotation.z) * w; a.wr.rotation.z *= (1 - w);
      }
    }
    this.rig.root.updateMatrixWorld(true);
  }
  _applyRig(R, p, yaw, faceAge) {
    const A = this.spec.art, D = this.d;
    R.root.position.set(p.x, p.y, p.z); R.root.rotation.y = yaw; R.root.scale.setScalar(this.scale); R.flip.scale.x = p.dir ?? 1;
    R.body.position.y = p.bob; R.body.scale.set(p.sx, p.sy, 1);
    R.legs.L.th.rotation.z = p.hipL; R.legs.L.kn.rotation.z = p.kneeL; R.legs.R.th.rotation.z = p.hipR; R.legs.R.kn.rotation.z = p.kneeR;
    R.torso.rotation.z = p.lean + p.sway; R.torso.scale.set(1 + (1 - p.breath) * .5, p.breath, 1);
    R.head.rotation.z = p.headTilt - p.lean * .4;
    const pop = faceAge < .16 ? 1 + .06 * Math.sin(Math.PI * faceAge / .16) : 1; R.head.scale.setScalar(pop);
    R.head.position.y = p.headUp || 0;
    if (R.bun) R.bun.rotation.z = p.bun || 0;
    for (const s of ['L', 'R']) {
      const a = R.arms[s];
      a.sh.rotation.z = p['up' + s]; a.el.rotation.z = p['fore' + s]; a.wr.rotation.z = p['wrist' + s] || 0;
      const shapeName = p['hand' + s] || 'open', art = A.hands[shapeName];
      if (a.hand.material.uniforms) { a.hand.material.uniforms.map.value = art.map; a.hand.material.uniforms.shape.value = art.shape; }
      else a.hand.customDepthMaterial.map = art.map;
    }
    if (R.eyes) {
      for (const s of ['L', 'R']) {
        const e = R.eyes[s];
        e.pupil.position.set(p.lookX * e.ew * .2, p.lookY * e.eh * .2, .002);
        const lid = Math.min(1, Math.max(.04, p['lid' + s] + (p.blink || 0)));
        e.lidPivot.scale.y = lid;
        e.brow.position.y = e.by + p['brow' + s] * D.headS * .05; e.brow.rotation.z = (s === 'L' ? 1 : -1) * (p['browTilt' + s] || 0);
      }
      const m = A.mouths[p.mouth] || Object.values(A.mouths)[0];
      R.mouth.material.uniforms.map.value = m.map; R.mouth.material.uniforms.shape.value = m.shape;
      R.mouth.scale.set(1 + (p.mouthW || 0), 1 + (p.mouthH || 0), 1);
      if (R.loupe) R.loupe.rotation.z = -p.loupe * 2.5;
    }
  }
  /** lighting: key/rim light directions are given as world positions or directions and projected to screen */
  light({ camera, keyPos, keyColor, keyAmt = 1, rimDir, rimColor, rimAmt = 1, ambient, baseY = 0, height = 1.6 }) {
    const root = this.rig.root.position;
    const proj = (p, out) => out.copy(p).project(camera);
    proj(root, _n1); _n1.y += .0;
    if (keyPos) { proj(keyPos, _n2); this.u.Lk.value.set((_n2.x - _n1.x) * camera.aspect, _n2.y - _n1.y).normalize(); }
    if (rimDir) { _w.copy(root).addScaledVector(rimDir, 3); proj(_w, _n2); this.u.Lr.value.set((_n2.x - _n1.x) * camera.aspect, _n2.y - _n1.y).normalize(); }
    const d = this.rig.flip.scale.x; this.u.Lk.value.x *= d; this.u.Lr.value.x *= d;
    this.u.keyC.value.copy(keyColor).multiplyScalar(keyAmt);
    this.u.rimC.value.copy(rimColor).multiplyScalar(rimAmt);
    this.u.ambC.value.copy(ambient); this.u.baseY.value = baseY; this.u.height.value = height;
  }
}

/** default channel values for PoseTrack */
export const POSE_DEFAULTS = {
  x: 0, y: 0, z: 0, dir: 1, bob: 0, sx: 1, sy: 1, lean: 0, sway: 0, breath: 1, headTilt: 0, headUp: 0, bun: 0,
  upL: -.12, foreL: .12, wristL: 0, upR: .12, foreR: -.12, wristR: 0, handL: 'open', handR: 'open',
  hipL: 0, kneeL: 0, hipR: 0, kneeR: 0,
  lidL: .12, lidR: .12, blink: 0, browL: 0, browR: 0, browTiltL: 0, browTiltR: 0, lookX: 0, lookY: 0,
  mouth: 'smile', mouthW: 0, mouthH: 0, loupe: 0,
  ikWL: 0, ikWR: 0, ikBendL: 1, ikBendR: 1,
};
/** reusable named poses (partial channel sets) */
export const POSES = {
  idle:      { lean: 0, upL: -.12, foreL: .12, upR: .12, foreR: -.12, headTilt: 0 },
  leanIn:    { lean: -.0, headTilt: .05, sy: .97, headUp: -.02 },
  listen:    { headTilt: -.22, lookX: .7, lookY: .25, lidL: .3, lidR: .3, browL: .4, browR: .1 },
  surprised: { lidL: .02, lidR: .02, browL: .9, browR: .9, mouth: 'o', headUp: .03, sy: 1.04 },
  delighted: { lidL: .04, lidR: .04, browL: .6, browR: .6, mouth: 'grin', headTilt: .08, sy: 1.03 },
  focus:     { lidL: .45, lidR: .2, browL: -.5, browR: -.3, browTiltL: -.15, browTiltR: -.15, mouth: 'tongue', lookY: -.6 },
  shrug:     { upL: -.6, foreL: 1.2, upR: .6, foreR: -1.2, headTilt: .1, browL: .5, browR: .5, mouth: 'flat' },
};
