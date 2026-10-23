import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  userCoordinates?: { lat: number; lng: number } | null;
  className?: string;
  compact?: boolean;
}

/**
 * LiveClock component:
 * - Updates every second (1000ms)
 * - Displays Date in DD MMMM YYYY format (e.g. 23 October 2026)
 * - Displays Time in HH:MM:SS format using 24-hour clock (e.g. 17:48:32)
 * - Location-aware timezone formatting (IST UTC+05:30 for Indian coordinates, or browser timezone)
 */
export const LiveClock: React.FC<LiveClockProps> = ({
  userCoordinates,
  className = '',
  compact = false
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine timezone based on location or browser
  const isIndia =
    userCoordinates &&
    userCoordinates.lat >= 6 &&
    userCoordinates.lat <= 38 &&
    userCoordinates.lng >= 68 &&
    userCoordinates.lng <= 98;

  // Browser timezone
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  // Format offset string e.g. UTC+05:30
  const getOffsetString = (d: Date) => {
    const offsetMin = -d.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMin);
    const hrs = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mins = String(absMin % 60).padStart(2, '0');
    return `UTC${sign}${hrs}:${mins}`;
  };

  const tzAbbr = isIndia || browserTz === 'Asia/Kolkata' ? 'IST' : browserTz.split('/').pop()?.replace(/_/g, ' ') || 'Local';
  const tzString = `${tzAbbr} (${getOffsetString(now)})`;

  // Format Date: DD MMMM YYYY (e.g. "23 October 2026")
  const day = String(now.getDate()).padStart(2, '0');
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const dateFormatted = `${day} ${monthName} ${year}`;

  // Format Time: HH:MM:SS 24-hour clock
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeFormatted = `${hours}:${minutes}:${seconds}`;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-primary">{dateFormatted}</span>
        <span className="text-secondary font-bold">{timeFormatted}</span>
        <span className="text-[10px] text-on-surface-variant font-sans">[{tzString}]</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-lowest p-2.5 sm:p-3 rounded-xl border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
              Live Dashboard Clock
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-primary font-headline-sm tracking-tight">
            {dateFormatted}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/20">
        <span className="font-mono text-xs sm:text-sm font-bold text-primary tabular-nums tracking-wide">
          {timeFormatted}
        </span>
        <span className="text-[10px] text-secondary font-semibold bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30">
          {tzString}
        </span>
      </div>
    </div>
  );
};
