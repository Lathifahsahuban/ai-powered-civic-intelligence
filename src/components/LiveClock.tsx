import {useEffect,useState} from 'react';
import {Clock} from 'lucide-react';
export function LiveClock({compact=false,className=''}:{compact?:boolean;className?:string;userCoordinates?:{lat:number;lng:number}|null}){
 const [now,setNow]=useState(new Date());useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer);},[]);
 const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
 return <div className={`${compact?'text-[10px]':'panel text-xs'} flex items-center flex-wrap gap-x-2 gap-y-1 font-mono ${className}`}><Clock size={12} aria-hidden="true" className="text-secondary"/><span className="whitespace-nowrap">{now.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</span><strong className="text-secondary tabular-nums">{now.toLocaleTimeString(undefined,{hour12:false})}</strong><span className="muted text-[9px]!">{zone}</span></div>;
}
