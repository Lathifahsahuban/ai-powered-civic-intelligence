import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { openStore } from './backend/store.ts';
import { assess, providerLastStatus, ruleAssessment } from './backend/triage.ts';
import { detectRecurrence, recompute, rebuildMatches } from './backend/analysis.ts';
import { HttpError, validateInput } from './backend/validation.ts';
import { ISSUE_TYPES, effectiveCategory, effectiveSeverity, type StoredIncident as Incident, type Status } from './src/types.ts';

dotenv.config();
const root=path.dirname(fileURLToPath(import.meta.url));
const app=express(), port=Number(process.env.PORT||3000);
if(!['rules','gemini'].includes(process.env.AI_PROVIDER||'rules'))throw Error('AI_PROVIDER must be rules or gemini');
const store=openStore(path.resolve(process.env.DATA_DIR||path.join(root,'data')));
// Interrupted requests remain stored; recover transparently without inventing model output.
store.commit(items=>{for(const i of items)if(i.assessment_status==='pending'){
  i.result=ruleAssessment({...i,photoBase64:i.photo||undefined},'Server restarted during model assessment; text rules used');i.assessment_status='complete';i.review_needed=true;
}rebuildMatches(items);});
app.disable('x-powered-by');
app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');next();});
app.use('/api',(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
app.use(express.json({limit:'8mb'}));
const rates=new Map<string,{count:number;until:number}>();
app.use('/api',(req,res,next)=>{
  if(req.method==='GET')return next();
  const now=Date.now(),key=req.ip||'local';
  for(const [k,v]of rates)if(v.until<now)rates.delete(k);
  const r=rates.get(key)||{count:0,until:now+60000};r.count++;rates.set(key,r);
  if(r.count>60)return res.status(429).json({error:'Too many requests; retry in one minute'});
  next();
});
const find=(items:Incident[],id:string)=>{const item=items.find(i=>String(i.id)===id||i.ref_code===id);if(!item)throw new HttpError(404,'Incident not found');return item;};
const publicIncident=(i:Incident)=>{const {reporter_id,confirmation_ids,...rest}=i;return rest;};
const asyncRoute=(fn:any)=>(req:any,res:any,next:any)=>Promise.resolve(fn(req,res)).catch(next);
app.get('/api/health',(_req,res)=>res.json({status:'healthy',backend:'Express unified API',ai_service:process.env.AI_PROVIDER||'rules',
  provider_configured:process.env.AI_PROVIDER==='gemini'&&Boolean(process.env.GEMINI_API_KEY),provider_last_status:providerLastStatus,
  gemini_ready:providerLastStatus==='last_call_succeeded',ollama_ready:false,database:'atomic JSON file; single server process',ward:'Citizen supplied',timestamp:new Date().toISOString()}));
app.get('/api/dashboard/stats',(_req,res)=>{
  const all=store.all, categories=ISSUE_TYPES.map(id=>{
    const matches=all.filter(i=>effectiveCategory(i)===id), max=Math.max(0,...matches.map(effectiveSeverity));
    return {id,title:id.replaceAll('_',' '),reports:matches.length,severity:max>=5?'High / Critical':max>=4?'High':max===3?'Medium':'Low',critical:max>=5,icon:'warning',color:'cyan'};
  });
  res.json({total_reports:all.length,unique_events:new Set(all.map(i=>i.recurrence.event_id)).size,
    recurring_problems:new Set(all.filter(i=>i.recurrence.recurrence_count>0).map(i=>i.recurrence.group_id)).size,
    pending_reviews:all.filter(i=>i.review_needed&&!i.reviewed).length,resolved:all.filter(i=>i.status==='resolved').length,
    consensus_people:all.reduce((n,i)=>n+(i.id===i.recurrence.event_id?i.consensus_count:0),0),categories,
    live_incident:all.length?publicIncident(all.sort((a,b)=>b.priority.score-a.priority.score)[0]):null,ward:'All reported wards',zone:'Civic reports'});
});
app.get(['/api/incidents','/api/reports'],(req,res)=>{
  const {category,severity,status,search}=req.query;
  let list=store.all;
  if(category)list=list.filter(i=>effectiveCategory(i)===category);
  if(severity)list=list.filter(i=>severity==='high'?effectiveSeverity(i)>=4:severity==='medium'?effectiveSeverity(i)===3:severity==='low'?effectiveSeverity(i)<=2:effectiveSeverity(i)===Number(severity));
  if(status)list=list.filter(i=>i.status===status);
  if(typeof search==='string')list=list.filter(i=>`${i.ref_code} ${i.description} ${i.location}`.toLowerCase().includes(search.toLowerCase()));
  res.json(list.sort((a,b)=>b.id-a.id).map(publicIncident));
});
app.get('/api/incidents/:id',(req,res,next)=>{try{res.json(publicIncident(find(store.all,req.params.id)));}catch(e){next(e);}});
app.post(['/api/triage','/api/reports'],asyncRoute(async(req:any,res:any)=>{
  const input=validateInput(req.body), now=new Date().toISOString();let id=0;
  store.commit(items=>{
    id=Math.max(0,...items.map(i=>i.id))+1;
    const pending:Incident={...input,id,ref_code:`CS-${String(id).padStart(5,'0')}`,created:now,recorded_at:now,occurred_at:input.occurred_at||now,
      citizen_name:input.citizen_name,photo:input.photoBase64||'',duration:input.duration||'',impact:input.impact||'',ward:input.ward||'Unspecified',reporter_id:input.reporter_id!,
      result:ruleAssessment(input,'Assessment pending'),assessment_status:'pending',review_needed:true,reviewed:false,
      consensus_count:0,confirmation_ids:[],status:'reported',stage:1,user_submitted:true,reviews:[],
      recurrence:{kind:'new',event_id:id,recurrence_count:0,previous_ids:[],evidence:['Assessment pending'],match_method:'none'},priority:{level:'low',score:0,reasons:['Assessment pending; not yet prioritized']}};
    // Avoid storing a second copy of a large image.
    delete (pending as any).photoBase64;items.push(pending);
  });
  const assessment=await assess(input);
  store.commit(items=>{const i=find(items,String(id));i.result=assessment;i.assessment_status='complete';i.review_needed=assessment.needs_human_review;
    i.updated_at=new Date().toISOString();rebuildMatches(items);});
  const incident=find(store.all,String(id));
  res.status(201).json({success:true,id,ref_code:incident.ref_code,incident:publicIncident(incident),triage_result:assessment,message:'Report saved and assessed. No municipal dispatch is connected.'});
}));
app.post('/api/incidents/:id/agree',(req,res,next)=>{try{
  const reporter=req.body?.reporter_id;
  if(typeof reporter!=='string'||!/^[\w-]{8,100}$/.test(reporter))throw new HttpError(400,'Stable reporter_id required');
  let id=0;
  store.commit(items=>{const i=find(items,req.params.id);id=i.id;
    const event=items.filter(x=>x.recurrence.event_id===i.recurrence.event_id);
    if(!event.some(x=>x.reporter_id===reporter||x.confirmation_ids.includes(reporter)))i.confirmation_ids.push(reporter);
    recompute(items);
  });
  const i=find(store.all,String(id));res.json({ok:true,consensus_count:i.consensus_count,message:'Confirmation recorded once per browser identity; this is not verified identity.'});
}catch(e){next(e);}});
app.post('/api/reports/:id/review',(req,res,next)=>{try{
  const token=process.env.REVIEWER_TOKEN;
  if(!token)throw new HttpError(503,'Reviewer actions disabled: configure REVIEWER_TOKEN on the server');
  const provided=Buffer.from((req.headers.authorization||'').replace(/^Bearer /,'')),expected=Buffer.from(token);
  if(provided.length!==expected.length||!timingSafeEqual(provided,expected))throw new HttpError(401,'Valid reviewer token required');
  const b=req.body;
  if(!b||!ISSUE_TYPES.includes(b.issue_type)||!Number.isInteger(b.severity)||b.severity<1||b.severity>5||typeof b.immediate_hazard!=='boolean'||
    !['reported','on_progress','resolved'].includes(b.status)||typeof b.note!=='string'||b.note.trim().length<5||b.note.length>1000)throw new HttpError(400,'Provide valid category, severity 1–5, hazard flag, status and review note (5–1000 characters)');
  store.commit(items=>{const i=find(items,req.params.id);if(i.assessment_status!=='complete')throw new HttpError(409,'Assessment still pending');
    i.reviews.push({at:new Date().toISOString(),issue_type:b.issue_type,severity:b.severity,immediate_hazard:b.immediate_hazard,status:b.status,note:b.note.trim()});
    i.fixed_issue=b.issue_type;i.fixed_severity=b.severity;i.status=b.status as Status;i.stage=['reported','on_progress','resolved'].indexOf(i.status)+1;
    i.reviewed=true;i.review_needed=false;i.updated_at=new Date().toISOString();rebuildMatches(items);
  });
  res.json({ok:true,incident:publicIncident(find(store.all,req.params.id))});
}catch(e){next(e);}});
app.get('/api/export.csv',(_req,res)=>{
  const cell=(v:unknown)=>`"${String(v??'').replace(/^[=+@-]/,"'").replaceAll('"','""')}"`;
  const rows=[['Reference','Created UTC','Location','Description','Category','Severity','Priority','Source','Status','Event ID','Recurrence count'],
    ...store.all.map(i=>[i.ref_code,i.created,i.location,i.description,effectiveCategory(i),effectiveSeverity(i),i.priority.level,i.result.source,i.status,i.recurrence.event_id,i.recurrence.recurrence_count])];
  res.type('text/csv').attachment('civic-incidents.csv').send(rows.map(r=>r.map(cell).join(',')).join('\r\n'));
});
app.use('/api',(_req,res)=>res.status(404).json({error:'API endpoint not found'}));
app.use((err:any,_req:any,res:any,_next:any)=>{
  const status=err instanceof HttpError?err.status:err.type==='entity.too.large'?413:err.type==='entity.parse.failed'?400:500;
  if(status===500)console.error('Request failed:',err);
  res.status(status).json({error:status===500?'Unable to save or process request. Please retry.':status===413?'Request too large; maximum photo size is 5 MB':err.message});
});
async function start(){
  let vite:any;
  if(process.env.NODE_ENV!=='production'&&process.env.API_ONLY!=='true'){
    const {createServer}=await import('vite');vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);
  }else if(process.env.API_ONLY!=='true'){
    app.use(express.static(path.join(root,'dist')));app.get('*',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
  }
  const server=app.listen(port,'127.0.0.1',()=>console.log(`Civic Intelligence: http://localhost:${port} (${process.env.AI_PROVIDER||'rules'})`));
  const shutdown=()=>server.close(async()=>{await vite?.close();store.close();process.exit(0);});
  process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);server.on('error',err=>{store.close();console.error(err);process.exit(1);});
}
start().catch(err=>{store.close();console.error(err);process.exit(1);});
