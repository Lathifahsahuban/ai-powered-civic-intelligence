import {LayoutDashboard,MapPinned,CirclePlus,ChartNoAxesCombined} from 'lucide-react';
export type TabId='overview'|'map'|'report'|'risk';
export function BottomNav({activeTab,onTabChange}:{activeTab:TabId;onTabChange:(tab:TabId)=>void}){
 const tabs=[{id:'overview',name:'Overview',Icon:LayoutDashboard},{id:'map',name:'Map',Icon:MapPinned},{id:'report',name:'Report',Icon:CirclePlus},{id:'risk',name:'Risk',Icon:ChartNoAxesCombined}] as const;
 return <nav aria-label="Bottom navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/30 shadow-sm"><div className="max-w-[900px] mx-auto flex justify-around px-2 py-2">{tabs.map(({id,name,Icon})=><button key={id} aria-label={name} aria-current={activeTab===id?'page':undefined} className={`flex flex-col items-center py-1 px-3 rounded-lg active:scale-95 ${activeTab===id?'text-secondary font-bold':'text-on-surface-variant'}`} onClick={()=>onTabChange(id)}><Icon size={23} aria-hidden="true"/><span className="text-[11px] mt-1">{name}</span></button>)}</div></nav>;
}
