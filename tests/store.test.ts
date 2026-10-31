import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {openStore} from '../backend/store.ts';
test('single-process lock, atomic rollback and corrupted-store protection',()=>{
 const dir=fs.mkdtempSync(path.join(tmpdir(),'civic-store-'));let store:ReturnType<typeof openStore>|undefined;
 try{
  store=openStore(dir);store.commit(()=>{});assert.throws(()=>openStore(dir),/already used/);
  const originalRename=fs.renameSync;
  try{fs.renameSync=()=>{throw Error('Synthetic failed disk rename');};assert.throws(()=>store!.commit(items=>items.push({id:123} as any)));assert.equal(store.all.length,0);}
  finally{fs.renameSync=originalRename;}
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'incidents.json'),'utf8')).incidents.length,0);
  store.close();store=undefined;
  fs.writeFileSync(path.join(dir,'incidents.json'),'broken-json');assert.throws(()=>openStore(dir),/refusing to overwrite/);assert.equal(fs.readFileSync(path.join(dir,'incidents.json'),'utf8'),'broken-json');
 }finally{store?.close();fs.rmSync(dir,{recursive:true,force:true});}
});
