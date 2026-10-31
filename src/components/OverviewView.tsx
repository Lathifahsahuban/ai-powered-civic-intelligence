import type {DashboardStats,Incident} from '../types';
import {IncidentCard} from './IncidentCard';
export function OverviewView({stats,incidents,onRefresh,onReport,onMap}:{stats:DashboardStats;incidents:Incident[];onRefresh:()=>Promise<void>;onReport:()=>void;onMap:()=>void}){
 const active=incidents.filter(i=>i.status!=='resolved');
 return <div className="view space-y-4"><section className="hero"><span className="eyebrow text-secondary-fixed!">AI-Powered Civic Intelligence</span><h1>Local reports.<br/>Clearer priorities.</h1><p>Find recurring problems and focus attention where it matters.</p><div className="flex gap-2 mt-4"><button className="btn bg-secondary!" onClick={onReport}>Report a problem</button><button className="btn secondary bg-white!" onClick={onMap}>Explore map</button></div></section>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[['Reports',stats.total_reports],['Distinct events',stats.unique_events],['Potential recurring problems',stats.recurring_problems],['Awaiting review',stats.pending_reviews],['Resolved',stats.resolved],['Extra confirmations',stats.consensus_people]].map(([title,value])=><div className="panel" key={title}><p className="muted">{title}</p><strong className="text-3xl text-primary">{value}</strong></div>)}</div>
 <p className="notice">Prototype: assessments are provisional. No live sensors, municipal dispatch, SMS or field verification are connected.</p>
 <h2>Attention queue</h2>{active.length===0?<div className="panel">{incidents.length?'All reports are currently resolved.':'No reports yet. Submit your first civic problem to begin.'}</div>:[...active].sort((a,b)=>b.priority.score-a.priority.score).slice(0,5).map(i=><IncidentCard key={i.id} incident={i} onRefresh={onRefresh}/>)}
 </div>;
}
