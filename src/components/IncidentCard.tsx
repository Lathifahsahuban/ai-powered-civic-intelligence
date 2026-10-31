import React, {useState} from 'react';
import {ISSUE_TYPES,effectiveCategory,effectiveSeverity,label,type Incident,type Status} from '../types';
import {agreeIncident,reviewReport} from '../services/api';
export function IncidentCard({incident:i,onRefresh}:{incident:Incident;onRefresh:()=>Promise<void>}){
  const [expanded,setExpanded]=useState(false),[review,setReview]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function confirm(){setBusy(true);setError('');try{await agreeIncident(i.id);await onRefresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const form=new FormData(e.currentTarget);setBusy(true);setError('');
    try{await reviewReport(i.id,{issue_type:form.get('category') as Incident['result']['issue_type'],severity:Number(form.get('severity')),immediate_hazard:form.get('hazard')==='on',status:form.get('status') as Status,note:String(form.get('note'))},String(form.get('token')));setReview(false);await onRefresh();}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function share(){try{const url=new URL(window.location.href);url.searchParams.set('incident',String(i.id));if(navigator.share)await navigator.share({title:i.ref_code,text:i.description,url:url.href});else await navigator.clipboard.writeText(url.href);}catch{setError('Sharing unavailable; use incident reference '+i.ref_code);}}
  return <article className="panel space-y-3" id={`incident-${i.id}`}>
    <div className="flex justify-between gap-2 items-start"><div><span className="eyebrow">{i.ref_code} · {label(i.status)}</span><h3>{label(effectiveCategory(i))}</h3></div><span className={`priority priority-${i.priority.level}`}>{i.priority.level} · {i.priority.score}</span></div>
    <p>{i.description}</p><p className="muted">{i.location} · {i.ward}</p>
    <div className="flex flex-wrap gap-2 text-xs"><span className="tag">Severity {effectiveSeverity(i)}/5</span><span className="tag">{i.result.source==='rules'?'Text rules · no model':'Gemini model'}</span><span className="tag">{i.reviewed?'Human reviewed':'Unverified'}</span><span className="tag">{label(i.recurrence.kind)}</span><span className="tag">{i.recurrence.recurrence_count} previous event(s)</span></div>
    <p className="muted">{i.priority.reasons.join(' ')}</p>
    <div className="flex flex-wrap gap-2"><button onClick={()=>setExpanded(!expanded)} className="btn secondary">{expanded?'Hide details':'Assessment & history'}</button><button className="btn secondary" disabled={busy} onClick={confirm}>I see this too ({i.consensus_count})</button><button className="btn secondary" onClick={share}>Share</button><button className="btn secondary" onClick={()=>setReview(!review)}>Reviewer actions</button></div>
    {error&&<p role="alert" className="error">{error}</p>}
    {expanded&&<div className="space-y-3 border-t pt-3">
      {i.photo&&<img className="rounded-lg max-h-64 w-full object-contain" src={i.photo} alt="Citizen supplied evidence; unverified"/>}
      <p><strong>Assessment:</strong> {i.assessment_status} · {i.result.summary}</p><p><strong>Image evidence:</strong> {i.result.visual_findings}</p>
      <p className="muted">{i.result.ai_model} · confidence estimate {Math.round(i.result.confidence*100)}% (uncalibrated). Photo match: {i.result.photo_matches_description}.</p>
      {i.result.fallback_reason&&<p className="notice">{i.result.fallback_reason}</p>}
      <p>Missing information: {i.result.missing_info.join(', ')||'None flagged'}</p><p>Reported impact: {i.impact||'Not supplied'} · Duration: {i.duration||'Not supplied'}</p>
      <p>Occurrence: {new Date(i.occurred_at).toLocaleString()} · Submitted: {new Date(i.created).toLocaleString()}</p>
      <p>Location evidence: {i.lat!==undefined?`${i.lat}, ${i.lng} (device or reporter coordinates, not field verified)`:'Manual address only; no coordinates'}</p>
      <p><strong>Matching:</strong> {i.recurrence.evidence.join(' ')}</p><p>Event #{i.recurrence.event_id}; linked reports: {i.recurrence.previous_ids.map(id=><a key={id} className="underline mr-2" href={`?incident=${id}`}>#{id}</a>)}</p>
      <p><strong>Original assessment:</strong> {label(i.result.issue_type)} · severity {i.result.severity}/5 · hazard {String(i.result.immediate_hazard)}</p>
      {i.reviews.map((r,index)=><p key={index} className="notice">{new Date(r.at).toLocaleString()}: {r.note} · {label(r.issue_type)}, severity {r.severity}, hazard {String(r.immediate_hazard)}, {label(r.status)}</p>)}
    </div>}
    {review&&<form onSubmit={save} className="space-y-3 border-t pt-3"><p className="muted">Reviewer token is kept in this form only. Corrections are stored separately from the original assessment.</p>
      <label>Reviewer token<input required type="password" name="token" autoComplete="off"/></label>
      <label>Correct category<select name="category" defaultValue={effectiveCategory(i)}>{ISSUE_TYPES.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
      <label>Severity (reviewer only)<input name="severity" type="number" min="1" max="5" required defaultValue={effectiveSeverity(i)}/></label>
      <label className="flex gap-2"><input className="w-auto!" name="hazard" type="checkbox" defaultChecked={i.reviews.at(-1)?.immediate_hazard??i.result.immediate_hazard}/>Immediate hazard</label>
      <label>Lifecycle status<select name="status" defaultValue={i.status}><option value="reported">Reported</option><option value="on_progress">In progress</option><option value="resolved">Resolved</option></select></label>
      <label>Reason for review<textarea name="note" required minLength={5} maxLength={1000}/></label><button className="btn" disabled={busy}>{busy?'Saving…':'Save review'}</button>
    </form>}
  </article>;
}
