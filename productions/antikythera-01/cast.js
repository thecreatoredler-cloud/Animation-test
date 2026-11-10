// Original characters for "The Ancient Computer Found Underwater".
// Captain Stavros (navy cap, moustache, striped shirt), Nikos the sponge diver (canvas suit,
// red neckerchief, curls) and a small startled fish. Poses are drawn once each (lib/toon.js).
import { ToonActor, drawHelpers, INK } from '../../lib/toon.js';
const { line, blob } = drawHelpers;

const SKIN = '#f8f1e2';

/* ---------- Captain Stavros ---------- */
const captain = {
  body: '#f3ecdc', bodyW: 150, bodyH: 190, skin: SKIN, headRX: 108, headRY: 100, legL: 150, armL: 150,
  drawBody(g, { w, h }) { g.fillStyle = '#24467e'; for (let y = -h; y < 20; y += 34) g.fillRect(-w, y, w * 2, 16); },
  drawFaceExtra(g, head) {                       // big moustache
    blob(g, '#2a2024', (g) => { const y = head.ry * .3; g.moveTo(0, y - 6); g.bezierCurveTo(30, y - 22, 66, y - 6, 74, y + 20); g.bezierCurveTo(48, y + 12, 22, y + 22, 0, y + 10);
      g.bezierCurveTo(-22, y + 22, -48, y + 12, -74, y + 20); g.bezierCurveTo(-66, y - 6, -30, y - 22, 0, y - 6); }, 5);
  },
  drawHat(g, head) {                             // Greek fisherman's cap
    const y = -head.ry * .62;
    blob(g, '#1c2f57', (g) => { g.moveTo(-head.rx * .86, y); g.bezierCurveTo(-head.rx * .95, y - 78, head.rx * .95, y - 78, head.rx * .86, y); g.lineTo(-head.rx * .86, y); }, 9);
    blob(g, '#101c36', (g) => { g.moveTo(-head.rx * .9, y - 2); g.lineTo(head.rx * .9, y - 2); g.lineTo(head.rx * .9, y + 22); g.lineTo(-head.rx * .9, y + 22); }, 8);
    blob(g, '#0c1528', (g) => { g.moveTo(-head.rx * .1, y + 20); g.quadraticCurveTo(head.rx * .7, y + 20, head.rx * 1.18, y + 44); g.quadraticCurveTo(head.rx * .5, y + 50, -head.rx * .1, y + 22); }, 7);
    g.strokeStyle = '#e8b83a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-head.rx * .7, y + 10); g.quadraticCurveTo(0, y + 2, head.rx * .7, y + 10); g.stroke();
  },
};
const captainPoses = {
  proud: { armL: [-1.0, .95], armR: [1.0, -.95], face: { eyes: 'happy', brows: 'up', mouth: 'grin', look: [.35, 0] } },
  alarm: { armL: [-.35, -.1], armR: [2.2, 2.75], lean: -.25, face: { eyes: 'wide', brows: 'worry', mouth: 'o', look: [.5, -.9] } },
  panic: { armL: [-2.3, -2.9], armR: [2.3, 2.9], crouch: .3, hatUp: 40, headDY: 8, face: { eyes: 'wide', brows: 'worry', mouth: 'teeth', look: [.2, -.5], sweat: true } },
};

/* ---------- Nikos the diver ---------- */
function sponge(g, x, y, r) {
  blob(g, '#e9b93c', (g) => { for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = r * (1 + .1 * Math.sin(a * 6 + 1)); const px = x + Math.cos(a) * rr * 1.2, py = y + Math.sin(a) * rr * .9; i ? g.lineTo(px, py) : g.moveTo(px, py); } }, 7);
  g.fillStyle = '#b9862a'; for (const [dx, dy, s] of [[-.4, -.2, .16], [.3, .1, .2], [-.1, .35, .13], [.5, -.35, .12], [-.6, .25, .1], [.05, -.4, .11]]) { g.beginPath(); g.ellipse(x + dx * r, y + dy * r, s * r, s * r * .8, 0, 0, 7); g.fill(); }
}
const diver = {
  body: '#e9dfc4', bodyW: 142, bodyH: 180, skin: SKIN, headRX: 100, headRY: 98, legL: 140, armL: 146,
  drawBody(g, { w, h }) {
    g.strokeStyle = 'rgba(120,100,70,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -h); g.lineTo(0, 20); g.stroke();                    // suit seam
    g.fillStyle = '#c7873a'; g.fillRect(-w, -h + 2, w * 2, 26); g.fillStyle = '#8a5a22'; for (let x = -w; x < w; x += 26) { g.beginPath(); g.arc(x, -h + 15, 5, 0, 7); g.fill(); }   // brass collar
    g.fillStyle = '#d23b2e'; g.beginPath(); g.moveTo(-34, -h + 26); g.lineTo(34, -h + 26); g.lineTo(0, -h + 74); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();   // neckerchief
  },
  drawHat(g, head) {                              // curly hair
    blob(g, '#6b3f22', (g) => { const y = -head.ry * .5; g.moveTo(-head.rx * .92, y + 14);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI, cx = Math.cos(a) * head.rx * .8, cy = y + Math.sin(a) * head.ry * .46; g.arc(cx, cy, 30, a - 1.3, a + 1.3); }
      g.lineTo(head.rx * .92, y + 14); g.quadraticCurveTo(0, y - 6, -head.rx * .92, y + 14); }, 8);
  },
};
const diverPoses = {
  show: { armL: [-1.0, .95], armR: [2.45, 2.95], face: { eyes: 'happy', brows: 'up', mouth: 'grin', look: [-.3, -.1] }, held: (g, L, R) => sponge(g, R[0] + 6, R[1] - 34, 50) },
  alarm: { armL: [-.3, -.1], armR: [1.1, 1.9], lean: .2, face: { eyes: 'wide', brows: 'worry', mouth: 'flat', look: [-.4, -.9] }, held: (g, L, R) => sponge(g, R[0] + 10, R[1] - 6, 46) },
  duck: { armL: [-2.2, -2.85], armR: [2.2, 2.85], crouch: .75, headDY: 22, face: { eyes: 'squint', brows: 'worry', mouth: 'teeth', sweat: true }, held: (g, L, R, head) => sponge(g, head.x, head.y - head.ry - 34, 84) },
};

/* ---------- the fish (own drawing routine, 512 x 384 canvas, centred) ---------- */
function drawFish(g, D, pose) {
  const cx = 250, cy = 200;
  blob(g, '#ffd447', (g) => { g.moveTo(cx - 120, cy); g.lineTo(cx - 200, cy - 62); g.quadraticCurveTo(cx - 170, cy, cx - 200, cy + 62); }, 8);          // tail
  blob(g, '#ffd447', (g) => { g.moveTo(cx - 30, cy - 78); g.quadraticCurveTo(cx - 10, cy - 138, cx + 50, cy - 84); }, 8);                                     // top fin
  blob(g, '#e7528a', (g) => { g.ellipse(cx, cy, 132, 86, 0, 0, 7); }, 10);
  g.save(); g.beginPath(); g.ellipse(cx, cy, 126, 80, 0, 0, 7); g.clip();
  g.fillStyle = '#f7a3c4'; g.beginPath(); g.ellipse(cx + 10, cy + 60, 130, 50, 0, 0, 7); g.fill();                                                           // pale belly
  g.fillStyle = 'rgba(120,20,70,.25)'; for (const x of [-60, -20]) g.fillRect(cx + x, cy - 90, 14, 180); g.restore();
  blob(g, '#ffd447', (g) => { g.moveTo(cx - 8, cy + 26); g.quadraticCurveTo(cx - 50, cy + 70, cx - 2, cy + 62); }, 7);                                        // side fin
  const ex = cx + 62, ey = cy - 18, wide = pose.shock;
  blob(g, '#fff', (g) => g.ellipse(ex, ey, wide ? 36 : 28, wide ? 40 : 28, 0, 0, 7), 7);
  g.fillStyle = INK; g.beginPath(); g.arc(ex + (wide ? 4 : 10), ey + (wide ? 0 : 4), wide ? 9 : 13, 0, 7); g.fill();
  if (!wide) { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(ex - 30, ey - 12); g.lineTo(ex + 30, ey - 16); g.stroke(); }
  if (wide) blob(g, '#5a2630', (g) => g.ellipse(cx + 112, cy + 26, 13, 17, 0, 0, 7), 7);
  else { g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.arc(cx + 100, cy + 14, 20, .4, 1.7); g.stroke(); }
  if (wide) {                                                                                                                                              // surprise marks
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.lineCap = 'round';
    for (const [a, r0, r1] of [[-1.9, 150, 186], [-1.45, 138, 180], [-1.0, 150, 186]]) { g.beginPath(); g.moveTo(cx + 40 + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .8); g.lineTo(cx + 40 + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .8); g.stroke(); }
  }
}

export function buildCast() {
  const cap = new ToonActor(captain, captainPoses, { height: 1.62 });
  const niko = new ToonActor(diver, diverPoses, { height: 1.55 });
  const fish = new ToonActor({}, { curious: {}, shock: { shock: true } }, { height: .17, draw: drawFish, canvas: [512, 384], footY: 192 });
  fish.bobHz = .9; fish.bobAmp = .04; niko.phase = .37;
  return { cap, niko, fish };
}
