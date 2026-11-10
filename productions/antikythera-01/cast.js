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

/* =====================================================================
   Part 2: extra poses and characters
   ===================================================================== */
function lump(g, x, y, r, glow) {
  if (glow) { const a = g.createRadialGradient(x, y, r * .3, x, y, r * 2.1); a.addColorStop(0, 'rgba(255,200,80,.85)'); a.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = a; g.beginPath(); g.arc(x, y, r * 2.1, 0, 7); g.fill(); }
  blob(g, '#4fa58c', (g) => g.roundRect(x - r * 1.2, y - r * .8, r * 2.4, r * 1.6, r * .35), 8);
  g.fillStyle = 'rgba(30,90,80,.5)'; for (const [dx, dy] of [[-.7, -.3], [.6, .35], [-.2, .4], [.75, -.4]]) { g.beginPath(); g.ellipse(x + dx * r, y + dy * r, r * .2, r * .14, 0, 0, 7); g.fill(); }
  if (glow) { g.strokeStyle = '#ffd24a'; g.lineWidth = 7; g.beginPath(); g.arc(x, y, r * .42, 0, 7); g.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.beginPath(); g.moveTo(x + Math.cos(a) * r * .42, y + Math.sin(a) * r * .42); g.lineTo(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6); g.stroke(); } }
}
Object.assign(captainPoses, {
  skeptic: { armL: [-.9, 1.6], armR: [.9, -1.6], face: { eyes: 'half', brows: 'flat', mouth: 'flat', look: [.45, .2] } },
  hold: { armL: [-.5, 1.25], armR: [.5, -1.25], face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [0, .8] }, held: (g, L, R) => lump(g, (L[0] + R[0]) / 2, (L[1] + R[1]) / 2 - 8, 46, true) },
});
Object.assign(diverPoses, {
  babble: { armL: [-2.0, -1.0], armR: [1.9, 2.9], lean: .15, face: { eyes: 'wide', brows: 'worry', mouth: 'o', sweat: true, look: [-.5, 0] } },
  babble2: { armL: [-2.6, -2.9], armR: [1.2, .4], lean: -.1, face: { eyes: 'wide', brows: 'worry', mouth: 'teeth', sweat: true, look: [-.5, -.2] } },
  amazed: { armL: [-.4, -.1], armR: [.4, .1], lean: -.2, face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [-.8, .5] } },
});
// Nikos in full diving dress: the helmet covers the head, the face shows in the porthole
const diverSuit = { ...diver, hideMouth: true,
  drawHat(g, head, f) {
    blob(g, '#d0703a', (g) => g.ellipse(0, -4, head.rx * 1.2, head.ry * 1.22, 0, 0, 7), 10);
    blob(g, '#c7873a', (g) => g.roundRect(-head.rx * 1.05, head.ry * .86, head.rx * 2.1, 40, 14), 9);
    for (const s of [-1, 1]) blob(g, '#e3a83a', (g) => g.ellipse(s * head.rx * 1.12, 0, 16, 30, 0, 0, 7), 7);
    blob(g, '#e3a83a', (g) => g.ellipse(0, 4, head.rx * .7, head.ry * .7, 0, 0, 7), 10);
    blob(g, '#cdeef7', (g) => g.ellipse(0, 4, head.rx * .56, head.ry * .56, 0, 0, 7), 7);
    for (const s of [-1, 1]) { if (f.eyes === 'wide') { blob(g, '#fff', (g) => g.ellipse(s * 24, 0, 17, 20, 0, 0, 7), 5); g.fillStyle = INK; g.beginPath(); g.arc(s * 24, 2, 6, 0, 7); g.fill(); } else { g.fillStyle = INK; g.beginPath(); g.ellipse(s * 22, 0, 8, 12, 0, 0, 7); g.fill(); } }
    g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); if (f.eyes === 'wide') g.ellipse(0, 34, 9, 12, 0, 0, 7); else g.arc(0, 22, 16, .5, 2.6); g.stroke();
    blob(g, '#e3a83a', (g) => g.roundRect(-16, -head.ry * 1.36, 32, 26, 6), 7);
  } };
const suitPoses = {
  sink: { armL: [-2.7, -3.0], armR: [2.7, 3.0], legL: [-.25, .35], legR: [.3, -.25], face: { eyes: 'open' } },
  scared: { armL: [-1.3, -2.3], armR: [1.3, 2.3], crouch: .35, face: { eyes: 'wide' } },
  calm: { armL: [-.9, .9], armR: [2.2, 2.8], face: { eyes: 'open' } },
};
// Dr. Valerios, archaeologist (1902)
const scholar = { body: '#74803f', bodyW: 146, bodyH: 186, skin: SKIN, headRX: 100, headRY: 100, legL: 140, armL: 146,
  drawBody(g, { w, h }) { g.fillStyle = '#f6f1e4'; g.beginPath(); g.moveTo(-30, -h); g.lineTo(30, -h); g.lineTo(0, -h + 96); g.closePath(); g.fill();
    g.fillStyle = '#b8402e'; g.strokeStyle = INK; g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, -h + 34); g.lineTo(s * 30, -h + 18); g.lineTo(s * 30, -h + 52); g.closePath(); g.fill(); g.stroke(); }
    g.fillStyle = INK; for (const y of [-70, -36]) { g.beginPath(); g.arc(0, y, 5, 0, 7); g.fill(); } },
  drawFaceExtra(g, head) { g.strokeStyle = INK; g.lineWidth = 6; const ex = head.rx * .36, ey = -head.ry * .1; for (const s of [-1, 1]) { g.fillStyle = 'rgba(200,235,245,.35)'; g.beginPath(); g.arc(s * ex, ey, 27, 0, 7); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(-ex + 27, ey); g.lineTo(ex - 27, ey); g.stroke();
    blob(g, '#9a9a9a', (g) => { const y = head.ry * .3; g.moveTo(0, y - 4); g.quadraticCurveTo(26, y - 12, 38, y + 10); g.quadraticCurveTo(16, y + 8, 0, y + 6); g.quadraticCurveTo(-16, y + 8, -38, y + 10); g.quadraticCurveTo(-26, y - 12, 0, y - 4); }, 4); },
  drawHat(g, head) { for (const s of [-1, 1]) blob(g, '#a9a9a9', (g) => { g.ellipse(s * head.rx * .86, -head.ry * .3, 26, 44, s * .3, 0, 7); }, 7); } };
function magnifier(g, x, y, big) { g.strokeStyle = '#6a4526'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 6, y + 4); g.lineTo(x - 34, y - 44); g.stroke();
  blob(g, 'rgba(205,238,247,.9)', (g) => g.arc(x - 72, y - 86, 56, 0, 7), 10); g.strokeStyle = '#e3a83a'; g.lineWidth = 8; g.beginPath(); g.arc(x - 72, y - 86, 56, 0, 7); g.stroke();
  if (big) { g.strokeStyle = '#d9a441'; g.lineWidth = 8; g.beginPath(); g.arc(x - 72, y - 86, 24, 0, 7); g.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.beginPath(); g.moveTo(x - 72 + Math.cos(a) * 24, y - 86 + Math.sin(a) * 24); g.lineTo(x - 72 + Math.cos(a) * 36, y - 86 + Math.sin(a) * 36); g.stroke(); } } }
const scholarPoses = {
  look: { armL: [-.3, -.1], armR: [.4, -2.5], face: { eyes: 'half', brows: 'flat', mouth: 'flat', look: [-.5, .5] } },
  lean: { armL: [-1.25, -1.2], armR: [.9, -1.2], lean: -.6, face: { eyes: 'open', brows: 'up', mouth: 'flat', look: [-.8, .6] }, held: (g, L) => magnifier(g, L[0], L[1], false) },
  spot: { armL: [-1.25, -1.2], armR: [2.0, 2.8], lean: -.6, face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [-.8, .6], sweat: true }, held: (g, L) => magnifier(g, L[0], L[1], true) },
};
// Philon, the ancient craftsman
const smith = { body: '#f3ecdc', bodyW: 150, bodyH: 190, skin: '#f3dcc0', headRX: 102, headRY: 100, legL: 140, armL: 148, hideMouth: true,
  drawBody(g, { w, h }) { g.fillStyle = '#2a6fc0'; g.fillRect(-w, -18, w * 2, 16); g.save(); g.rotate(-.5); g.fillRect(-w, -h * .62, w * 3, 20); g.restore(); },
  drawFaceExtra(g, head, f) { blob(g, '#f6f6f2', (g) => { const y = head.ry * .22; g.moveTo(-head.rx * .86, y - 30); g.quadraticCurveTo(-head.rx * .5, y + 4, 0, y); g.quadraticCurveTo(head.rx * .5, y + 4, head.rx * .86, y - 30);
      g.bezierCurveTo(head.rx * .95, head.ry * 1.1, head.rx * .3, head.ry * 1.55, 0, head.ry * 1.6); g.bezierCurveTo(-head.rx * .3, head.ry * 1.55, -head.rx * .95, head.ry * 1.1, -head.rx * .86, y - 30); }, 8);
    const my = head.ry * .58; if (f.mouth === 'o' || f.mouth === 'teeth') blob(g, '#5a2630', (g) => g.ellipse(0, my, 15, f.mouth === 'o' ? 18 : 10, 0, 0, 7), 6); else { g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(0, my - 12, 20, .5, 2.64); g.stroke(); } },
  drawHat(g, head) { for (const s of [-1, 1]) blob(g, '#f6f6f2', (g) => g.ellipse(s * head.rx * .8, -head.ry * .45, 30, 40, s * .4, 0, 7), 7);
    blob(g, '#2a6fc0', (g) => { g.moveTo(-head.rx * .98, -head.ry * .42); g.quadraticCurveTo(0, -head.ry * .78, head.rx * .98, -head.ry * .42); g.lineTo(head.rx * .95, -head.ry * .26); g.quadraticCurveTo(0, -head.ry * .6, -head.rx * .95, -head.ry * .26); }, 6); } };
const smithPoses = {
  file: { lean: -.45, armL: [-1.25, -1.45], armR: [-.5, -1.25], face: { eyes: 'half', brows: 'angry', look: [-.6, .7] }, held: (g, L, R) => { line(g, [[R[0] + 16, R[1] + 8], [L[0] - 70, L[1] - 20]], 15); g.strokeStyle = '#9aa3ad'; g.lineWidth = 7; g.beginPath(); g.moveTo(R[0] + 10, R[1] + 6); g.lineTo(L[0] - 66, L[1] - 19); g.stroke(); } },
  file2: { lean: -.5, armL: [-1.35, -1.6], armR: [-.75, -1.45], face: { eyes: 'half', brows: 'angry', look: [-.6, .7] }, held: (g, L, R) => { line(g, [[R[0] + 16, R[1] + 8], [L[0] - 70, L[1] - 20]], 15); g.strokeStyle = '#9aa3ad'; g.lineWidth = 7; g.beginPath(); g.moveTo(R[0] + 10, R[1] + 6); g.lineTo(L[0] - 66, L[1] - 19); g.stroke(); } },
  crank: { lean: -.35, armL: [-1.3, -1.3], armR: [.9, -1.2], face: { eyes: 'happy', brows: 'up', mouth: 'smile', look: [-.6, .5] } },
  point: { armL: [-.3, -.1], armR: [2.5, 2.9], face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [.3, -1] } },
  ready: { armL: [-.6, 1.2], armR: [2.4, 2.9], face: { eyes: 'open', brows: 'up', mouth: 'smile', look: [-.5, .7] }, held: (g, L, R) => { blob(g, '#d9a441', (g) => g.roundRect(L[0] - 34, L[1] - 30, 62, 70, 8), 7); g.strokeStyle = '#6b4a14'; g.lineWidth = 5; g.beginPath(); g.arc(L[0] - 3, L[1] + 4, 20, 0, 7); g.stroke();
      line(g, [[R[0], R[1] + 12], [R[0] + 8, R[1] - 110]], 9); blob(g, '#d23b2e', (g) => { g.moveTo(R[0] + 8, R[1] - 110); g.lineTo(R[0] + 92, R[1] - 84); g.lineTo(R[0] + 8, R[1] - 56); }, 7); } },
  go: { lean: .2, armL: [-.6, 1.2], armR: [1.35, 1.0], face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [.4, 0] }, held: (g, L, R) => { blob(g, '#d9a441', (g) => g.roundRect(L[0] - 34, L[1] - 30, 62, 70, 8), 7);
      line(g, [[R[0] - 8, R[1]], [R[0] + 96, R[1] + 30]], 9); blob(g, '#d23b2e', (g) => { g.moveTo(R[0] + 96, R[1] + 30); g.lineTo(R[0] + 66, R[1] + 110); g.lineTo(R[0] + 44, R[1] + 16); }, 7); } },
};
// two scientists (2005)
const coat = (g, { w, h }) => { g.fillStyle = '#5aa0d8'; g.beginPath(); g.moveTo(-26, -h); g.lineTo(26, -h); g.lineTo(0, -h + 80); g.closePath(); g.fill(); g.strokeStyle = 'rgba(90,110,130,.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -h + 6); g.lineTo(0, -h + 84); g.lineTo(30, -h + 6); g.moveTo(0, -h + 84); g.lineTo(0, 20); g.stroke();
  g.strokeRect(22, -h * .5, 34, 30); g.fillStyle = '#d23b2e'; g.fillRect(30, -h * .5 - 12, 6, 16); g.fillStyle = '#1f62ad'; g.fillRect(42, -h * .5 - 12, 6, 16); };
const sciA = { body: '#f4f6f8', bodyW: 142, bodyH: 184, skin: SKIN, headRX: 100, headRY: 98, legL: 140, armL: 146, drawBody: coat,
  drawFaceExtra(g, head) { g.strokeStyle = INK; g.lineWidth = 6; const ex = head.rx * .36, ey = -head.ry * .1; for (const s of [-1, 1]) g.strokeRect(s * ex - 26, ey - 20, 52, 40); g.beginPath(); g.moveTo(-ex + 26, ey); g.lineTo(ex - 26, ey); g.stroke(); },
  drawHat(g, head) { blob(g, '#2b2530', (g) => { g.moveTo(-head.rx * 1.02, head.ry * .35); g.bezierCurveTo(-head.rx * 1.25, -head.ry * 1.25, head.rx * 1.25, -head.ry * 1.25, head.rx * 1.02, head.ry * .35); g.lineTo(head.rx * .78, head.ry * .3);
      g.bezierCurveTo(head.rx * .8, -head.ry * .5, head.rx * .2, -head.ry * .62, -head.rx * .1, -head.ry * .56); g.bezierCurveTo(-head.rx * .6, -head.ry * .5, -head.rx * .8, -head.ry * .2, -head.rx * .78, head.ry * .3); }, 8); } };
const sciB = { body: '#f4f6f8', bodyW: 150, bodyH: 190, skin: SKIN, headRX: 104, headRY: 100, legL: 150, armL: 150, drawBody: coat,
  drawFaceExtra(g, head) { blob(g, '#d9762e', (g) => { const y = head.ry * .34; g.moveTo(-head.rx * .8, y - 24); g.quadraticCurveTo(0, y + 14, head.rx * .8, y - 24); g.bezierCurveTo(head.rx * .8, head.ry * 1.0, head.rx * .2, head.ry * 1.16, 0, head.ry * 1.16); g.bezierCurveTo(-head.rx * .2, head.ry * 1.16, -head.rx * .8, head.ry * 1.0, -head.rx * .8, y - 24); }, 7); },
  drawHat(g, head) { blob(g, '#d9762e', (g) => { g.moveTo(-head.rx * .95, -head.ry * .3); for (let i = 0; i <= 5; i++) { const a = Math.PI + i / 5 * Math.PI; g.arc(Math.cos(a) * head.rx * .7, -head.ry * .55 + Math.sin(a) * head.ry * .3, 26, a - 1.2, a + 1.2); } g.lineTo(head.rx * .95, -head.ry * .3); g.quadraticCurveTo(0, -head.ry * .55, -head.rx * .95, -head.ry * .3); }, 7); } };
const sciPoses = {
  guide: { armL: [-2.4, -2.8], armR: [1.4, .7], face: { eyes: 'open', brows: 'up', mouth: 'o', look: [-.7, 0] } },
  guide2: { armL: [-1.6, -2.2], armR: [2.2, 2.7], face: { eyes: 'open', brows: 'up', mouth: 'o', look: [-.7, 0] } },
  watch: { armL: [-.9, 1.5], armR: [.9, -1.5], face: { eyes: 'open', brows: 'flat', mouth: 'smile', look: [-.5, .3] } },
  stun: { armL: [-2.3, -2.8], armR: [2.3, 2.8], face: { eyes: 'wide', brows: 'up', mouth: 'o', look: [-.3, .5], sweat: true } },
  stun2: { armL: [-.4, -2.6], armR: [.4, 2.6], face: { eyes: 'wide', brows: 'up', mouth: 'teeth', look: [.3, .5] } },
};
// runners
const runner = (c) => ({ body: c, bodyW: 120, bodyH: 160, skin: '#f3dcc0', headRX: 86, headRY: 84, legL: 170, armL: 140,
  drawHat(g, head) { blob(g, '#fff', (g) => { g.moveTo(-head.rx, -head.ry * .42); g.quadraticCurveTo(0, -head.ry * .75, head.rx, -head.ry * .42); g.lineTo(head.rx * .97, -head.ry * .24); g.quadraticCurveTo(0, -head.ry * .58, -head.rx * .97, -head.ry * .24); }, 6); } });
const runPoses = {
  ready: { lean: .6, crouch: .55, armL: [-.5, .9], armR: [.9, .3], face: { eyes: 'open', brows: 'angry', mouth: 'flat' } },
  run1: { lean: .5, armL: [1.3, 2.3], armR: [-1.2, -.3], legL: [1.0, -.5], legR: [-.8, -1.5], face: { eyes: 'wide', brows: 'angry', mouth: 'teeth' } },
  run2: { lean: .5, armL: [-1.2, -.3], armR: [1.3, 2.3], legL: [-.8, -1.5], legR: [1.0, -.5], face: { eyes: 'wide', brows: 'angry', mouth: 'teeth' } },
};

export function buildCast() {
  const cap = new ToonActor(captain, captainPoses, { height: 1.62 });
  const niko = new ToonActor(diver, diverPoses, { height: 1.55 });
  const fish = new ToonActor({}, { curious: {}, shock: { shock: true } }, { height: .17, draw: drawFish, canvas: [512, 384], footY: 192 });
  fish.bobHz = .9; fish.bobAmp = .04; niko.phase = .37;
  const suit = new ToonActor(diverSuit, suitPoses, { height: 1.6 }); suit.bobHz = .7; suit.bobAmp = .05;
  const doc = new ToonActor(scholar, scholarPoses, { height: 1.58 });
  const philon = new ToonActor(smith, smithPoses, { height: 1.6 });
  const sA = new ToonActor(sciA, sciPoses, { height: 1.55 }), sB = new ToonActor(sciB, sciPoses, { height: 1.62 }); sB.phase = .5;
  const runners = ['#d23b2e', '#2a6fc0', '#3f9c58'].map((c, i) => { const r = new ToonActor(runner(c), runPoses, { height: 1.55 }); r.phase = i * .3; r.bobAmp = 0; return r; });
  return { cap, niko, fish, suit, doc, philon, sA, sB, runners };
}
