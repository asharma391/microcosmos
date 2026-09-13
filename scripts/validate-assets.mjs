import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const ids = ['tardigrade', 'rotifer', 'daphnia', 'diatom', 'desmid', 'euglena', 'paramecium', 'volvox', 'stentor'];
for (const id of ids) {
  const path = `public/models/${id}.glb`;
  assert.ok(existsSync(path), `Missing specimen model: ${path}`);
  const file = readFileSync(path);
  assert.equal(file.toString('ascii', 0, 4), 'glTF', `${id}: invalid GLB header`);
  assert.equal(file.readUInt32LE(4), 2, `${id}: expected glTF 2.0`);
  assert.equal(file.readUInt32LE(8), file.length, `${id}: incomplete GLB download`);
  assert.equal(file.readUInt32LE(16), 0x4E4F534A, `${id}: missing JSON chunk`);
  const doc = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)).toString());
  assert.ok(doc.meshes?.some(mesh => mesh.primitives?.length), `${id}: no renderable geometry`);
  for (const image of doc.images ?? []) assert.ok(!image.uri || image.uri.startsWith('data:'), `${id}: external texture would break offline distribution`);
  for (const buffer of doc.buffers ?? []) assert.ok(!buffer.uri || buffer.uri.startsWith('data:'), `${id}: unexpected external geometry`);
  assert.ok(existsSync(`public/specimens/${id}.webp`) || existsSync(`public/specimens/${id}.png`), `${id}: missing thumbnail`);
  console.log(`${id}: valid GLB, ${(file.length / 1024 / 1024).toFixed(2)} MB`);
}
