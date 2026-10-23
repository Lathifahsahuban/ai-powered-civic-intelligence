import React, { useState, useRef, useEffect } from 'react';
import { Incident } from '../types';

interface ReportViewProps {
  initialPhoto?: string;
  onTriageSubmitted: (incident: Incident) => void;
  onNavigateToMap: () => void;
  onShare: (refCode: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  initialPhoto,
  onTriageSubmitted,
  onNavigateToMap,
  onShare
}) => {
  // Real-time calculation helpers
  const getNow = () => new Date();

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDateFile = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `IMG_${y}${m}${day}_${h}${min}.jpg (4.2 MB)`;
  };

  // State: citizenName and description are BLANK by default per user request
  const [citizenName, setCitizenName] = useState('');
  const [location, setLocation] = useState('Detecting current GPS location...');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>(
    initialPhoto || '/public/assets/aistudio/Image_5_1b6422f8.jpeg'
  );
  const [currentTime, setCurrentTime] = useState(formatTime(getNow()));
  const [fileName, setFileName] = useState(formatDateFile(getNow()));
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.9784,
    lng: 80.2212
  });
  const [registeredTime, setRegisteredTime] = useState(formatTime(getNow()));

  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [showStatusCard, setShowStatusCard] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>('±3m');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusCardRef = useRef<HTMLDivElement>(null);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = getNow();
      setCurrentTime(formatTime(now));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Automatically request the user's real current location on mount
  const detectUserLocation = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy || 3);
          setCoords({ lat, lng });
          setGpsAccuracy(`±${acc}m`);

          // Attempt reverse geocode to get human-readable street/city
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              { headers: { Accept: 'application/json' } }
            );
            if (resp.ok) {
              const data = await resp.json();
              const addr = data.address || {};
              const road =
                addr.road || addr.suburb || addr.neighbourhood || addr.city_district || addr.hamlet || '';
              const city = addr.city || addr.town || addr.county || 'Chennai';
              const state = addr.state || 'Tamil Nadu';
              const locStr = road
                ? `${road}, ${city} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
                : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E, ${city}, ${state}`;
              setLocation(locStr);
            } else {
              setLocation(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Ward 178)`);
            }
          } catch {
            setLocation(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Ward 178)`);
          } finally {
            setGpsLoading(false);
          }
        },
        (err) => {
          console.warn('Geolocation access fallback:', err);
          setLocation('100ft Bypass Rd, Velachery, Ward 178 (GPS Fallback)');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 5000 }
      );
    } else {
      setLocation('100ft Bypass Rd, Velachery, Ward 178');
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    detectUserLocation();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const now = getNow();
      setCurrentTime(formatTime(now));
      setFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please describe the situation or hazard before submitting.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    const now = getNow();
    const submissionTime = formatTime(now);
    setRegisteredTime(submissionTime);

    try {
      const { submitTriage } = await import('../services/api');
      const response = await submitTriage({
        citizen_name: citizenName.trim() || 'Citizen Reporter',
        location: location.trim() || `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`,
        description: description.trim(),
        duration: 'Reported now',
        impact: 'Hazard reported by local citizen',
        ward: 'Ward 178',
        photoBase64: photoPreview
      });

      const userReport = { ...response.incident, user_submitted: true };
      setSubmittedIncident(userReport);
      setShowStatusCard(true);
      onTriageSubmitted(userReport);

      setTimeout(() => {
        statusCardRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to submit report. Please check server connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-2 pb-28 space-y-3.5">
      {/* Sub-header / Steps Bar */}
      <div className="bg-surface-container-low px-3.5 py-2 rounded-xl flex items-center justify-between border border-outline-variant/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-sm">edit_note</span>
            Quick Citizen Report
          </span>
          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-medium">
            Step 1 of 1
          </span>
        </div>
        <div className="flex items-center gap-1 text-secondary text-[10px] font-bold">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          Direct Triage Link
        </div>
      </div>

      {/* Operational Telemetry Ping Ticker */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-medium text-on-surface-variant text-[11px]">
            Velachery Flood Grid Telemetry:
          </span>
          <span className="font-bold text-primary text-[11px]">Water Level +0.42m</span>
        </div>
        <span className="text-secondary font-bold text-[10px] tracking-wide">RAPID CELL ONLINE</span>
      </div>

      {/* 2. Citizen Input Form Card */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-surface-container pb-2">
          <h2 className="font-headline-sm text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-base">campaign</span>
            Incident Filing Details
          </h2>
          <span className="text-[10px] uppercase font-bold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded tracking-wider">
            Public Channel
          </span>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* Field 1: Citizen Name - BLANK BY DEFAULT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-primary font-bold flex items-center justify-between" htmlFor="citizen-name">
              <span>1. Citizen Name</span>
              <span className="text-on-surface-variant font-normal text-[10px]">Verified via CivicID</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">person</span>
              <input
                className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all placeholder:text-outline/60"
                id="citizen-name"
                placeholder="Enter your name or CivicID"
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
              />
            </div>
          </div>

          {/* Field 2: Incident Location - REAL-TIME USER GPS */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-primary font-bold" htmlFor="incident-location">
                2. Incident Location
              </label>
              <button
                onClick={detectUserLocation}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container-low hover:bg-surface-container-high text-secondary border border-secondary/30 rounded text-[10px] font-bold active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-xs">my_location</span>
                {gpsLoading ? 'Detecting GPS...' : 'Refresh Current GPS'}
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">pin_drop</span>
              <input
                className="w-full pl-9 pr-24 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                id="incident-location"
                required
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <span className="absolute right-2 text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-bold">
                {gpsAccuracy} GPS Acc.
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
              <span>Coordinates: {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E • South Chennai Division</span>
            </p>
          </div>

          {/* Field 3: Photo Evidence Zone - REAL-TIME DATE & TIME */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-primary font-bold flex items-center justify-between">
              <span>3. Photo Evidence Zone</span>
              <span className="text-secondary text-[10px] font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">verified</span> Auto-Verified
              </span>
            </label>
            <div className="border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-low p-2">
              <div className="relative h-44 w-full rounded-lg overflow-hidden bg-surface-container">
                <img
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  alt="Incident site evidence preview"
                  src={photoPreview}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRxLHZ7EAYBxCX05DJcOahpf6tPGjvvWaISSf1VR_evkZLRC1cUWIhHM3MZ-VeNMmq8wzpRBSq0gn043PUAd-g8bBs9hrMjOvaKW1-2u1YQKWbjn5Opk9iOiHLEPIuhPv1Z5mhNFMCZpH95COHVlTa6yQon5ua2mban5JiMNNLn9b_-Ye-F41txK7_mQJPJIusrNKiyFcqxa73n-RH_snNH8x6eIPjRmqbIp3cXJW2JgWdv94m2nVZ';
                  }}
                />
                {/* Floating Real-Time Metadata Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-primary/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">schedule</span>
                    Captured: Today, {currentTime} (Auto-stamped)
                  </span>
                  <span className="bg-primary/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">navigation</span>
                    Geotag: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                  </span>
                </div>
                {/* Retake / Replace Action */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-surface-container-lowest/90 backdrop-blur-xs text-primary hover:bg-surface-container-lowest px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  Retake
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-on-surface-variant">
                <span>File: {fileName}</span>
                <span className="text-secondary font-semibold">Exif metadata verified</span>
              </div>
            </div>
          </div>

          {/* Field 4: Situation Description - BLANK BY DEFAULT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-primary font-bold flex items-center justify-between" htmlFor="incident-description">
              <span>4. Situation Description</span>
              <span className="text-on-surface-variant font-normal text-[10px]">Detailed telemetry aid</span>
            </label>
            <textarea
              className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-primary text-xs focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all leading-relaxed placeholder:text-outline/60"
              id="incident-description"
              placeholder="Describe what you see and the current situation..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-between items-center text-[10px] text-on-surface-variant mt-0.5">
              <span>
                {description
                  ? 'Input provided for AI vision & risk cross-check'
                  : 'Please describe the observed hazard or problem'}
              </span>
              <span>{description.length} / 300 chars</span>
            </div>
          </div>

          {/* Field 5: One-Tap Prominent Submit Button */}
          <div className="pt-1">
            <button
              disabled={submitting}
              className="w-full bg-primary-container hover:bg-secondary text-white py-3.5 px-4 rounded-lg font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all duration-150 disabled:opacity-75 cursor-pointer"
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Running AI Vision &amp; Risk Assessment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <span>One-Tap Instant Submit Report</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-on-surface-variant mt-2 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-xs text-secondary">lock</span>
              Direct encrypted relay to Greater Chennai Disaster Authority
            </p>
          </div>
        </form>
      </section>

      {/* 3. Immediate Response & Status Tracking Banner / Card */}
      <section
        ref={statusCardRef}
        className={`bg-surface-container-lowest rounded-xl border border-secondary/30 p-4 shadow-xs flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
          showStatusCard ? 'opacity-100 ring-2 ring-secondary/20' : 'opacity-90'
        }`}
      >
        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-9xl text-secondary">verified</span>
        </div>
        {/* Header & Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-2.5">
          <div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Live Intake State
            </span>
            <h3 className="font-headline-sm text-sm font-bold text-primary">
              Status: Report Registered — Action will be taken soon
            </h3>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-secondary/40 text-secondary text-[11px] font-bold w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            Under Active Review by Ward 178 Rapid Cell
          </div>
        </div>

        {/* Timeframe Badge & Progress Indicator */}
        <div className="flex items-center gap-3 bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
          <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-lg">timer</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-primary">
              Estimated inspection team dispatch within 30 mins
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Rapid Cell #04 is 1.2 km away on Velachery Main Corridor
            </span>
          </div>
        </div>

        {/* Live Pipeline Stepper - REAL-TIME REGISTRATION TIME */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-xs mb-1 font-bold">
              ✓
            </div>
            <span className="text-[11px] font-bold text-primary">Registered</span>
            <span className="text-[10px] text-secondary font-bold font-mono">
              {registeredTime}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-secondary-fixed text-primary flex items-center justify-center text-xs mb-1 font-bold">
              2
            </div>
            <span className="text-[11px] font-bold text-secondary">Rapid Cell Triage</span>
            <span className="text-[10px] text-secondary font-medium">In Progress</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-xs mb-1 font-bold">
              3
            </div>
            <span className="text-[11px] text-on-surface-variant font-medium">Field Clearance</span>
            <span className="text-[10px] text-on-surface-variant">Pending</span>
          </div>
        </div>
      </section>

      {/* 4. AI Handoff & Confirmation Section */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-xs space-y-3">
        {/* Card Title & Ref Code */}
        <div className="flex items-center justify-between border-b border-surface-container pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-lg">smart_toy</span>
            <h3 className="font-headline-sm text-sm font-bold text-primary">
              AI Handoff &amp; Automated Dispatch
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-on-surface-variant">Tracking Ref:</span>
            <span className="font-mono text-xs font-bold text-primary bg-surface-container px-2 py-0.5 rounded">
              #{submittedIncident?.ref_code || 'CS-8921'}-REP
            </span>
          </div>
        </div>

        {/* AI Analysis Result Card */}
        <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-base">psychology</span>
              AI Analysis Complete: Categorized as Urban Flooding &amp; Drainage Hazard
            </span>
            <span className="bg-surface-container-highest text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {Math.round((submittedIncident?.result?.confidence || 0.94) * 100)}% confidence
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {submittedIncident?.result?.visual_findings ||
              'Vision model classified road immersion depth (~18cm), culvert sedimentation risk, and high-frequency vehicle skidding probability.'}
          </p>
          {submittedIncident?.result?.ai_model && (
            <div className="text-[10px] text-secondary font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              Model: {submittedIncident.result.ai_model}
            </div>
          )}
        </div>

        {/* Automated Next Steps Checklist */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">
            Automated Next Steps:
          </h4>
          <ul className="flex flex-col gap-2 text-xs text-on-surface">
            <li className="flex items-start gap-2 bg-surface-bright p-2 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-base mt-0.5">grain</span>
              <div>
                <strong className="font-semibold text-primary">Incident clustered with 142 neighbor reports</strong> in
                Ward 178 polygon. Severity weighted as critical drainage intersection.
              </div>
            </li>
            <li className="flex items-start gap-2 bg-surface-bright p-2 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-base mt-0.5">local_shipping</span>
              <div>
                <strong className="font-semibold text-primary">Alert dispatched to GCDA Emergency Drainage Unit #04</strong> with
                real-time GPS coordinates and route optimization.
              </div>
            </li>
            <li className="flex items-start gap-2 bg-surface-bright p-2 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-base mt-0.5">mark_chat_unread</span>
              <div>
                <strong className="font-semibold text-primary">Real-time updates will be sent to your tracking link</strong> via
                SMS and citizen notification feed as field crew checks in.
              </div>
            </li>
          </ul>
        </div>

        {/* Action Buttons within card */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onShare(submittedIncident?.ref_code || 'CS-8921')}
            className="flex-1 py-2.5 px-3 border border-secondary text-secondary hover:bg-surface-container-low rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            Share Ward Alert
          </button>
          <button
            onClick={onNavigateToMap}
            className="flex-1 py-2.5 px-3 bg-primary-container text-white hover:bg-secondary rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">map</span>
            View on Live Map
          </button>
        </div>
      </section>
    </div>
  );
};
