import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); await doc.transform(dequantize());
  const pts = [];
  for (const n of doc.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; const M = n.getWorldMatrix();
    for (const p of m.listPrimitives()) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []);
      pts.push([M[0]*v[0]+M[4]*v[1]+M[8]*v[2]+M[12], M[1]*v[0]+M[5]*v[1]+M[9]*v[2]+M[13], M[2]*v[0]+M[6]*v[1]+M[10]*v[2]+M[14]]); } } }
  const mn = [0,1,2].map(k => Math.min(...pts.map(p => p[k]))), mx = [0,1,2].map(k => Math.max(...pts.map(p => p[k])));
  const top = pts.filter(p => p[1] > mx[1] - .12), avg = k => (top.reduce((s, p) => s + p[k], 0) / top.length).toFixed(3);
  const ext = pts.filter(p => p[2] > mx[2] - .08), ax = k => (ext.reduce((s, p) => s + p[k], 0) / ext.length).toFixed(3);
  console.log(f.split('/').pop(), 'min', mn.map(v => v.toFixed(2)), 'max', mx.map(v => v.toFixed(2)), '| top region avg', avg(0), avg(1), avg(2), '| +x end avg', ax(0), ax(1), ax(2));
}
