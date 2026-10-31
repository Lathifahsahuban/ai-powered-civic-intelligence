import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
const dir=mkdtempSync(path.join(tmpdir(),'civic-api-'));
const probe=createServer();await new Promise<void>(r=>probe.listen(0,'127.0.0.1',r));const port=(probe.address() as any).port;await new Promise<void>(r=>probe.close(()=>r()));
const base=`http://127.0.0.1:${port}/api`;let child:ChildProcess;let logs='';let checks=0;
function pass(name:string){checks++;console.log(`PASS ${name}`);}
async function start(provider='rules'){
 child=spawn(process.execPath,['--import','tsx','server.ts'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),API_ONLY:'true',DATA_DIR:dir,REVIEWER_TOKEN:'synthetic-review-token',AI_PROVIDER:provider,GEMINI_API_KEY:''},stdio:['ignore','pipe','pipe']});
 child.stdout?.on('data',x=>logs+=String(x));child.stderr?.on('data',x=>logs+=String(x));
 for(let n=0;n<80;n++){try{if((await fetch(base+'/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Server startup failed: '+logs);
}
async function stop(){if(!child||child.exitCode!==null)return;await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Shutdown timeout'));},5000);child.once('exit',()=>{clearTimeout(t);resolve();});child.kill('SIGTERM');});}
async function call(endpoint:string,body?:unknown,token?:string){const r=await fetch(base+endpoint,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
const common={citizen_name:'Synthetic tester',location:'Lake Road junction Chennai',ward:'42',description:'Deep flooding and waterlogging blocks Lake Road junction',impact:'20 residents cannot use the road',reporter_id:'synthetic-reporter-one',lat:13,lng:80};
try{
 await start();assert.equal((await call('/health')).body.ai_service,'rules');pass('backend starts; truthful health endpoint');
 assert.equal((await call('/dashboard/stats')).body.total_reports,0);pass('empty statistics derive from storage');
 assert.equal((await call('/triage',{...common,severity:5})).status,400);assert.equal((await call('/triage',{})).status,400);pass('invalid submissions and citizen severity rejected');
 assert.equal((await call('/triage',{...common,photoBase64:'data:image/png;base64,YWJj'})).status,400);pass('spoofed image rejected');
 assert.equal((await call('/triage',{...common,photoBase64:'data:image/png;base64,'+Buffer.alloc(5*1024*1024+1).toString('base64')})).status,413);pass('oversize image rejected');
 const past=new Date(Date.now()-4*86400000).toISOString();
 const first=await call('/triage',{...common,occurred_at:past});assert.equal(first.status,201);assert.equal(first.body.incident.result.source,'rules');assert.equal(first.body.incident.status,'reported');pass('report persisted; honest rule fallback and no automatic dispatch');
 const id=first.body.incident.id;
 const duplicate=await call('/triage',{...common,occurred_at:past});assert.equal(duplicate.body.incident.recurrence.kind,'duplicate');assert.equal(duplicate.body.incident.recurrence.recurrence_count,0);pass('duplicate does not inflate recurrence');
 const confirmation=await call('/triage',{...common,occurred_at:past,reporter_id:'synthetic-reporter-two'});assert.equal(confirmation.body.incident.recurrence.kind,'confirmation');assert.equal(confirmation.body.incident.consensus_count,1);pass('different browser report confirms same event');
 const later=await call('/triage',common);assert.equal(later.body.incident.recurrence.kind,'potential_recurrence');assert.equal(later.body.incident.recurrence.recurrence_count,1);pass('same location on later date becomes potential recurrence');
 await call('/triage',common);assert.equal((await call(`/incidents/${later.body.incident.id}`)).body.recurrence.recurrence_count,1);pass('later duplicate still counts one recurring event');
 const different=await call('/triage',{...common,description:'Streetlight is not working near the road'});assert.equal(different.body.incident.recurrence.kind,'new');pass('different nearby categories remain separate');
 const image=readFileSync('public/assets/aistudio/Image_1_07ccf57d.jpeg').toString('base64');
 const hazard=await call('/triage',{...common,description:'Open manhole with live wires on the pavement',photoBase64:'data:image/jpeg;base64,'+image});assert.equal(hazard.body.incident.priority.level,'critical');assert.ok(hazard.body.incident.photo.startsWith('data:image/jpeg'));assert.equal(hazard.body.incident.result.photo_matches_description,'cannot_tell');pass('image stored safely; immediate hazard priority without fake visual inference');
 const agree1=await call(`/incidents/${id}/agree`,{reporter_id:'synthetic-confirmation-three'}),agree2=await call(`/incidents/${id}/agree`,{reporter_id:'synthetic-confirmation-three'});assert.equal(agree1.body.consensus_count,agree2.body.consensus_count);pass('confirmations idempotent per browser identity');
 const review={issue_type:'pothole_road_damage',severity:2,immediate_hazard:false,status:'resolved',note:'Synthetic reviewer correction for integration test'};
 assert.equal((await call(`/reports/${id}/review`,review)).status,401);assert.equal((await call(`/reports/${id}/review`,{...review,severity:9},'synthetic-review-token')).status,400);
 const reviewed=await call(`/reports/${id}/review`,review,'synthetic-review-token');assert.equal(reviewed.status,200);assert.equal(reviewed.body.incident.result.issue_type,'waterlogging_flooding');assert.equal(reviewed.body.incident.fixed_issue,'pothole_road_damage');assert.equal(reviewed.body.incident.status,'resolved');pass('authorized review validates and preserves original assessment');
 const found=await call('/incidents?category=streetlight_failure&severity=low&search=Lake&status=reported');assert.equal(found.body.length,1);pass('category, severity, search and status filters');
 assert.equal((await call('/incidents/99999')).status,404);assert.equal((await call('/unknown')).status,404);pass('missing records and routes return meaningful errors');
 const bad=await fetch(base+'/triage',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});assert.equal(bad.status,400);pass('malformed JSON returns 400');
 const stats=(await call('/dashboard/stats')).body,list=(await call('/incidents')).body;assert.equal(stats.total_reports,list.length);assert.equal(stats.categories.reduce((n:number,c:any)=>n+c.reports,0),list.length);assert.equal(stats.unique_events,new Set(list.map((i:any)=>i.recurrence.event_id)).size);pass('dashboard, categories and register agree');
 assert.equal((await fetch(base+'/export.csv')).status,200);pass('CSV export works');
 await stop();
 const disk=JSON.parse(readFileSync(path.join(dir,'incidents.json'),'utf8'));disk.incidents.find((i:any)=>i.id===hazard.body.incident.id).assessment_status='pending';writeFileSync(path.join(dir,'incidents.json'),JSON.stringify(disk));
 await start();assert.match((await call(`/incidents/${hazard.body.incident.id}`)).body.result.fallback_reason,/restarted/);pass('interrupted pending assessment recovers honestly after restart');
 const persisted=(await call(`/incidents/${id}`)).body;assert.equal(persisted.fixed_issue,'pothole_road_damage');assert.equal(persisted.reviews.length,1);assert.equal((await call('/incidents')).body.length,list.length);pass('reports, image references, reviews and confirmations survive restart');
 await stop();await start('gemini');const unavailable=await call('/triage',{...common,location:'Another Road junction Chennai'});assert.equal(unavailable.status,201);assert.equal(unavailable.body.incident.result.source,'rules');assert.match(unavailable.body.incident.result.fallback_reason,/missing/i);assert.equal((await call('/health')).body.provider_last_status,'missing_key');pass('unconfigured Gemini falls back transparently without losing report');
 console.log(`\n${checks} API integration checks passed.`);
}finally{await stop();rmSync(dir,{recursive:true,force:true});}
