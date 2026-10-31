import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
const dir=mkdtempSync(path.join(tmpdir(),'civic-startup-'));let count=0;
const children:ChildProcess[]=[];
async function port(){const s=createServer();await new Promise<void>(r=>s.listen(0,'127.0.0.1',r));const p=(s.address() as any).port;await new Promise<void>(r=>s.close(()=>r()));return p;}
function start(args:string[],extra:Record<string,string>){const child=spawn(process.execPath,args,{env:{...process.env,DATA_DIR:dir,AI_PROVIDER:'rules',...extra},stdio:'pipe'});children.push(child);return child;}
async function stop(child:ChildProcess){if(child.exitCode!==null)return;await new Promise<void>(r=>{const t=setTimeout(()=>{child.kill('SIGKILL');r();},5000);child.once('exit',()=>{clearTimeout(t);r();});child.kill('SIGTERM');});}
async function ready(url:string){for(let n=0;n<100;n++){try{const r=await fetch(url);if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Service not ready '+url);}
function pass(s:string){count++;console.log('PASS '+s);}
try{
 const p=await port(),url=`http://127.0.0.1:${p}`;
 let backend=start(['--import','tsx','server.ts'],{PORT:String(p)});await ready(url+'/api/health');
 assert.match(await(await fetch(url)).text(),/src\/main.tsx/);assert.equal((await fetch(url+'/src/main.tsx')).status,200);pass('unified development server serves API, HTML and transformed React entry');
 const result=await new Promise<string>((resolve,reject)=>{
  const python=spawn('python3',['triage.py','--api',url+'/api','--description','Garbage bins overflowing on the street','--location','Lake Road junction Chennai'],{stdio:'pipe'});let output='',error='';python.stdout.on('data',d=>output+=d);python.stderr.on('data',d=>error+=d);python.on('error',reject);python.on('exit',code=>code===0?resolve(output):reject(Error(error)));
 });assert.equal(JSON.parse(result).incident.result.source,'rules');pass('Python stdlib client submits through canonical Express triage');
 await stop(backend);
 backend=start(['--import','tsx','scripts/backend.mjs'],{PORT:String(p)});await ready(url+'/api/health');
 const f=await port(),front=`http://127.0.0.1:${f}`;const vite=start(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(f)],{API_PROXY_TARGET:url});await ready(front);
 assert.equal((await fetch(front+'/api/health')).status,200);assert.equal((await(await fetch(front+'/api/incidents')).json()).length,1);pass('separate Vite frontend proxies to backend with consistent persisted data');
 await stop(vite);await stop(backend);
 backend=start(['--import','tsx','scripts/start.mjs'],{PORT:String(p)});await ready(url+'/api/health');assert.match(await(await fetch(url)).text(),/\/assets\/index-/);assert.equal((await(await fetch(url+'/api/incidents')).json()).length,1);pass('production launcher serves built frontend and persisted API records');
 console.log(`\n${count} startup checks passed.`);
}finally{for(const c of children)await stop(c);rmSync(dir,{recursive:true,force:true});}
