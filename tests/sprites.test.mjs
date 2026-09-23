import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directionRow } from '../src/sprites.js';

test('local animation atlases match declared frame grids and include all actors', async () => {
 const manifest=JSON.parse(await readFile('public/assets/sprites/manifest.json','utf8'));
 assert.deepEqual(Object.keys(manifest).sort(),['barbarian','fallen','skeleton','smith']);
 for(const [name,actions] of Object.entries(manifest)){
  for(const required of ['idle','walk','attack'])assert.ok(actions[required]);
  for(const spec of Object.values(actions)){
   const png=await readFile(`public/assets/sprites/${spec.file}`);
   assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
   assert.equal(png.readUInt32BE(16),spec.width*spec.frames);
   assert.equal(png.readUInt32BE(20),spec.height*spec.directions);
   for(let i=0;i<360;i++){
    const row=directionRow(name,i*Math.PI/180,spec.directions);
    assert.ok(Number.isInteger(row)&&row>=0&&row<spec.directions);
   }
  }
 }
});
