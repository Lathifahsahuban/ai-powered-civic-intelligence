import React from 'react';
import { BackendHealth } from '../types';
import { LiveClock } from './LiveClock';

interface HeaderProps {
  currentTab: string;
  onOpenBackendModal: () => void;
  onOpenNotifications: () => void;
  health: BackendHealth | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenBackendModal,
  onOpenNotifications,
  health,
  unreadCount = 2
}) => {
  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant/30 shadow-sm transition-colors duration-150">
      <div className="flex justify-between items-center w-full px-4 py-2.5 max-w-xl mx-auto">
        {/* Leading Hub & Brand Anchor */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBackendModal}
            title="Inspect Backend & AI Model Connectivity"
            aria-label="Backend & AI Connectivity"
            className="flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-surface-container-high active:scale-95 transition-all"
            type="button"
          >
            <span
              className="material-symbols-outlined text-secondary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hub
            </span>
          </button>
          <div className="flex flex-col">
            <span className="font-headline-sm text-base font-bold text-primary tracking-tight leading-none">
              CIVIC SENTRA
            </span>
            <span className="text-[11px] font-medium text-secondary tracking-wide mt-0.5">
              {currentTab === 'map'
                ? 'Urban Telemetry & Safety'
                : currentTab === 'risk'
                ? 'Live Telemetry'
                : 'See It. Report It. Resolve It.'}
            </span>
          </div>
        </div>

        {/* Ward Location & Trailing Actions */}
        <div className="flex items-center gap-2">
          {/* Ward Location Pill (visible on xs+ screens) */}
          <div className="flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/30 text-[11px] font-semibold text-primary">
            <span className="material-symbols-outlined text-[15px] text-secondary">
              location_on
            </span>
            <span className="truncate max-w-[110px]">Ward 178, Chennai</span>
          </div>

          {/* Backend Status Dot / Modal Trigger */}
          <button
            onClick={onOpenBackendModal}
            title="View Python Backend & Ollama Status"
            className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-primary transition-all active:scale-95"
            type="button"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.ollama_ready || health?.gemini_ready
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              } animate-pulse`}
            />
            <span>API {health?.ollama_ready ? 'Ollama' : 'Cloud'}</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative flex items-center justify-center p-2 rounded-lg text-primary hover:bg-surface-container-high active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
            )}
          </button>

          {/* Profile Badge */}
          <button
            onClick={onOpenBackendModal}
            aria-label="Civic Profile & Backend Settings"
            className="w-7 h-7 rounded-full bg-primary-container text-surface-container-lowest flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-secondary transition-all active:scale-95"
            type="button"
          >
            VS
          </button>
        </div>
      </div>

      {/* Global Live Clock Telemetry Strip */}
      <div className="bg-surface-container-low/80 border-t border-outline-variant/20 px-4 py-1 text-center">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <LiveClock compact={true} />
          <span className="text-[10px] font-semibold text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">public</span>
            <span>Chennai Ward 178 Telemetry</span>
          </span>
        </div>
      </div>
    </header>
  );
};
