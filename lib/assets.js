// Loading optimised GLB props (assets/polyhaven/*.glb) and texture sets.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();
const texLoader = new THREE.TextureLoader();

/** load a GLB once; returns a fresh clone each call (materials shared, hierarchy kept) */
export async function prop(url, { castShadow = true, receiveShadow = true, envIntensity = .35 } = {}) {
  if (!cache.has(url)) cache.set(url, loader.loadAsync(url).then(g => {
    g.scene.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = castShadow; o.receiveShadow = receiveShadow;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) { if ('envMapIntensity' in m) m.envMapIntensity = envIntensity; if (m.map) m.map.anisotropy = 4; }
    });
    return g.scene;
  }));
  const base = await cache.get(url);
  return base.clone(true);
}
/** find a named node inside a loaded prop */
export function node(root, name) { let f = null; root.traverse(o => { if (!f && o.name === name) f = o; }); return f; }

/** PBR material from a Poly Haven texture set saved as <id>_diff/_nor/_arm.webp */
export function pbr(base, id, { repeat = [1, 1], color = 0xffffff, normalScale = 1 } = {}) {
  const load = (suffix, srgb) => { const t = texLoader.load(`${base}/${id}_${suffix}.webp`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const arm = load('arm', false);
  return new THREE.MeshStandardMaterial({ color, map: load('diff', true), normalMap: load('nor', false), normalScale: new THREE.Vector2(normalScale, normalScale),
    roughnessMap: arm, metalnessMap: arm, aoMap: arm, metalness: 1, roughness: 1, envMapIntensity: .3 });
}
/** planes need a second uv set for aoMap in three r160 */
export function withAoUv(geo) { geo.setAttribute('uv2', geo.attributes.uv); geo.setAttribute('uv1', geo.attributes.uv); return geo; }
