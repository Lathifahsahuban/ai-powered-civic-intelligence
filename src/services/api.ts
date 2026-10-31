import type { DashboardStats, Incident, BackendHealth, ReportInput, Review } from '../types';
let currentApiBase=import.meta.env.VITE_API_BASE || '/api';
export const getApiBase=()=>currentApiBase;
export function setApiBase(url:string){if(url!=='/api')throw Error('Use the same-origin /api endpoint; configure a development proxy for separate ports.');currentApiBase=url;}
export function reporterId(){let id=localStorage.getItem('civic_reporter_id');if(!id){id=crypto.randomUUID();localStorage.setItem('civic_reporter_id',id);}return id;}
async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(`${currentApiBase}${path}`,{...options,signal:AbortSignal.timeout(45000)});
  const data=await response.json().catch(()=>({error:'Server returned an invalid response'}));
  if(!response.ok)throw Error(data.error||`Request failed (${response.status})`);return data;
}
const post=(body:unknown,token?:string):RequestInit=>({method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
export const fetchHealth=()=>request<BackendHealth>('/health');
export const fetchDashboardStats=()=>request<DashboardStats>('/dashboard/stats');
export const fetchIncidents=(params:Record<string,string>={})=>request<Incident[]>(`/incidents?${new URLSearchParams(params)}`);
export const fetchIncident=(id:string|number)=>request<Incident>(`/incidents/${encodeURIComponent(id)}`);
export const agreeIncident=(id:string|number)=>request<{ok:boolean;consensus_count:number;message:string}>(`/incidents/${id}/agree`,post({reporter_id:reporterId()}));
export const submitTriage=(input:ReportInput)=>request<{success:boolean;incident:Incident;ref_code:string;message:string}>('/triage',post({...input,reporter_id:reporterId()}));
export const reviewReport=(id:number,review:Omit<Review,'at'>,token:string)=>request<{incident:Incident}>(`/reports/${id}/review`,post(review,token));
