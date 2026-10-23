import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, TabId } from './components/BottomNav';
import { OverviewView } from './components/OverviewView';
import { MapView } from './components/MapView';
import { ReportView } from './components/ReportView';
import { RiskView } from './components/RiskView';
import { BackendModal } from './components/BackendModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DashboardStats, Incident, BackendHealth, RiskCategory } from './types';
import { fetchHealth, fetchDashboardStats, fetchIncidents, agreeIncident } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [reportPreloadedPhoto, setReportPreloadedPhoto] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const loadData = async () => {
    try {
      const [h, s, incs] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchDashboardStats().catch(() => null),
        fetchIncidents().catch(() => [])
      ]);
      if (h) setHealth(h);
      if (s) setStats(s);
      if (incs && incs.length > 0) {
        setIncidents(incs);
        setSelectedIncident(incs[0]);
      }
    } catch (e) {
      console.error('Error loading initial civic telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAgree = async (incidentId: number) => {
    try {
      const res = await agreeIncident(incidentId);
      // Update in state
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === incidentId ? { ...item, consensus_count: res.consensus_count } : item
        )
      );
      if (stats) {
        setStats({
          ...stats,
          consensus_people: stats.consensus_people + 1
        });
      }
      showToast('Consensus Recorded (+1)! Thank you for verifying this hazard.');
    } catch (err: any) {
      showToast(err.message || 'Agreement failed');
    }
  };

  const handleShare = (incidentOrRef: Incident | string) => {
    const text =
      typeof incidentOrRef === 'string'
        ? `Civic Sentra Hazard Alert: Ref #${incidentOrRef} at Ward 178 Chennai.`
        : `Civic Sentra Hazard Alert: #${incidentOrOrRefCode(incidentOrRef)} - ${incidentOrRef.description}`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Civic Sentra Alert',
          text,
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Alert link copied to clipboard!');
    }
  };

  const incidentOrOrRefCode = (i: Incident) => i.ref_code || `CS-${i.id}`;

  const primaryIncident = incidents.find((i) => i.ref_code === 'CS-8921') || incidents[0] || null;
  const secondaryIncident = incidents.find((i) => i.ref_code === 'CS-8922') || incidents[1] || null;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md antialiased selection:bg-secondary-container selection:text-primary">
      {/* Shared Anchor Header */}
      <Header
        currentTab={currentTab}
        health={health}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main View Switcher */}
      <main className="flex-1 w-full">
        {currentTab === 'overview' && (
          <OverviewView
            stats={stats}
            incident={primaryIncident}
            onAgree={handleAgree}
            onNavigateToMap={() => setCurrentTab('map')}
            onNavigateToReport={(photo) => {
              setReportPreloadedPhoto(photo);
              setCurrentTab('report');
            }}
            onShare={handleShare}
          />
        )}

        {currentTab === 'map' && (
          <MapView
            primaryIncident={primaryIncident}
            secondaryIncident={secondaryIncident}
            onAgree={handleAgree}
            onShare={handleShare}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              showToast(`Focused on #${inc.ref_code}: ${inc.location}`);
            }}
          />
        )}

        {currentTab === 'report' && (
          <ReportView
            initialPhoto={reportPreloadedPhoto}
            onNavigateToMap={() => setCurrentTab('map')}
            onShare={(refCode) => handleShare(refCode)}
            onTriageSubmitted={(newInc) => {
              const userInc = { ...newInc, user_submitted: true };
              setIncidents((prev) => [userInc, ...prev]);
              if (stats) {
                setStats({
                  ...stats,
                  total_reports: stats.total_reports + 1
                });
              }
              showToast(`Report #${userInc.ref_code} submitted and analyzed successfully! Added to Risk Page.`);
            }}
          />
        )}

        {currentTab === 'risk' && (
          <RiskView
            categories={stats?.categories || []}
            incidents={incidents}
            onSelectCategory={(cat: RiskCategory) => {
              showToast(`Filtered by ${cat.title} on Live Map`);
              setCurrentTab('map');
            }}
            onQuickReportCategory={(title: string) => {
              setCurrentTab('report');
              showToast(`Filing report for: ${title}`);
            }}
          />
        )}
      </main>

      {/* Shared Bottom Navigation */}
      <BottomNav activeTab={currentTab} onTabChange={setCurrentTab} />

      {/* Modals & Dialogs */}
      <BackendModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        health={health}
        onRefreshHealth={loadData}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToIncident={() => setCurrentTab('overview')}
      />

      {/* Toast Notification Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-primary-container text-white px-4 py-2 rounded-xl shadow-lg border border-secondary/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="material-symbols-outlined text-secondary-fixed text-base">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
