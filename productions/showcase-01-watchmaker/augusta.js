// "Augusta Penn" — original character artwork as layered SVG (rasterised by lib/character.js).
import { rasterSVG } from '../../lib/character.js';

const INK = '#1d1418', SKIN = '#f3d2b5', SKIN_D = '#e2b796', HAIR = '#cfd2da', HAIR_D = '#a3a8b4';
const TEAL = '#2f8f8a', TEAL_D = '#1f6a66', LEATHER = '#8a5531', LEATHER_D = '#6b3f22', SHIRT = '#f7f2e8', MUSTARD = '#e3a52c', BRASS = '#cfa547';
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const S = `stroke="${INK}" stroke-linejoin="round" stroke-linecap="round"`;

const HEAD = svg(512, 512, `
  <g ${S} stroke-width="13">
    <path d="M68 268 C58 128 160 56 256 56 C352 56 454 128 444 268 C440 316 414 336 392 340 L120 340 C98 336 72 316 68 268 Z" fill="${HAIR_D}"/>
    <ellipse cx="78" cy="300" rx="26" ry="38" fill="${SKIN}"/><ellipse cx="434" cy="300" rx="26" ry="38" fill="${SKIN}"/>
    <circle cx="256" cy="288" r="180" fill="${SKIN}"/>
    <path d="M86 262 C82 150 168 96 256 96 C344 96 430 150 426 262 C404 214 368 186 328 178 C310 204 270 214 236 202 C204 222 156 222 124 212 C108 230 94 246 86 262 Z" fill="${HAIR}"/>
  </g>
  <g stroke="${HAIR_D}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9">
    <path d="M150 140 C190 118 238 112 280 118"/><path d="M128 176 C170 150 214 146 250 150"/><path d="M300 138 C340 146 380 170 404 206"/><path d="M280 160 C320 168 356 186 384 214"/>
  </g>
  <path d="M110 300 C120 286 132 282 146 284" stroke="${SKIN_D}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M402 300 C392 286 380 282 366 284" stroke="${SKIN_D}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="160" cy="356" rx="36" ry="19" fill="#f07f86" opacity=".42"/><ellipse cx="352" cy="356" rx="36" ry="19" fill="#f07f86" opacity=".42"/>
  <path d="M246 318 C232 346 244 362 268 356" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M188 410 C200 420 214 424 228 424 M326 410 C314 420 300 424 286 424" stroke="${SKIN_D}" stroke-width="6" fill="none" stroke-linecap="round"/>
`);
const BUN = svg(220, 220, `
  <g transform="rotate(-18 110 110)"><rect x="28" y="96" width="170" height="16" rx="6" fill="#f2c230" ${S} stroke-width="7"/><rect x="180" y="96" width="24" height="16" rx="6" fill="#f08aa0" ${S} stroke-width="7"/><path d="M28 96 L4 104 L28 112 Z" fill="#e8c9a0" ${S} stroke-width="6"/></g>
  <circle cx="110" cy="118" r="70" fill="${HAIR}" ${S} stroke-width="12"/>
  <path d="M60 118 C64 80 120 62 150 92 C170 116 150 156 116 152 C90 148 88 118 108 110" stroke="${HAIR_D}" stroke-width="7" fill="none" stroke-linecap="round"/>
`);
const EYE_WHITE = svg(120, 130, `<ellipse cx="60" cy="65" rx="42" ry="50" fill="#ffffff" ${S} stroke-width="8"/>`);
const PUPIL = svg(48, 48, `<circle cx="24" cy="24" r="18" fill="${INK}"/><circle cx="31" cy="16" r="6" fill="#ffffff"/>`);
const LID = svg(120, 130, `<ellipse cx="60" cy="65" rx="45" ry="53" fill="${SKIN}"/><path d="M14 64 C30 116 90 116 106 64" fill="none" ${S} stroke-width="10"/><path d="M15 64 C20 10 100 10 105 64" fill="none" ${S} stroke-width="8"/>`);
const BROW = svg(140, 60, `<path d="M14 42 C40 14 96 10 128 30" fill="none" stroke="${HAIR_D}" stroke-width="20" stroke-linecap="round"/><path d="M14 42 C40 14 96 10 128 30" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".35"/>`);
const mouth = (inner) => svg(180, 120, inner);
const MOUTHS = {
  smile: mouth(`<path d="M42 52 C70 84 112 84 138 52" fill="none" ${S} stroke-width="11"/>`),
  flat: mouth(`<path d="M52 62 C80 68 104 68 128 60" fill="none" ${S} stroke-width="11"/>`),
  tongue: mouth(`<path d="M50 58 C80 66 108 64 132 56" fill="none" ${S} stroke-width="11"/><path d="M112 60 C112 84 138 84 138 60" fill="#f27a8c" ${S} stroke-width="7"/>`),
  o: mouth(`<ellipse cx="90" cy="62" rx="22" ry="28" fill="#5a1f2b" ${S} stroke-width="10"/><ellipse cx="90" cy="76" rx="12" ry="8" fill="#f27a8c"/>`),
  grin: mouth(`<path d="M30 40 C40 112 140 112 150 40 Z" fill="#5a1f2b" ${S} stroke-width="10"/><path d="M38 44 L142 44 L138 60 L42 60 Z" fill="#ffffff"/><ellipse cx="90" cy="88" rx="26" ry="12" fill="#f27a8c"/><path d="M30 40 C40 112 140 112 150 40 Z" fill="none" ${S} stroke-width="10"/>`),
  bite: mouth(`<path d="M46 56 C76 74 110 72 134 52" fill="none" ${S} stroke-width="11"/><rect x="76" y="58" width="22" height="12" rx="3" fill="#ffffff" ${S} stroke-width="5"/>`),
};
const GLASSES = svg(512, 512, `
  <g fill="none" stroke="#4a2a1a" stroke-width="11" stroke-linecap="round">
    <circle cx="196" cy="294" r="62"/><circle cx="316" cy="294" r="62"/><path d="M252 288 C254 278 258 278 260 288"/><path d="M134 288 L88 270"/><path d="M378 288 L424 270"/>
  </g>
  <path d="M164 262 L184 252 M338 258 L356 248" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
`);
// loupe: brass eyepiece on a hinge; the lens shows Augusta's eye, magnified
const LOUPE = svg(160, 200, `
  <rect x="64" y="0" width="32" height="40" rx="10" fill="${BRASS}" ${S} stroke-width="7"/>
  <circle cx="80" cy="112" r="72" fill="${BRASS}" ${S} stroke-width="10"/>
  <circle cx="80" cy="112" r="56" fill="#ffffff" ${S} stroke-width="6"/>
  <ellipse cx="86" cy="118" rx="26" ry="30" fill="${INK}"/><circle cx="98" cy="102" r="9" fill="#ffffff"/>
  <path d="M32 92 C40 70 60 58 80 56" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M30 150 L130 150" stroke="${INK}" stroke-width="0"/>
`);
const TORSO = svg(320, 340, `
  <g ${S} stroke-width="11">
    <path d="M86 30 C120 14 200 14 234 30 C290 56 304 220 282 300 L38 300 C16 220 30 56 86 30 Z" fill="${TEAL}"/>
    <path d="M128 22 L160 74 L192 22 Z" fill="${SHIRT}" stroke-width="8"/>
    <path d="M128 22 L112 54 L150 64 Z M192 22 L208 54 L170 64 Z" fill="${SHIRT}" stroke-width="7"/>
    <path d="M136 50 L160 62 L136 74 Z M184 50 L160 62 L184 74 Z" fill="${MUSTARD}" stroke-width="7"/><circle cx="160" cy="62" r="8" fill="${MUSTARD}" stroke-width="6"/>
    <path d="M70 140 C110 128 210 128 250 140 L262 300 L58 300 Z" fill="${LEATHER}"/>
  </g>
  <path d="M90 140 L110 34 M230 140 L210 34" stroke="${LEATHER_D}" stroke-width="12" stroke-linecap="round"/>
  <path d="M90 140 L110 34 M230 140 L210 34" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
  <rect x="112" y="186" width="96" height="62" rx="8" fill="${LEATHER_D}" ${S} stroke-width="6"/>
  <rect x="122" y="168" width="10" height="44" rx="3" fill="#d63b2f" ${S} stroke-width="4"/><rect x="140" y="160" width="8" height="52" rx="3" fill="#f2c230" ${S} stroke-width="4"/><rect x="186" y="172" width="8" height="40" rx="2" fill="#9aa3ad" ${S} stroke-width="4"/>
  <path d="M74 150 C110 140 210 140 246 150 M70 286 L250 286" stroke="#f0c9a0" stroke-width="3" stroke-dasharray="8 7" fill="none" opacity=".7"/>
  <path d="M208 196 C236 210 240 236 226 252" stroke="#e6c35c" stroke-width="4" fill="none" stroke-dasharray="3 4"/>
  <circle cx="98" cy="104" r="7" fill="#e6c35c" ${S} stroke-width="4"/><circle cx="222" cy="104" r="7" fill="#e6c35c" ${S} stroke-width="4"/>
  <rect x="32" y="292" width="256" height="44" rx="14" fill="#4a3a5c" ${S} stroke-width="10"/>
`);
const UPPER = svg(90, 200, `<path d="M14 10 C14 2 76 2 76 10 L68 186 C66 196 24 196 22 186 Z" fill="${TEAL}" ${S} stroke-width="9"/><path d="M20 150 L70 150 L69 168 L21 168 Z" fill="#d63b2f" ${S} stroke-width="6"/><path d="M24 40 C40 50 56 50 68 40" stroke="${TEAL_D}" stroke-width="5" fill="none"/>`);
const FORE = svg(90, 220, `<path d="M45 30 L45 214" ${S} stroke-width="17"/><path d="M14 8 C14 0 76 0 76 8 L72 44 C70 54 20 54 18 44 Z" fill="${TEAL_D}" ${S} stroke-width="8"/>`);
const hand = (inner) => svg(160, 160, `<g ${S} stroke-width="8" fill="${SKIN}">${inner}</g>`);
const HANDS = {
  open: hand(`<path d="M80 10 L80 34" stroke-width="15"/><ellipse cx="80" cy="76" rx="40" ry="38"/><ellipse cx="50" cy="118" rx="12" ry="26" transform="rotate(14 50 118)"/><ellipse cx="72" cy="128" rx="12" ry="28"/><ellipse cx="96" cy="126" rx="12" ry="27"/><ellipse cx="116" cy="112" rx="11" ry="22" transform="rotate(-16 116 112)"/><ellipse cx="38" cy="76" rx="12" ry="24" transform="rotate(40 38 76)"/>`),
  pinch: hand(`<path d="M80 10 L80 34" stroke-width="15"/><circle cx="80" cy="74" r="40"/><path d="M60 100 C56 130 70 148 82 150 C92 148 94 136 90 122" /><path d="M104 96 C112 120 102 146 86 150"/><path d="M58 70 C70 80 96 80 108 70" fill="none" stroke-width="5"/>`),
  grip: hand(`<path d="M80 10 L80 34" stroke-width="15"/><circle cx="80" cy="82" r="44"/><path d="M48 88 C60 98 100 98 112 88 M50 106 C62 116 98 116 110 106" fill="none" stroke-width="6"/><ellipse cx="40" cy="70" rx="14" ry="24" transform="rotate(30 40 70)"/>`),
  point: hand(`<path d="M80 10 L80 34" stroke-width="15"/><circle cx="80" cy="76" r="40"/><ellipse cx="82" cy="134" rx="12" ry="28"/><path d="M52 92 C64 100 100 100 110 92" fill="none" stroke-width="6"/>`),
};
const THIGH = svg(90, 180, `<path d="M8 6 L82 6 L76 176 L14 176 Z" fill="#4a3a5c" ${S} stroke-width="9"/>`);
const SHIN = svg(110, 200, `<path d="M55 6 L55 156" stroke="#5a4a40" stroke-width="18" stroke-linecap="round"/><path d="M55 6 L55 156" ${S} stroke-width="4" opacity=".6"/><path d="M30 156 C30 140 96 140 104 166 C106 182 30 188 24 176 C20 168 24 160 30 156 Z" fill="#3a2418" ${S} stroke-width="8"/>`);

export async function buildAugustaArt() {
  const r = (s, w, h) => rasterSVG(s, w, h, 2);
  const mouths = {}; for (const [k, v] of Object.entries(MOUTHS)) mouths[k] = await r(v, 180, 120);
  const hands = {}; for (const [k, v] of Object.entries(HANDS)) hands[k] = await r(v, 160, 160);
  return {
    head: await r(HEAD, 512, 512), bun: await r(BUN, 220, 220), eyeWhite: await r(EYE_WHITE, 120, 130), pupil: await r(PUPIL, 48, 48),
    lid: await r(LID, 120, 130), brow: await r(BROW, 140, 60), glasses: await r(GLASSES, 512, 512), loupe: await r(LOUPE, 160, 200),
    torso: await r(TORSO, 320, 340), upper: await r(UPPER, 90, 200), fore: await r(FORE, 90, 220), thigh: await r(THIGH, 90, 180), shin: await r(SHIN, 110, 200),
    mouths, hands,
  };
}
export const AUGUSTA_DIMS = {
  hip: .0, legGap: .09, thighL: .34, thighW: .17, shinL: .4, shinW: .22,
  torsoW: .6, torsoH: .64, neckY: .55, headS: .78, headPivot: .914,
  bunAt: [300, 72], bunS: .24,
  eyeL: [196, 294], eyeR: [316, 294], eyeW: .118, browUp: 80, browW: .14, mouthAt: [256, 404], mouthW: .17,
  loupeHinge: [316, 226], loupeS: .14,
  shoulderX: .21, shoulderY: .52, armW: .1, upperL: .25, foreL: .26, handS: .14,
};
