import React, { useState } from 'react';
import { DashboardStats, Incident } from '../types';
import { LiveClock } from './LiveClock';

interface OverviewViewProps {
  stats: DashboardStats | null;
  incident: Incident | null;
  onAgree: (incidentId: number) => Promise<void>;
  onNavigateToMap: () => void;
  onNavigateToReport: (preloadedPhoto?: string) => void;
  onShare: (incident: Incident) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  incident,
  onAgree,
  onNavigateToMap,
  onNavigateToReport,
  onShare,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

  const handleAgreeClick = async () => {
    if (!incident || agreed || agreeing) return;
    setAgreeing(true);
    try {
      await onAgree(incident.id);
      setAgreed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setAgreeing(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onNavigateToReport(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onNavigateToReport();
    }
  };

  const totalReportsCount = stats?.total_reports ? stats.total_reports.toLocaleString() : '1,428';
  const consensusCount = incident?.consensus_count || stats?.consensus_people || 142;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-3 pb-24 space-y-3.5">
      {/* Location Pill for Mobile */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-1.5 text-secondary">
          <span className="material-symbols-outlined text-[18px]">location_on</span>
          <span className="text-xs font-bold text-on-surface">Ward 178, Chennai</span>
        </div>
        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20">
          Zone 13 South
        </span>
      </div>

      {/* Prominent Live Date & Time Clock (Real-time client-side clock updating every second) */}
      <LiveClock />

      {/* 2. SIMPLE PHOTO UPLOAD BAR */}
      <section aria-label="Upload photo of your area">
        <div className="relative group bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 border-2 border-dashed border-secondary/40 hover:border-secondary rounded-xl p-3.5 text-center shadow-sm">
          <input
            accept="image/*"
            aria-label="Choose Photo"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            type="file"
            onChange={handlePhotoSelect}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform duration-150 flex-shrink-0">
                <span className="material-symbols-outlined text-[26px]">photo_camera</span>
              </div>
              <div>
                <p className="font-headline-sm text-primary text-sm sm:text-base font-bold leading-tight">
                  Upload photo of your area
                </p>
                <p className="text-on-surface-variant text-xs mt-0.5">
                  Instant geo-tag &amp; AI issue detection
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 bg-secondary text-on-secondary px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm group-hover:bg-primary-container transition-colors flex-shrink-0">
              <span>Choose</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TWO KEY STAT BOXES */}
      <section aria-label="Community Key Metrics" className="grid grid-cols-2 gap-2.5">
        {/* Box 1: Total Reports So Far */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                Total Reports
              </span>
              <span className="material-symbols-outlined text-[18px] text-outline">query_stats</span>
            </div>
            <div className="font-headline-sm text-2xl font-bold text-primary tracking-tight">
              {totalReportsCount}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-on-surface-variant flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Chennai Ward 178</span>
          </div>
        </div>

        {/* Box 2: Consensus (Highlight Feature) */}
        <div className="bg-primary-container text-on-primary p-3.5 rounded-xl border border-secondary/30 relative overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-secondary/30 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed-variant px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">group</span>
                Consensus
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary-fixed-dim">
                verified
              </span>
            </div>
            <div className="font-headline-sm text-2xl font-bold text-on-primary tracking-tight">
              {consensusCount} people
            </div>
          </div>
          <div className="mt-2 text-[11px] text-on-primary-container font-medium">
            Reported the same issue
          </div>
        </div>
      </section>

      {/* 4. SEVERITY LEVEL INDICATOR & 5. CURRENT STATUS */}
      <section
        aria-label="Incident Severity and Status"
        className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 space-y-3.5 shadow-xs"
      >
        {/* Incident Overview Title */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div>
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
              Incident #{incident?.ref_code || 'CS-8921'}
            </span>
            <h2 className="font-headline-sm text-primary text-base font-bold">
              Waterlogging &amp; Drain Block
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
            <span className="font-semibold text-error text-[11px]">Live Focus</span>
          </span>
        </div>

        {/* 4. SEVERITY LEVEL INDICATOR (Strictly 3 levels: Low, Medium, High) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-on-surface-variant font-medium">Severity Level</span>
            <span className="text-[11px] text-error font-bold uppercase tracking-wider">
              High Priority
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Level 1: Low */}
            <div className="py-2 px-1 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant opacity-60">
              <span className="font-medium">Low</span>
            </div>
            {/* Level 2: Medium */}
            <div className="py-2 px-1 rounded-lg border border-outline-variant/30 bg-surface-container-low text-on-surface-variant opacity-60">
              <span className="font-medium">Medium</span>
            </div>
            {/* Level 3: High (ACTIVE) */}
            <div className="py-2 px-1 rounded-lg border-2 border-error bg-error-container text-on-error-container shadow-xs font-bold ring-1 ring-error/20">
              <div className="flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-error">warning</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. CURRENT SITUATION TRACKER (3 stages: Reported, On-Progress, Problem Solved) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs text-on-surface-variant font-medium">Resolution Phase</span>
            <span className="text-[11px] text-secondary font-semibold">Stage 2 of 3</span>
          </div>
          {/* 3-Step Clean Tracker */}
          <div className="relative flex items-center justify-between px-2">
            {/* Background Connecting Bar */}
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-outline-variant/30 -z-0"></div>
            {/* Completed segment progress fill */}
            <div className="absolute left-6 right-1/2 top-4 h-0.5 bg-secondary -z-0"></div>

            {/* Step 1: Reported [Completed] */}
            <div className="flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              <span className="text-[11px] font-bold text-on-surface mt-1.5">Reported</span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                {incident?.created
                  ? incident.created.replace('Today, ', '')
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>

            {/* Step 2: On-Progress [Active/Pulsing] */}
            <div className="flex flex-col items-center z-10">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full bg-secondary/20 animate-ping"></span>
                <div className="w-8 h-8 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center ring-2 ring-secondary shadow-md">
                  <span className="material-symbols-outlined text-[18px]">engineering</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-secondary mt-1.5">On-Progress</span>
              <span className="text-[10px] text-secondary font-medium">Crew Dispatched</span>
            </div>

            {/* Step 3: Problem Solved [Upcoming] */}
            <div className="flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-full bg-surface-container-low border border-outline-variant/40 text-outline flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
              </div>
              <span className="text-[11px] text-outline mt-1.5 font-medium">Problem Solved</span>
              <span className="text-[10px] text-outline">Pending</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MAP SHOWING PHOTO LOCATION & HOTSPOT */}
      <section
        aria-label="Interactive Map Area"
        className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-xs"
      >
        {/* Map Header */}
        <div className="p-3 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">explore</span>
            <span className="text-xs font-bold text-primary">Ward Geospatial Cluster</span>
          </div>
          <button
            onClick={onNavigateToMap}
            className="text-xs font-semibold text-secondary hover:underline flex items-center gap-0.5"
            type="button"
          >
            Expand Map
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>

        {/* Map Display Area */}
        <div
          onClick={onNavigateToMap}
          className="relative w-full h-52 bg-surface-container overflow-hidden cursor-pointer group"
        >
          {/* Stylized Map Base */}
          <div className="absolute inset-0 bg-[#e6edf4] opacity-90">
            {/* Arterial Road 100ft Bypass */}
            <div className="absolute top-1/2 left-0 right-0 h-6 bg-surface-container-lowest -translate-y-1/2 border-y border-outline-variant/40"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-outline-variant/60 -translate-y-1/2"></div>
            {/* Cross Street Velachery Main Rd */}
            <div className="absolute top-0 bottom-0 left-1/3 w-7 bg-surface-container-lowest -translate-x-1/2 border-x border-outline-variant/40 rotate-12"></div>
            {/* Water Channel */}
            <div className="absolute bottom-2 left-0 right-0 h-4 bg-secondary-fixed/40 border-t border-secondary-fixed-dim/60"></div>
          </div>

          {/* Hotspot Area: Shaded Zone */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-error/15 border-2 border-dashed border-error/50 flex items-center justify-center pulse-hotspot pointer-events-none">
            <span className="text-[9px] font-bold uppercase text-error tracking-wider bg-surface-container-lowest/90 px-2 py-0.5 rounded shadow-xs border border-error/30 -mt-16">
              Hotspot Area
            </span>
          </div>

          {/* Specific Photo Location Pin */}
          <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20">
            <div className="bg-primary-container text-on-primary px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-md flex items-center gap-1.5 whitespace-nowrap mb-1 ring-2 ring-surface">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
              <span>Photo location: 100ft Bypass Rd</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg ring-2 ring-surface-container-lowest">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </div>
            <div className="w-1.5 h-2 bg-secondary -mt-0.5 rounded-b-xs"></div>
          </div>

          {/* Secondary Cluster Pin */}
          <div className="absolute top-8 right-12 flex items-center gap-1 bg-surface-container-lowest/95 border border-outline-variant/40 px-2 py-0.5 rounded-full shadow-xs text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[13px] text-error">warning</span>
            <span className="text-primary font-bold">+14 reports</span>
          </div>

          {/* Clean Map Legend */}
          <div className="absolute bottom-2 left-2 bg-surface-container-lowest/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-outline-variant/30 shadow-xs flex items-center gap-3 text-[10px] font-semibold z-20">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary ring-1 ring-surface-container-lowest"></span>
              <span className="text-on-surface">Your Photo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-error/30 border border-error"></span>
              <span className="text-on-surface">Hotspot Zone</span>
            </div>
          </div>
        </div>

        {/* Map Sub-strip */}
        <div className="px-3.5 py-2 bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
          <span>Ward 178 • Velachery Drainage Corridor</span>
          <button
            onClick={onNavigateToMap}
            className="text-secondary font-semibold hover:underline inline-flex items-center gap-0.5 text-xs"
            type="button"
          >
            Interactive Map
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* 7. ACTIVE COMMUNITY REPORT CARD */}
      <section
        aria-label="Active Incident Details"
        className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-xs"
      >
        {/* Incident Image Thumbnail & Badges */}
        <div className="relative w-full h-44 bg-surface-container overflow-hidden">
          <img
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            alt="Municipal street with severe monsoon waterlogging in Velachery Chennai"
            src="/public/assets/aistudio/Image_1_07ccf57d.jpeg"
            onError={(e) => {
              // Fallback to high-res Google stitch photo link
              const target = e.target as HTMLImageElement;
              target.src =
                'https://lh3.googleusercontent.com/aida-public/AB6AXuA1OQb030NSQEYwuKof9HBz-XQtcF-35_fBen57u2xSOpX0LndTrrM7Yqos5qsUSQioQu7YvB2vR430617xsF9bthpOBRPovT10OeNB-5g_lUf5eI5pXWWCmVRdkMeTDypF3GYWdJy-Wf6BifEmIAK8tnaEylBN-3aB8vUQMqlKJKeI5jCe18QCAujbLd5wtds0RBoZR8z_sCEPvN6AMpGJiLFf5_iHD5QWrYrHHLPo0MrRRUUDT8ZD';
            }}
          />
          {/* Overlay Status Chips */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold tracking-wider bg-error text-on-error shadow-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">warning</span>
              High
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] uppercase font-bold tracking-wider bg-primary-container text-secondary-fixed shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
              On-Progress
            </span>
          </div>
          {/* Timestamp Tag */}
          <div className="absolute bottom-2.5 right-2.5 bg-primary-container/85 backdrop-blur-xs text-on-primary px-2 py-0.5 rounded text-[10px] font-medium">
            Updated 14 mins ago
          </div>
        </div>

        {/* Incident Meta Details */}
        <div className="p-3.5 space-y-2.5">
          {/* Authoritative Event Timestamp Banner */}
          <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-xs text-secondary">event_available</span>
              <span>
                <strong className="text-primary font-semibold">Recorded:</strong>{' '}
                {incident?.recorded_at || '23 October 2026, 08:15:00 IST (UTC+05:30)'}
              </span>
            </div>
            <div className="text-[10px] text-secondary font-medium">
              Last Updated: {incident?.updated_at || '23 October 2026, 08:29:12 IST (UTC+05:30)'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
              <span className="uppercase tracking-wider font-semibold text-secondary text-[11px]">
                Waterlogging &amp; Drain Block
              </span>
              <span className="text-[11px] font-mono">Ref: {incident?.ref_code || 'CS-8921'}</span>
            </div>
            <h3 className="font-headline-sm text-primary text-base font-bold leading-snug">
              Velachery Main Rd, near 100ft Bypass Junction
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {incident?.description ||
                'Heavy monsoon runoff accumulating at low-lying intersection. Municipal silt suction truck deployed; storm drain clearance underway.'}
            </p>
          </div>

          {/* Social Proof Consensus Ticker */}
          <div className="flex items-center justify-between p-2 px-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest">
                  K
                </div>
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest">
                  R
                </div>
                <div className="w-6 h-6 rounded-full bg-surface-tint text-on-primary text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-container-lowest">
                  S
                </div>
              </div>
              <span className="text-xs text-on-surface font-medium">
                <strong>{consensusCount} neighbors</strong> confirmed this
              </span>
            </div>
            <span className="text-[11px] text-secondary font-semibold">Active Zone</span>
          </div>

          {/* Action Row: "I See This Too (+1)" */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleAgreeClick}
              disabled={agreed || agreeing}
              className={`flex-1 py-2.5 px-4 rounded-lg font-headline-sm text-xs font-bold transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-xs ${
                agreed
                  ? 'bg-primary-container text-secondary-fixed cursor-default ring-1 ring-secondary'
                  : 'bg-secondary text-on-secondary hover:bg-primary-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {agreed ? 'check_circle' : 'thumb_up'}
              </span>
              <span>{agreed ? 'You Confirmed This (+1)' : 'I See This Too (+1)'}</span>
            </button>
            <button
              onClick={() => incident && onShare(incident)}
              aria-label="Share Report"
              className="p-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container active:scale-95 transition-transform"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
