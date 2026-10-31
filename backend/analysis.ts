import { effectiveCategory, effectiveSeverity, type StoredIncident as Incident, type Priority, type Recurrence } from '../src/types.ts';
const DAY=86400000;
export function distanceMeters(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
  const r=Math.PI/180, dlat=(b.lat-a.lat)*r, dlng=(b.lng-a.lng)*r;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
const normalize=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
export function similarity(a:string,b:string) {
  const words=(s:string)=>new Set(normalize(s).split(' ').filter(w=>w.length>2&&!['the','and','near','this','that','there','with','been','again'].includes(w)));
  const x=words(a), y=words(b), union=new Set([...x,...y]);
  return union.size ? [...x].filter(w=>y.has(w)).length/union.size : 0;
}
export function matchLocation(a:Incident,b:Incident): {method:'coordinates'|'location_text';reason:string}|null {
  if (a.lat!==undefined&&a.lng!==undefined&&b.lat!==undefined&&b.lng!==undefined) {
    const distance=distanceMeters({lat:a.lat,lng:a.lng},{lat:b.lat,lng:b.lng});
    return distance<=100 ? {method:'coordinates',reason:`Reported coordinates ${Math.round(distance)} m apart (100 m threshold; coordinates unverified).`} : null;
  }
  const loc=normalize(a.location);
  // Require a specific, identical address plus ward. Generic ward/city names never match.
  if (loc.length>=12 && loc.split(' ').length>=3 && /\b(street|road|rd|avenue|junction|lane|nagar|salai)\b/.test(loc) && loc===normalize(b.location) && normalize(a.ward)===normalize(b.ward))
    return {method:'location_text',reason:'Identical specific location text and ward; approximate match only, no geographic verification.'};
  return null;
}
export function detectRecurrence(current:Incident, existing:Incident[]):Recurrence {
  const candidates=existing.filter(i=>i.assessment_status==='complete'&&effectiveCategory(i)===effectiveCategory(current)&&!['other','unclear'].includes(effectiveCategory(i)))
    .map(i=>({i,loc:matchLocation(current,i),sim:similarity(current.description,i.description)}))
    .filter(x=>x.loc&&x.sim>=0.2&&Math.abs(Date.parse(current.occurred_at)-Date.parse(x.i.occurred_at))<=180*DAY)
    .sort((a,b)=>Math.abs(Date.parse(current.occurred_at)-Date.parse(a.i.occurred_at))-Math.abs(Date.parse(current.occurred_at)-Date.parse(b.i.occurred_at)));
  // Compare against event anchor, so a chain of reports cannot stretch one event indefinitely.
  const same=candidates.find(({i})=>{
    const anchor=existing.find(x=>x.id===i.recurrence.event_id) ?? i;
    return Math.abs(Date.parse(current.occurred_at)-Date.parse(anchor.occurred_at))<=DAY &&
      !(anchor.status==='resolved'&&Date.parse(current.occurred_at)>Date.parse(anchor.updated_at || anchor.created));
  });
  if (same) return {kind: same.i.reporter_id===current.reporter_id?'duplicate':'confirmation',event_id:same.i.recurrence.event_id,
    recurrence_count:0,previous_ids:[same.i.id],match_method:same.loc!.method,
    evidence:[same.loc!.reason,`Same category, text similarity ${same.sim.toFixed(2)}, within 24 hours of event anchor. ${same.i.reporter_id===current.reporter_id?'Same browser reporter: probable duplicate.':'Different browser reporter: independent report confirmation, identity not verified.'}`]};
  if (candidates.length) return {kind:'potential_recurrence',event_id:current.id,recurrence_count:0,
    previous_ids:candidates.map(x=>x.i.id),match_method:candidates[0].loc!.method,
    evidence:[candidates[0].loc!.reason,'Same category and similar text; separate event window or reappearance after resolution. Potential recurrence, not proof; unresolved continuous issues can resemble recurrence.']};
  return {kind:'new',event_id:current.id,recurrence_count:0,previous_ids:[],evidence:['No sufficiently supported previous match within 180 days.'],match_method:'none'};
}
export function prioritize(i:Incident):Priority {
  const severity=effectiveSeverity(i), review=i.reviews.at(-1);
  const hazard=review?.immediate_hazard ?? i.result.immediate_hazard;
  const recurrenceBonus=Math.min(10,i.recurrence.recurrence_count*3);
  const count=i.result.affected_count;
  const impactBonus=count!==null&&count>=100?10:count!==null&&count>=10?5:0;
  const verificationBonus=i.reviewed?5:0;
  const uncertaintyPenalty=i.result.confidence<0.75&&!i.reviewed?5:0;
  const score=Math.min(100,Math.max(0,severity*15+recurrenceBonus+impactBonus+verificationBonus-uncertaintyPenalty));
  const reasons=[`Severity ${severity}/5 (${i.reviewed?'reviewer correction':'unverified assessment'}).`,
    `Recurrence +${recurrenceBonus}; stated affected people +${impactBonus}; human review +${verificationBonus}; uncertainty −${uncertaintyPenalty}.`];
  let level:Priority['level']=score>=70?'high':score>=40?'medium':'low';
  if (severity<=2 && level==='high') level='medium';
  if (severity>=4) level='high';
  if (hazard||severity===5) {level='critical';reasons.push('Reported immediate safety hazard: urgent human attention despite incomplete evidence.');}
  if (!i.reviewed) reasons.push('Priority is provisional; no field verification or dispatch implied.');
  return {level,score,reasons};
}
export function recompute(incidents:Incident[]) {
  // Graph connects event anchors. Duplicate/confirmation reports never create another event.
  const graph=new Map<number,Set<number>>();
  const link=(a:number,b:number)=>{if(!graph.has(a))graph.set(a,new Set());graph.get(a)!.add(b);};
  for(const i of incidents) {
    link(i.recurrence.event_id,i.recurrence.event_id);
    for(const id of i.recurrence.previous_ids) {
      const p=incidents.find(x=>x.id===id); if(!p||effectiveCategory(p)!==effectiveCategory(i)||!matchLocation(i,p))continue;
      link(i.recurrence.event_id,p.recurrence.event_id);link(p.recurrence.event_id,i.recurrence.event_id);
    }
  }
  for(const i of incidents) {
    const seen=new Set<number>(), stack=[i.recurrence.event_id];
    while(stack.length) {const id=stack.pop()!;if(seen.has(id))continue;seen.add(id);stack.push(...(graph.get(id)||[]));}
    i.recurrence.group_id=Math.min(...seen);
    i.recurrence.recurrence_count=Math.max(0,seen.size-1);
    const eventReports=incidents.filter(x=>x.recurrence.event_id===i.recurrence.event_id);
    const reporters=new Set(eventReports.map(x=>x.reporter_id));
    for(const r of eventReports)for(const id of r.confirmation_ids)reporters.add(id);
    i.consensus_count=Math.max(0,reporters.size-1);
    i.priority=prioritize(i);
  }
}
export function rebuildMatches(incidents:Incident[]) {
  const processed:Incident[]=[];
  for(const i of [...incidents].sort((a,b)=>a.id-b.id)) {if(i.assessment_status==='complete')i.recurrence=detectRecurrence(i,processed);processed.push(i);}
  recompute(incidents);
}
