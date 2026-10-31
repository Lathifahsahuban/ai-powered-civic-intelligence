import React,{useState} from 'react';
import type {Incident} from '../types';
import {submitTriage,fetchIncident} from '../services/api';
import {IncidentCard} from './IncidentCard';
export function ReportView({onTriageSubmitted,onRefresh}:{onTriageSubmitted:()=>Promise<void>;onRefresh:()=>Promise<void>}){
 const [photo,setPhoto]=useState(''),[photoName,setPhotoName]=useState(''),[readingPhoto,setReadingPhoto]=useState(false),[coords,setCoords]=useState<{lat:number;lng:number}|null>(null);
 const [location,setLocation]=useState(''),[gps,setGps]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState<Incident|null>(null);
 function detect(){if(!navigator.geolocation){setGps('GPS unavailable. Enter a manual address.');return;}setGps('Requesting device location…');
 navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:p.coords.latitude,lng:p.coords.longitude});setGps(`Device reports accuracy ±${Math.round(p.coords.accuracy)} m. Not field verified.`);if(!location)setLocation(`Device location ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);},()=>{setCoords(null);setGps('Location permission denied or unavailable. Please enter an address.');},{timeout:10000,maximumAge:0});}
 function upload(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];setPhoto('');setPhotoName('');setError('');if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Choose a JPEG, PNG or WebP up to 5 MB.');e.target.value='';return;}
 setReadingPhoto(true);const reader=new FileReader();reader.onerror=()=>{setReadingPhoto(false);setError('Unable to read image.');};reader.onload=()=>{setReadingPhoto(false);setPhoto(String(reader.result));setPhotoName(file.name);};reader.readAsDataURL(file);}
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(busy||readingPhoto)return;const form=new FormData(e.currentTarget);setBusy(true);setError('');setSaved(null);
 try{const occurred=String(form.get('occurred_at')||'');const r=await submitTriage({citizen_name:String(form.get('name')||''),location:location.trim(),description:String(form.get('description')||'').trim(),duration:String(form.get('duration')||''),impact:String(form.get('impact')||''),ward:String(form.get('ward')||''),...(coords||{}),...(photo?{photoBase64:photo}:{}),...(occurred?{occurred_at:new Date(occurred).toISOString()}:{})});setSaved(r.incident);await onTriageSubmitted();}
 catch(e){setError((e as Error).message+' If the request timed out, refresh the incident list before retrying.');}finally{setBusy(false);}}
 return <div className="view space-y-4"><h1>Report a civic problem</h1><p className="muted">Tell us what happened. The system assigns category, severity and priority.</p>
 <form onSubmit={submit} className="panel space-y-4"><label>Your name (optional)<input name="name" maxLength={100}/></label>
 <label>Incident location<input required maxLength={300} value={location} onChange={e=>{setLocation(e.target.value);setCoords(null);setGps('Manual address; coordinates cleared.');}} placeholder="Street, landmark and city"/></label>
 <div className="flex gap-2"><button className="btn secondary" type="button" onClick={detect}>Use my device location</button>{coords&&<button className="btn secondary" type="button" onClick={()=>{setCoords(null);setGps('Coordinates removed.');}}>Clear coordinates</button>}</div><p className="muted" role="status">{gps||'Manual addresses are not geocoded.'}{coords&&` (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`}</p>
 <label>Ward (optional)<input name="ward" maxLength={100}/></label><label>Describe the problem<textarea name="description" required minLength={10} maxLength={3000} rows={4} placeholder="What do you see? Is anyone in danger?"/></label>
 <label>When did this event occur? (optional, local time)<input name="occurred_at" type="datetime-local"/><span className="muted">Leave blank for now. Occurrence time helps separate repeated reports from later events.</span></label>
 <label>How long has it lasted? (optional)<input name="duration" maxLength={100} placeholder="For example: 2 days"/></label>
 <label>Impact on people (optional)<textarea name="impact" maxLength={1000} placeholder="For example: 20 residents cannot use the road"/></label>
 <label>Photo evidence (optional, up to 5 MB)<input key={photoName ? 'selected' : 'empty'} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label>
 {photo&&<div><img className="rounded-lg max-h-56 object-contain" src={photo} alt="Selected citizen evidence"/><p className="muted">{photoName} · No EXIF or photo verification performed.</p><button className="btn secondary" type="button" onClick={()=>{setPhoto('');setPhotoName('');}}>Remove photo</button></div>}
 <p className="notice">With Gemini enabled, text and an attached photo are sent to that provider. In rules mode, only text is assessed. Avoid personal details in public reports.</p>
 {error&&<p className="error" role="alert">{error}</p>}<button disabled={busy||readingPhoto} className="btn w-full">{busy?'Saving report and assessing…':readingPhoto?'Reading photo…':'Submit report'}</button>
 </form>{saved&&<section className="space-y-3"><p role="status" className="notice">Saved successfully as {saved.ref_code}. Status: reported. No crew has been dispatched.</p><IncidentCard incident={saved} onRefresh={async()=>{setSaved(await fetchIncident(saved.id));await onRefresh();}}/></section>}</div>;
}
