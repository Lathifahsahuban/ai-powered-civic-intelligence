import {useState,useEffect,useCallback} from 'react';
import {Header} from './components/Header';
import {BottomNav,type TabId} from './components/BottomNav';
import {OverviewView} from './components/OverviewView';
import {MapView} from './components/MapView';
import {ReportView} from './components/ReportView';
import {RiskView} from './components/RiskView';
import {BackendModal} from './components/BackendModal';
import {NotificationsModal} from './components/NotificationsModal';
import {IncidentCard} from './components/IncidentCard';
import type {DashboardStats,Incident,BackendHealth} from './types';
import {fetchHealth,fetchDashboardStats,fetchIncidents} from './services/api';
export default function App(){
 const [tab,setTab]=useState<TabId>('overview'),[stats,setStats]=useState<DashboardStats|null>(null),[health,setHealth]=useState<BackendHealth|null>(null),[incidents,setIncidents]=useState<Incident[]>([]);
 const [backend,setBackend]=useState(false),[notifications,setNotifications]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[category,setCategory]=useState('');
 const [focus,setFocus]=useState<number|null>(()=>{const id=new URLSearchParams(window.location.search).get('incident');return id?Number(id):null;});
 const load=useCallback(async()=>{try{const [h,s,list]=await Promise.all([fetchHealth(),fetchDashboardStats(),fetchIncidents()]);setHealth(h);setStats(s);setIncidents(list);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer);},[load]);
 const selected=incidents.find(i=>i.id===focus);
 return <div className="min-h-screen bg-background text-on-surface font-body-md"><Header currentTab={tab} health={health} onOpenBackendModal={()=>setBackend(true)} onOpenNotifications={()=>setNotifications(true)} unreadCount={incidents.filter(i=>i.review_needed&&!i.reviewed).length}/>
 <main>{loading&&<div role="status" className="view">Loading saved incidents…</div>}{error&&<div role="alert" className="view"><div className="error">Could not refresh data: {error}. Previously loaded data may be stale.<button className="btn secondary ml-2" onClick={load}>Retry</button></div></div>}
 {!loading&&focus!==null&&<div className="view space-y-3"><button className="btn secondary" onClick={()=>{setFocus(null);history.replaceState({},'',location.pathname);}}>Close focused incident</button>{selected?<IncidentCard incident={selected} onRefresh={load}/>:<p>Incident not found in saved reports.</p>}</div>}
 {!loading&&tab==='overview'&&stats&&<OverviewView stats={stats} incidents={incidents} onRefresh={load} onReport={()=>setTab('report')} onMap={()=>setTab('map')}/>}
 {tab==='report'&&<ReportView onRefresh={load} onTriageSubmitted={load}/>}
 {!loading&&tab==='map'&&<MapView incidents={incidents} onRefresh={load}/>}
 {!loading&&tab==='risk'&&stats&&<RiskView stats={stats} incidents={incidents} onRefresh={load} selectedCategory={category} onCategoryChange={setCategory}/>}</main>
 <BottomNav activeTab={tab} onTabChange={t=>{setTab(t);setFocus(null);}}/><BackendModal isOpen={backend} onClose={()=>setBackend(false)} health={health} onRefreshHealth={load}/><NotificationsModal isOpen={notifications} onClose={()=>setNotifications(false)} incidents={incidents} onNavigateToIncident={id=>setFocus(id)}/></div>;
}
