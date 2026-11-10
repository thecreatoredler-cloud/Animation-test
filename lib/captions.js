// Captions in the reference style (STYLE_GUIDE.md section 8.6): one or two words per card,
// hard swap at full size (no pop), white heavy rounded type with a black stroke and soft shadow,
// centred at 70% of the frame height. Drawn in WebGL on top of the finished frame, so they
// are part of the canvas (and of exported MP4s).
import * as THREE from 'three';

export async function loadFont(family, url, weight = '700') {
  try { const f = new FontFace(family, `url(${url})`, { weight }); await f.load(); document.fonts.add(f); } catch (e) { console.warn('caption font failed to load, using fallback'); }
}

export class Captions {
  /** cards: [{ t, text }] sorted by t; end: time the last card disappears */
  constructor(cards, { end, family = 'Fredoka', y = .70, size = .044 } = {}) {
    this.cards = cards; this.end = end;
    this.scene = new THREE.Scene(); this.camera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 0, 1);
    const W = 1024, H = 200, frameH = W / .95 * 16 / 9, px = Math.round(size * frameH);   // card spans 95% of the frame width
    this.tex = cards.map(c => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
      g.font = `700 ${px}px "${family}", "Arial Rounded MT Bold", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineWidth = px * .2; g.strokeStyle = '#000';
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = px * .1; g.shadowOffsetY = px * .07;
      g.strokeText(c.text, W / 2, H / 2);
      g.shadowColor = 'transparent'; g.fillStyle = '#fff'; g.fillText(c.text, W / 2, H / 2);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(.95, .95 * H / W * 9 / 16),
      new THREE.MeshBasicMaterial({ map: this.tex[0], transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.position.set(0, .5 - y, -.5); this.scene.add(this.mesh);
  }
  update(t) {
    let i = -1; for (let k = 0; k < this.cards.length; k++) if (this.cards[k].t <= t + 1e-4) i = k;
    this.mesh.visible = i >= 0 && t < this.end;
    if (i >= 0 && this.mesh.material.map !== this.tex[i]) this.mesh.material.map = this.tex[i];
  }
}
