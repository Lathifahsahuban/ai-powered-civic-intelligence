import React, { useState } from 'react';
import { Incident, RiskCategory } from '../types';

interface RiskViewProps {
  categories?: RiskCategory[];
  incidents: Incident[];
  onSelectCategory: (category: RiskCategory) => void;
  onQuickReportCategory: (categoryTitle: string) => void;
}

interface MonitoredTopic {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  defaultCritical?: boolean;
}

export const MONITORED_TOPICS: MonitoredTopic[] = [
  { id: 'waterlogging', title: 'Waterlogging & Flooding', icon: 'flood', color: 'blue', description: 'Monsoon inundation, curb stagnation, and street water pooling' },
  { id: 'drainage', title: 'Blocked Drains & Sewage Overflow', icon: 'water_damage', color: 'cyan', description: 'Clogged storm gratings, silted culverts, and sewage surcharge' },
  { id: 'garbage', title: 'Garbage Accumulation & Waste Management', icon: 'delete_outline', color: 'amber', description: 'Overflowing dumpsters, roadside debris, and solid waste stagnation' },
  { id: 'potholes', title: 'Potholes & Damaged Roads', icon: 'crisis_alert', color: 'orange', description: 'Asphalt cavities, road sinkages, and commuter hazard craters' },
  { id: 'streetlights', title: 'Streetlight Failures', icon: 'lightbulb', color: 'slate', description: 'Dark road corridors, damaged poles, and inactive luminaires' },
  { id: 'drinking_water', title: 'Drinking Water Problems & Leakage', icon: 'water_drop', color: 'teal', description: 'Main line pipe fractures, potable water loss, and supply contamination' },
  { id: 'trees', title: 'Fallen Trees & Dangerous Branches', icon: 'nature', color: 'emerald', description: 'Overhanging boughs, storm-uprooted trunks, and overhead wire risks' },
  { id: 'traffic', title: 'Traffic Signals & Pedestrian Safety', icon: 'traffic', color: 'purple', description: 'Signal timing faults, pedestrian refuge hazards, and zebra obstructions' },
  { id: 'manholes', title: 'Open Manholes & Damaged Drain Covers', icon: 'warning', color: 'red', description: 'Displaced chamber covers, collapsed slab cavities, and fatal drop hazards', defaultCritical: true },
  { id: 'sanitation', title: 'Public Toilets & Sanitation', icon: 'wc', color: 'blue', description: 'Facility unsanitary status, drainage backflow, and public hygiene' },
];

/**
 * AI Categorization Classifier: Maps an AI-triaged incident to one of the 10 monitored topics
 */
export function getTopicIdForIncident(incident: Incident): string {
  const issueType = (incident.result?.issue_type || '').toLowerCase();
  const desc = (incident.description || '').toLowerCase();
  const visual = (incident.result?.visual_findings || '').toLowerCase();
  const summary = (incident.result?.summary || '').toLowerCase();
  const combined = `${issueType} ${desc} ${visual} ${summary}`;

  if (issueType.includes('open_manhole') || combined.includes('manhole') || combined.includes('drain cover') || combined.includes('chamber cover')) {
    return 'manholes';
  }
  if (issueType.includes('pothole') || combined.includes('pothole') || combined.includes('cavity') || combined.includes('crater') || combined.includes('road damaged') || combined.includes('asphalt')) {
    return 'potholes';
  }
  if (issueType.includes('garbage') || combined.includes('garbage') || combined.includes('waste') || combined.includes('trash') || combined.includes('dump') || combined.includes('debris')) {
    return 'garbage';
  }
  if (issueType.includes('streetlight') || combined.includes('streetlight') || combined.includes('street light') || combined.includes('dark stretch') || combined.includes('lamp post')) {
    return 'streetlights';
  }
  if (issueType.includes('drinking') || combined.includes('drinking water') || combined.includes('pipe burst') || combined.includes('pipeline leak') || combined.includes('metro water')) {
    return 'drinking_water';
  }
  if (issueType.includes('tree') || combined.includes('fallen tree') || combined.includes('tree branch') || combined.includes('uprooted') || combined.includes('dangerous branches')) {
    return 'trees';
  }
  if (issueType.includes('traffic') || combined.includes('traffic signal') || combined.includes('pedestrian') || combined.includes('zebra crossing') || combined.includes('traffic light')) {
    return 'traffic';
  }
  if (issueType.includes('toilet') || issueType.includes('sanitation') || combined.includes('public toilet') || combined.includes('sanitation') || combined.includes('urinal')) {
    return 'sanitation';
  }
  if (combined.includes('drain') || combined.includes('sewage') || combined.includes('culvert') || combined.includes('silt') || combined.includes('overflow')) {
    return 'drainage';
  }
  if (issueType.includes('waterlog') || combined.includes('waterlog') || combined.includes('flood') || combined.includes('inundat') || combined.includes('submerged')) {
    return 'waterlogging';
  }
  return 'waterlogging';
}

export const RiskView: React.FC<RiskViewProps> = ({
  incidents,
  onSelectCategory,
  onQuickReportCategory
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Filter ONLY reports posted by users through the submit button.
  // Exclude initial demo seeds (CS-8921, CS-8922) so the Risk page contains only real user-submitted reports.
  const userSubmittedReports = incidents.filter(i => {
    if (i.user_submitted === true) return true;
    if (i.ref_code && !['CS-8921', 'CS-8922'].includes(i.ref_code) && i.user_submitted !== false) return true;
    return false;
  });

  const getIconContainerStyle = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'cyan':
        return 'bg-cyan-50 text-secondary border-cyan-100';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'orange':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'teal':
        return 'bg-teal-50 text-secondary border-teal-100';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'red':
        return 'bg-red-100 text-error border-red-200';
      default:
        return 'bg-surface-container text-primary border-outline-variant/30';
    }
  };

  // Build the live computed topic data
  const liveTopicCards = MONITORED_TOPICS.map((topic) => {
    const matchingReports = userSubmittedReports.filter((r) => getTopicIdForIncident(r) === topic.id);
    const count = matchingReports.length;

    let severityLabel: 'No Reports Yet' | 'Low Severity' | 'Medium Severity' | 'High Severity' | 'High / Critical' = 'No Reports Yet';
    let isCritical = false;

    if (count > 0) {
      const maxSeverity = Math.max(...matchingReports.map((r) => r.result?.severity || 3));
      if (maxSeverity >= 5 || topic.id === 'manholes') {
        severityLabel = 'High / Critical';
        isCritical = true;
      } else if (maxSeverity === 4) {
        severityLabel = 'High Severity';
      } else if (maxSeverity === 3) {
        severityLabel = 'Medium Severity';
      } else {
        severityLabel = 'Low Severity';
      }
    }

    return {
      topic,
      count,
      matchingReports,
      severityLabel,
      isCritical
    };
  });

  const totalUserReports = userSubmittedReports.length;
  const activeTopic = liveTopicCards.find((c) => c.topic.id === selectedTopicId);

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-2 pb-28 space-y-3">
      {/* Subheader & Active Counter */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div>
          <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
            Risk Categories
          </span>
          <p className="text-[11px] text-outline">Populated upon user incident submission</p>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/30">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span className="text-xs font-bold text-primary">
            {totalUserReports} {totalUserReports === 1 ? 'Report' : 'Reports'} Logged
          </span>
        </div>
      </div>

      {/* Real-time Status Notice */}
      <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 text-xs shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
          <span className="text-on-surface-variant text-[11px]">
            {totalUserReports === 0
              ? 'All 10 monitored topics are active. Submit a report to let AI classify severity.'
              : `${totalUserReports} citizen ${totalUserReports === 1 ? 'report' : 'reports'} analyzed and classified across active risk topics.`}
          </span>
        </div>
        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider shrink-0 bg-secondary/10 px-2 py-0.5 rounded">
          Live AI Hub
        </span>
      </div>

      {/* 10 Monitored Categories List */}
      <div className="space-y-2.5">
        {liveTopicCards.map(({ topic, count, severityLabel, isCritical }) => (
          <div
            key={topic.id}
            onClick={() => setSelectedTopicId(topic.id)}
            className={`flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl border cursor-pointer hover:border-secondary/40 active:scale-[0.99] transition-all shadow-xs ${
              isCritical && count > 0
                ? 'border-2 border-red-300 hover:border-red-400 bg-red-50/20'
                : 'border-outline-variant/30'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${getIconContainerStyle(
                  topic.color
                )}`}
              >
                <span className="material-symbols-outlined text-[22px]">{topic.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-headline-sm text-sm font-bold text-primary leading-tight truncate">
                    {topic.title}
                  </h3>
                  {isCritical && count > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-on-surface-variant font-medium">
                    {count} {count === 1 ? 'report' : 'reports'}
                  </span>
                  <span className="text-[10px] text-outline">•</span>

                  {count === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-surface-container text-on-surface-variant border border-outline-variant/30">
                      No Reports Yet
                    </span>
                  ) : severityLabel === 'High / Critical' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-error text-white">
                      High / Critical
                    </span>
                  ) : severityLabel === 'High Severity' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-50 text-error border border-red-200">
                      High Severity
                    </span>
                  ) : severityLabel === 'Medium Severity' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                      Medium Severity
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Low Severity
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0 ml-2">
              chevron_right
            </span>
          </div>
        ))}
      </div>

      {/* Category Detail Modal */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col p-5 shadow-2xl border border-outline-variant/30 space-y-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${getIconContainerStyle(
                    activeTopic.topic.color
                  )}`}
                >
                  <span className="material-symbols-outlined text-2xl">{activeTopic.topic.icon}</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-base font-bold text-primary leading-tight">
                    {activeTopic.topic.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-on-surface-variant font-medium">
                      {activeTopic.count} {activeTopic.count === 1 ? 'user report' : 'user reports'}
                    </span>
                    <span className="text-[10px] text-outline">•</span>
                    {activeTopic.count === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-surface-container text-on-surface-variant border border-outline-variant/30">
                        Monitored Topic
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          activeTopic.severityLabel === 'High / Critical'
                            ? 'bg-error text-white'
                            : activeTopic.severityLabel === 'High Severity'
                            ? 'bg-red-50 text-error border border-red-200'
                            : activeTopic.severityLabel === 'Medium Severity'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {activeTopic.severityLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTopicId(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
                type="button"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Content: Reports List or Empty State */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activeTopic.count === 0 ? (
                <div className="py-8 px-4 text-center space-y-3 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl">{activeTopic.topic.icon}</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-primary">No Reports Logged Yet</h5>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto leading-relaxed">
                      This topic is actively monitored. Once a citizen posts an incident through the Submit button,
                      our AI model will classify its severity, extract visual findings, and display the report here.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onQuickReportCategory(activeTopic.topic.title);
                      setSelectedTopicId(null);
                    }}
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-primary text-white hover:bg-secondary text-xs font-bold transition-all shadow-xs"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    File First Report for this Category
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">
                    Verified User Submissions ({activeTopic.matchingReports.length})
                  </div>
                  {activeTopic.matchingReports.map((report) => (
                    <div
                      key={report.id || report.ref_code}
                      className="p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 space-y-2.5 shadow-xs"
                    >
                      {/* Report Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            #{report.ref_code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary/10 text-secondary border border-secondary/20">
                            AI Triaged
                          </span>
                        </div>
                        <span className="text-[11px] text-outline font-medium">
                          {report.created || 'Recently filed'}
                        </span>
                      </div>

                      {/* Citizen & Location */}
                      <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">person</span>
                        <span className="font-semibold text-primary">{report.citizen_name || 'Citizen Reporter'}</span>
                        <span className="text-outline">•</span>
                        <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                        <span className="truncate">{report.location}</span>
                      </div>

                      {/* Photo & AI findings */}
                      <div className="flex gap-3 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
                        {report.photo && (
                          <img
                            src={report.photo}
                            alt={`Photo for ${report.ref_code}`}
                            className="w-16 h-16 rounded-lg object-cover border border-outline-variant/30 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="min-w-0 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-surface-container text-primary">
                              Severity {report.result?.severity || 3}/5
                            </span>
                            <span className="text-[10px] text-secondary font-bold">
                              {Math.round((report.result?.confidence || 0.92) * 100)}% AI Confidence
                            </span>
                          </div>
                          <p className="text-[11px] text-primary line-clamp-2 leading-snug">
                            {report.result?.visual_findings || report.description}
                          </p>
                        </div>
                      </div>

                      {/* Citizen Description */}
                      {report.description && (
                        <p className="text-xs text-on-surface-variant italic bg-surface-container-lowest/50 px-2 py-1 rounded">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex gap-2 pt-2 border-t border-surface-container">
              <button
                onClick={() => {
                  const asCat: RiskCategory = {
                    id: activeTopic.topic.id,
                    title: activeTopic.topic.title,
                    reports: activeTopic.count,
                    severity: activeTopic.count > 0 ? (activeTopic.severityLabel.replace(' Severity', '') as any) : 'Low',
                    icon: activeTopic.topic.icon,
                    color: activeTopic.topic.color,
                    critical: activeTopic.isCritical
                  };
                  onSelectCategory(asCat);
                  setSelectedTopicId(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-lg border border-secondary text-secondary hover:bg-surface-container-low text-xs font-bold transition-all active:scale-95 text-center"
                type="button"
              >
                View on Map
              </button>
              <button
                onClick={() => {
                  onQuickReportCategory(activeTopic.topic.title);
                  setSelectedTopicId(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-lg bg-primary text-white hover:bg-secondary text-xs font-bold transition-all active:scale-95 shadow-xs text-center"
                type="button"
              >
                + File Report in this Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
