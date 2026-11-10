// Cinematic camera: one continuous path through keyframes.
// Hermite curves with monotone (Fritsch–Carlson-limited) tangents: velocity is continuous
// and the camera never overshoots a keyframe. Everything is a pure function of time.
import * as THREE from 'three';

const clamp01 = v => Math.min(1, Math.max(0, v));
const CH = ['px', 'py', 'pz', 'tx', 'ty', 'tz', 'fov', 'roll'];

export class CameraPath {
  /** keys: [{ t, pos: Vector3, tgt: Vector3, fov, roll? }] sorted by t */
  constructor(keys, { handheld = .008 } = {}) {
    this.keys = keys.map(k => ({ t: k.t, px: k.pos.x, py: k.pos.y, pz: k.pos.z, tx: k.tgt.x, ty: k.tgt.y, tz: k.tgt.z, fov: k.fov, roll: k.roll || 0 }));
    this.handheld = handheld;
    this.start = this.keys[0].t; this.end = this.keys[this.keys.length - 1].t;
  }
  _tan(k, key) {
    const a = this.keys;
    if (k === 0) return (a[1][key] - a[0][key]) / (a[1].t - a[0].t) * .5;
    if (k === a.length - 1) return (a[k][key] - a[k - 1][key]) / (a[k].t - a[k - 1].t) * .5;
    const l = (a[k][key] - a[k - 1][key]) / (a[k].t - a[k - 1].t), r = (a[k + 1][key] - a[k][key]) / (a[k + 1].t - a[k].t);
    const m = (a[k + 1][key] - a[k - 1][key]) / (a[k + 1].t - a[k - 1].t);
    if (l * r <= 0) return m * .35;
    return Math.sign(m) * Math.min(Math.abs(m), 3 * Math.min(Math.abs(l), Math.abs(r)));
  }
  _eval(t, key) {
    const a = this.keys; let i = 0;
    while (i < a.length - 2 && t > a[i + 1].t) i++;
    const A = a[i], B = a[i + 1], h = B.t - A.t, s = clamp01((t - A.t) / h);
    const s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * A[key] + (s3 - 2 * s2 + s) * h * this._tan(i, key) + (-2 * s3 + 3 * s2) * B[key] + (s3 - s2) * h * this._tan(i + 1, key);
  }
  /** returns { pos, tgt, fov, roll } at time t (out is reused) */
  at(t, out = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 45, roll: 0 }) {
    out.pos.set(this._eval(t, 'px'), this._eval(t, 'py'), this._eval(t, 'pz'));
    out.tgt.set(this._eval(t, 'tx'), this._eval(t, 'ty'), this._eval(t, 'tz'));
    out.fov = this._eval(t, 'fov'); out.roll = this._eval(t, 'roll');
    const h = this.handheld; out.pos.x += h * Math.sin(t * 1.7); out.pos.y += h * .8 * Math.sin(t * 2.3 + 1);
    return out;
  }
  /** apply to a camera */
  apply(camera, t) {
    const s = this.at(t, this._tmp || (this._tmp = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 45, roll: 0 }));
    camera.position.copy(s.pos); camera.fov = s.fov; camera.updateProjectionMatrix(); camera.lookAt(s.tgt);
    if (s.roll) camera.rotateZ(s.roll);
    camera.updateMatrixWorld();
    return s;
  }
  /** largest change of camera speed (m/s^2) sampled at fps — the smoothness metric used in QA */
  roughness(fps = 30) {
    const dt = 1 / fps, P = [], o = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 0, roll: 0 };
    for (let t = this.start; t <= this.end; t += dt) { this.at(t, o); P.push(o.pos.clone()); }
    let worst = 0, worstT = 0, prev = null;
    for (let i = 1; i < P.length; i++) { const v = P[i].distanceTo(P[i - 1]) / dt; if (prev !== null) { const a = Math.abs(v - prev) / dt; if (a > worst) { worst = a; worstT = i * dt; } } prev = v; }
    return { worst, at: worstT };
  }
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
const _prev = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 45, roll: 0 };
/** screen-space motion-blur vector (uv units) from the camera's own movement over the last 1/30 s */
export function motionBlur(camera, path, t, out, { threshold = .03, max = .045 } = {}) {
  path.at(t - 1 / 30, _prev);
  _m.lookAt(_prev.pos, _prev.tgt, camera.up); _q.setFromRotationMatrix(_m);
  _v.set(0, 0, -10).applyQuaternion(_q).add(camera.position).project(camera);
  out.set(-_v.x * .5, -_v.y * .5);
  const m = out.length();
  if (m < threshold) out.set(0, 0);
  else out.multiplyScalar(Math.min(1, max / m) * Math.min(1, (m - threshold) / .04));
  return out;
}

/** shot helpers: produce keyframes */
export const shot = {
  /** straight dolly from a to b while looking at target(s) */
  dolly(t0, t1, from, to, tgtFrom, tgtTo, fov0, fov1 = fov0) {
    return [{ t: t0, pos: from, tgt: tgtFrom, fov: fov0 }, { t: t1, pos: to, tgt: tgtTo || tgtFrom, fov: fov1 }];
  },
  /** orbit around a centre: angles in radians (0 = +z), radius and height interpolate */
  orbit(t0, t1, centre, a0, a1, r0, r1, h0, h1, fov0, fov1 = fov0, steps = 3) {
    const keys = [];
    for (let i = 0; i <= steps; i++) {
      const k = i / steps, a = a0 + (a1 - a0) * k, r = r0 + (r1 - r0) * k, h = h0 + (h1 - h0) * k;
      keys.push({ t: t0 + (t1 - t0) * k, pos: new THREE.Vector3(centre.x + Math.sin(a) * r, centre.y + h, centre.z + Math.cos(a) * r), tgt: centre.clone(), fov: fov0 + (fov1 - fov0) * k });
    }
    return keys;
  },
};
