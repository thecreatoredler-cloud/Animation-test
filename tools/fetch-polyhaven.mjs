// Fetch CC0 assets from Poly Haven and optimise them for phones.
//
//   cd tools && npm install            (once)
//   node fetch-polyhaven.mjs model mantel_clock_01 desk_lamp_arm_01 ...
//   node fetch-polyhaven.mjs texture wood_floor_deck plaster_grey_04 ...
//
// Models  -> ../assets/polyhaven/<id>.glb  (textures max 1024 px WebP, quantised meshes, node hierarchy kept)
// Textures-> ../assets/polyhaven/tex/<id>_{diff,nor,arm}.webp (1024 px)
// Every asset is CC0 (public domain); sources are listed in ../assets/ASSETS.md.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../assets/polyhaven');
const RAW = path.resolve(here, 'raw');
const [kind, ...ids] = process.argv.slice(2);
if (!['model', 'texture'].includes(kind) || !ids.length) { console.error('usage: node fetch-polyhaven.mjs model|texture <id> [...]'); process.exit(1); }

// curl honours the session's HTTPS proxy; Node's fetch does not
const get = (url, file) => { fs.mkdirSync(path.dirname(file), { recursive: true }); execFileSync('curl', ['-sSfL', '--retry', '3', '-o', file, url]); };
const json = (url) => JSON.parse(execFileSync('curl', ['-sSfL', '--retry', '3', url]).toString());
fs.mkdirSync(path.join(OUT, 'tex'), { recursive: true });

for (const id of ids) {
  const files = json(`https://api.polyhaven.com/files/${id}`);
  const info = json(`https://api.polyhaven.com/info/${id}`);
  if (kind === 'model') {
    const g = files.gltf['1k'].gltf, dir = path.join(RAW, id), main = path.join(dir, path.basename(g.url));
    get(g.url, main);
    for (const [rel, f] of Object.entries(g.include)) get(f.url, path.join(dir, rel));
    const out = path.join(OUT, `${id}.glb`);
    execFileSync(path.join(here, 'node_modules/.bin/gltf-transform'), ['optimize', main, out,
      '--texture-compress', 'webp', '--texture-size', '1024', '--compress', 'quantize',
      '--simplify', 'false', '--join', 'false', '--flatten', 'false', '--instance', 'false'], { stdio: 'inherit' });
    console.log(`${id}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB  (${info.name}, by ${Object.keys(info.authors || {}).join(', ')})`);
  } else {
    for (const [key, name] of [['Diffuse', 'diff'], ['nor_gl', 'nor'], ['arm', 'arm']]) {
      const f = files[key]?.['1k']?.jpg; if (!f) continue;
      const tmp = path.join(RAW, `${id}_${name}.jpg`); get(f.url, tmp);
      await sharp(tmp).resize(1024, 1024, { fit: 'inside' }).webp({ quality: name === 'diff' ? 82 : 90 }).toFile(path.join(OUT, 'tex', `${id}_${name}.webp`));
    }
    console.log(`${id}: texture set saved (${info.name})`);
  }
  fs.appendFileSync(path.join(OUT, 'sources.txt'), `${kind}\t${id}\t${info.name}\thttps://polyhaven.com/a/${id}\tCC0\t${Object.keys(info.authors || {}).join(', ')}\n`);
}
