import {Map,AdvancedMarker,InfoWindow} from '@vis.gl/react-google-maps';
import {useState} from 'react';
import type {Incident} from '../types';
export function GoogleMapsCanvas({incidents,onSelectIncident}:{incidents:Incident[];onSelectIncident:(i:Incident)=>void}){
 const [selected,setSelected]=useState<Incident|null>(null);
 const points=incidents.filter(i=>i.lat!==undefined&&i.lng!==undefined);
 const center=points.length?{lat:points[0].lat!,lng:points[0].lng!}:{lat:13.0827,lng:80.2707};
 return <div className="h-96 rounded-xl overflow-hidden"><Map mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID'} defaultCenter={center} defaultZoom={13} gestureHandling="cooperative"><>{points.map(i=><AdvancedMarker key={i.id} position={{lat:i.lat!,lng:i.lng!}} title={`${i.ref_code}: ${i.description}`} onClick={()=>{setSelected(i);onSelectIncident(i);}}><span className={`priority priority-${i.priority.level}`}>{i.ref_code}</span></AdvancedMarker>)}{selected&&<InfoWindow position={{lat:selected.lat!,lng:selected.lng!}} onCloseClick={()=>setSelected(null)}><strong>{selected.ref_code}</strong><p>{selected.location}</p><p>{selected.description}</p><p>Reported coordinates; not field verified.</p></InfoWindow>}</></Map></div>;
}
