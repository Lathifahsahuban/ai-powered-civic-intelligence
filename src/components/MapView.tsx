import {useState} from 'react';
import {APIProvider,useApiIsLoaded,useApiLoadingStatus} from '@vis.gl/react-google-maps';
import {ISSUE_TYPES,effectiveCategory,label,type Incident} from '../types';
import {GoogleMapsCanvas} from './GoogleMapsCanvas';
import {IncidentCard} from './IncidentCard';
const key=import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
function MapStatus({incidents,onSelect}:{incidents:Incident[];onSelect:(i:Incident)=>void}){
 const loaded=useApiIsLoaded(),status=useApiLoadingStatus();
 if(!loaded)return <div className="panel" role="status">{status==='FAILED'||status==='AUTH_FAILURE'?'Google Maps could not load. Check the key, billing, restrictions and internet connection. The location list remains available.':'Loading Google Maps… Location list is available below.'}</div>;
 return <GoogleMapsCanvas incidents={incidents} onSelectIncident={onSelect}/>;
}
export function MapView({incidents,onRefresh}:{incidents:Incident[];onRefresh:()=>Promise<void>}){
 const [category,setCategory]=useState(''),[selected,setSelected]=useState<number|null>(null);
 const shown=incidents.filter(i=>!category||effectiveCategory(i)===category), located=shown.filter(i=>i.lat!==undefined&&i.lng!==undefined);
 const current=incidents.find(i=>i.id===selected);
 return <div className="view space-y-4"><h1>Incident map</h1><label>Map category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{ISSUE_TYPES.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
 <p className="notice">{located.length} of {shown.length} reports have coordinates. Manual addresses appear in the list only. No fabricated pins, hazard perimeters or sensor readings.</p>
 {key?<APIProvider apiKey={key}><MapStatus incidents={located} onSelect={i=>setSelected(i.id)}/></APIProvider>:<div className="panel">Google Maps is unavailable until VITE_GOOGLE_MAPS_API_KEY is configured. You can inspect every report and its location below.</div>}
 <div className="panel space-y-2"><h2>Report locations</h2>{shown.map(i=><button key={i.id} className="block w-full text-left p-2 rounded-lg hover:bg-surface-container-low" onClick={()=>setSelected(i.id)}><strong>{i.ref_code}</strong> · {i.location}<span className="muted block">{i.lat!==undefined?`${i.lat}, ${i.lng} · reported coordinates`:'Manual address · not geocoded'}</span></button>)}{!shown.length&&<p>No reports yet.</p>}</div>
 {current&&<IncidentCard incident={current} onRefresh={onRefresh}/>}</div>;
}
