import fs from 'node:fs';
import path from 'node:path';
import type { StoredIncident as Incident } from '../src/types.ts';

export function openStore(directory:string) {
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const file=path.join(directory,'incidents.json'), lock=path.join(directory,'server.lock');
  if(fs.existsSync(lock)) {
    const pid=Number(fs.readFileSync(lock,'utf8'));
    let alive=false;try{process.kill(pid,0);alive=true;}catch(e:any){if(e.code!=='ESRCH')throw e;}
    if(alive)throw new Error('Data directory is already used by another server');
    fs.unlinkSync(lock);
  }
  fs.writeFileSync(lock,String(process.pid),{flag:'wx',mode:0o600});
  const close=()=>{try{fs.unlinkSync(lock);}catch{}};
  let records:Incident[]=[];
  try {if(fs.existsSync(file)){const parsed=JSON.parse(fs.readFileSync(file,'utf8'));if(parsed.version!==1||!Array.isArray(parsed.incidents))throw Error('Unsupported data format');records=parsed.incidents;}}
  catch(e){close();throw new Error(`Cannot read incident storage; refusing to overwrite it: ${String(e)}`);}
  function commit(change:(draft:Incident[])=>void) {
    const draft=structuredClone(records);change(draft);
    const temp=`${file}.tmp`, fd=fs.openSync(temp,'w',0o600);
    try{fs.writeFileSync(fd,JSON.stringify({version:1,incidents:draft},null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    fs.renameSync(temp,file);records=draft;
  }
  return {get all(){return structuredClone(records);},commit,close};
}
