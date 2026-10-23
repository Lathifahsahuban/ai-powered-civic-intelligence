import React from 'react';

export type TabId = 'overview' | 'map' | 'report' | 'risk';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2 pb-safe bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-2px_12px_rgba(20,45,58,0.06)]"
    >
      {/* 1. Overview */}
      <button
        onClick={() => onTabChange('overview')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-95 transition-all ${
          activeTab === 'overview'
            ? 'text-secondary font-bold'
            : 'text-on-surface-variant hover:text-secondary font-medium'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'overview' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          dashboard
        </span>
        <span className="text-[11px] mt-0.5">Overview</span>
      </button>

      {/* 2. Map */}
      <button
        onClick={() => onTabChange('map')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-95 transition-all ${
          activeTab === 'map'
            ? 'text-secondary font-bold'
            : 'text-on-surface-variant hover:text-secondary font-medium'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'map' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          map
        </span>
        <span className="text-[11px] mt-0.5">Map</span>
      </button>

      {/* 3. Report */}
      <button
        onClick={() => onTabChange('report')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-95 transition-all ${
          activeTab === 'report'
            ? 'text-secondary font-bold'
            : 'text-on-surface-variant hover:text-secondary font-medium'
        }`}
        type="button"
      >
        <div className="relative">
          <span
            className="material-symbols-outlined text-[26px] text-secondary"
            style={activeTab === 'report' ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            add_circle
          </span>
        </div>
        <span className="text-[11px] mt-0.5">Report</span>
      </button>

      {/* 4. Risk */}
      <button
        onClick={() => onTabChange('risk')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-95 transition-all ${
          activeTab === 'risk'
            ? 'text-secondary font-bold'
            : 'text-on-surface-variant hover:text-secondary font-medium'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={activeTab === 'risk' ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          analytics
        </span>
        <span className="text-[11px] mt-0.5">Risk</span>
      </button>
    </nav>
  );
};
