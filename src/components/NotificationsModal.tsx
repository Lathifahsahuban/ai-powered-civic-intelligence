import React from 'react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToIncident: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToIncident
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Rapid Cell Crew Dispatched',
      description: 'GCDA Emergency Drainage Unit #04 en route with de-watering pumps to 100ft Bypass Rd.',
      time: '14 mins ago',
      type: 'dispatch',
      unread: true,
      ref: 'CS-8921'
    },
    {
      id: 2,
      title: 'High Consensus Reached',
      description: '142 neighbors confirmed Waterlogging & Drain Block near Velachery Lake junction.',
      time: '28 mins ago',
      type: 'consensus',
      unread: true,
      ref: 'CS-8921'
    },
    {
      id: 3,
      title: 'Ward 178 Telemetry Alert',
      description: 'Flood Grid sensor Velachery Basin recorded water level rise +0.42m.',
      time: '1 hour ago',
      type: 'telemetry',
      unread: false,
      ref: 'TELEMETRY'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-primary/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-5 shadow-2xl border border-outline-variant/30 space-y-4 mt-12 sm:mt-0">
        <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">notifications</span>
            <h3 className="font-headline-sm text-base font-bold text-primary">Ward 178 Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNavigateToIncident();
                onClose();
              }}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 cursor-pointer active:scale-[0.99] transition-all space-y-1 relative"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-xs font-bold text-primary flex items-center gap-1.5">
                  {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-error" />}
                  {n.title}
                </span>
                <span className="text-[10px] text-on-surface-variant">{n.time}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{n.description}</p>
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="font-mono text-secondary font-bold">#{n.ref}</span>
                <span className="text-secondary font-semibold flex items-center gap-0.5">
                  View Incident <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-all active:scale-95"
          type="button"
        >
          Close Alerts
        </button>
      </div>
    </div>
  );
};
