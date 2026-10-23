import React, { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Incident } from '../types';
import { GoogleMapsCanvas, MapMarkerItem } from './GoogleMapsCanvas';
import { LiveClock } from './LiveClock';

interface MapViewProps {
  primaryIncident: Incident | null;
  secondaryIncident: Incident | null;
  onAgree: (incidentId: number) => Promise<void>;
  onShare: (incident: Incident) => void;
  onSelectIncident: (incident: Incident) => void;
}

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCazispQdtPTboVtVXxCg4WWwOjFdk8ng4';

export const MapView: React.FC<MapViewProps> = ({
  primaryIncident,
  secondaryIncident,
  onAgree,
  onShare,
  onSelectIncident
}) => {
  const [selectedWard, setSelectedWard] = useState('178');
  const [activeFilter, setActiveFilter] = useState('all');
  const [primaryAgreed, setPrimaryAgreed] = useState(false);
  const [secondaryAgreed, setSecondaryAgreed] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);

  // FEATURE 2: User Location State (Permissions strictly triggered upon user action)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'detecting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'
  >('idle');
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);

  // User-initiated Geolocation Detection
  const handleDetectLocation = () => {
    setLocationErrorMessage(null);

    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      setLocationErrorMessage(
        'Geolocation is not supported by your current browser. You can still inspect flood risk hotspots manually on the map.'
      );
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let detectedAddress = `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`;

        // Reverse geocode via OpenStreetMap Nominatim for readable address
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { Accept: 'application/json' } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};
            const road =
              addr.road || addr.suburb || addr.neighbourhood || addr.city_district || addr.hamlet || '';
            const city = addr.city || addr.town || addr.county || 'Chennai';
            if (road) {
              detectedAddress = `${road}, ${city}`;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode fallback to coordinates:', err);
        }

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 5),
          address: detectedAddress
        });
        setLocationStatus('granted');
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setLocationErrorMessage(
            'Location permission was denied. Please allow location access in your browser settings to pinpoint your device on the map.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationStatus('unavailable');
          setLocationErrorMessage(
            'Position unavailable: GPS or network location signal could not be acquired. Please ensure device location is enabled.'
          );
        } else if (err.code === err.TIMEOUT) {
          setLocationStatus('timeout');
          setLocationErrorMessage(
            'Location request timed out. Please check your network connection and click Retry.'
          );
        } else {
          setLocationStatus('unavailable');
          setLocationErrorMessage(err.message || 'Unable to retrieve location coordinates.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAgreePrimary = async () => {
    if (!primaryIncident || primaryAgreed) return;
    try {
      await onAgree(primaryIncident.id);
      setPrimaryAgreed(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAgreeSecondary = async () => {
    if (!secondaryIncident || secondaryAgreed) return;
    try {
      await onAgree(secondaryIncident.id);
      setSecondaryAgreed(true);
    } catch (e) {
      console.error(e);
    }
  };

  const consensus1 = (primaryIncident?.consensus_count || 142) + (primaryAgreed ? 1 : 0);
  const consensus2 = (secondaryIncident?.consensus_count || 68) + (secondaryAgreed ? 1 : 0);

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-2 pb-24 space-y-3.5">
      {/* Real-time Clock Component prominently placed on Map view */}
      <LiveClock userCoordinates={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null} />

      {/* 1. LOCATION TELEMETRY & WARD SELECTOR */}
      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 shadow-xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="relative mt-1 flex-shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="beacon-ring absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-secondary font-bold">
                  {userLocation ? 'Your Location • GPS Verified' : 'Location Telemetry • Ward Sector'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#E9F6F2] text-[#16A085] border border-[#16A085]/30">
                  {userLocation ? `±${userLocation.accuracy}m Acc.` : 'Ward 178 Grid'}
                </span>
              </div>
              <p className="font-headline-sm text-sm font-bold text-primary truncate leading-snug">
                {userLocation ? userLocation.address : '100ft Bypass Rd, Velachery'}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">
                {userLocation
                  ? `Coordinates: ${userLocation.lat.toFixed(5)}° N, ${userLocation.lng.toFixed(5)}° E`
                  : `Ward ${selectedWard}, Zone 13 (Chennai South)`}
              </p>
            </div>
          </div>

          {/* Ward Switch Dropdown Trigger */}
          <div className="relative flex-shrink-0">
            <select
              aria-label="Select Ward"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="appearance-none bg-surface-container-low hover:bg-surface-container-high text-primary border border-outline-variant/30 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-lg active:scale-95 transition-all cursor-pointer focus:ring-2 focus:ring-secondary focus:outline-none"
            >
              <option value="178">Ward 178 (Velachery)</option>
              <option value="179">Ward 179 (Adyar)</option>
              <option value="180">Ward 180 (Thiruvanmiyur)</option>
              <option value="172">Ward 172 (Guindy)</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-primary text-base">
              expand_more
            </span>
          </div>
        </div>

        {/* FEATURE 2: Dedicated "Detect My Location" Action Area */}
        <div className="pt-1 border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] text-on-surface-variant leading-snug">
            {locationStatus === 'granted' ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Map centered on your real-time coordinates.
              </span>
            ) : locationStatus === 'detecting' ? (
              <span className="text-secondary font-semibold flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                Requesting browser location permission...
              </span>
            ) : (
              <span>Permission is requested only when you click Detect My Location.</span>
            )}
          </div>

          <button
            onClick={handleDetectLocation}
            disabled={locationStatus === 'detecting'}
            className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-secondary text-white text-xs font-bold py-1.5 px-3.5 rounded-lg active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-75"
            type="button"
          >
            <span className="material-symbols-outlined text-base">my_location</span>
            <span>
              {locationStatus === 'detecting'
                ? 'Locating...'
                : locationStatus === 'granted'
                ? 'Re-Detect Location'
                : 'Detect My Location'}
            </span>
          </button>
        </div>

        {/* Location Error / Denied Diagnostic Banner */}
        {locationErrorMessage && (
          <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-start gap-2 border border-error/30 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-error mt-0.5">warning</span>
            <div className="flex-1">
              <span className="font-semibold block">Location Access Issue:</span>
              <span>{locationErrorMessage}</span>
              <button
                onClick={handleDetectLocation}
                className="mt-1.5 text-[11px] font-bold text-error underline block hover:text-red-900"
                type="button"
              >
                Click to Retry Location Detection
              </button>
            </div>
          </div>
        )}

        {/* FEATURE 3: Modular Flood-Monitoring Filter Carousel */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
            }`}
            type="button"
          >
            All (6)
          </button>
          <button
            onClick={() => setActiveFilter('flood_zones')}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'flood_zones'
                ? 'bg-error text-white shadow-xs'
                : 'bg-[#FEE2E2] text-error border border-error/20 active:scale-95'
            }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Flood Zones (1)
          </button>
          <button
            onClick={() => setActiveFilter('sensors')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all ${
              activeFilter === 'sensors'
                ? 'bg-cyan-700 text-white font-bold'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-outline-variant/20 font-medium'
            }`}
            type="button"
          >
            Sensors (1)
          </button>
          <button
            onClick={() => setActiveFilter('community')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all ${
              activeFilter === 'community'
                ? 'bg-[#B45309] text-white font-bold'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-outline-variant/20 font-medium'
            }`}
            type="button"
          >
            Community Alerts (2)
          </button>
          <button
            onClick={() => setActiveFilter('emergency')}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all ${
              activeFilter === 'emergency'
                ? 'bg-primary text-white font-bold'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high border border-outline-variant/20 font-medium'
            }`}
            type="button"
          >
            Emergency Units (2)
          </button>
        </div>
      </section>

      {/* 2. GOOGLE MAP INTERACTIVE VIEWPORT (Powered by Google Maps Platform) */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-xs space-y-0">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMapsCanvas
            userLocation={userLocation}
            activeFilter={activeFilter}
            onMarkerSelect={(marker) => {
              setSelectedMarker(marker);
            }}
            selectedMarkerId={selectedMarker?.id}
          />
        </APIProvider>
      </section>

      {/* 3. ACTIVE INCIDENT SUMMARY WITH AUTHORITATIVE FLOOD TIMESTAMPS */}
      <section className="space-y-3">
        <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-xs relative overflow-hidden space-y-3">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-surface-container">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-on-surface-variant font-bold">
                INCIDENT #{primaryIncident?.ref_code || 'CS-8921'}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-[11px] text-secondary font-bold">Verified Incident</span>
            </div>
            {/* URGENT SEVERITY BADGE */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] uppercase font-extrabold bg-[#FEE2E2] text-[#D94F52] border border-[#D94F52]/30">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                error
              </span>
              HIGH SEVERITY
            </span>
          </div>

          {/* Authoritative Event Timestamp Banner (Requirement: Authoritative recorded time, never replaced by current clock) */}
          <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-xs text-secondary">event_available</span>
              <span>
                <strong className="text-primary font-semibold">Recorded:</strong>{' '}
                {primaryIncident?.recorded_at || '23 October 2026, 08:15:00 IST (UTC+05:30)'}
              </span>
            </div>
            <div className="text-[10px] text-secondary font-medium">
              Last Updated:{' '}
              {primaryIncident?.updated_at || '23 October 2026, 08:29:12 IST (UTC+05:30)'}
            </div>
          </div>

          {/* Incident Title & Distance */}
          <div className="space-y-1">
            <h2 className="font-headline-sm text-base font-bold text-primary leading-snug">
              Severe Waterlogging &amp; Silt Blockage
            </h2>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-secondary text-base">near_me</span>
              <span className="font-medium text-xs">100ft Bypass Rd, near Velachery Lake junction</span>
              <span className="text-xs font-bold text-secondary font-headline-sm">(50m from corridor)</span>
            </div>
          </div>

          {/* Real-time 3-Stage Progress Indicator */}
          <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/15">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-secondary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">check_circle</span> Reported
              </span>
              <span className="text-primary flex items-center gap-1 bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#B45309]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-ping"></span>
                Crew Dispatched (On-Progress)
              </span>
              <span className="text-outline">Resolved</span>
            </div>
            <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden flex">
              <div className="bg-secondary h-full w-1/3"></div>
              <div className="bg-[#B45309] h-full w-1/3"></div>
              <div className="bg-outline-variant/30 h-full w-1/3"></div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1.5">
              GCDA Emergency Drainage Unit #04 en route with de-watering pumps.
            </p>
          </div>

          {/* Consensus Count with Neighbor Avatar Stack */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-container-lowest bg-primary-container text-white text-[10px] font-bold flex items-center justify-center">
                  AK
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-container-lowest bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                  RM
                </div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface-container-lowest bg-surface-tint text-white text-[10px] font-bold flex items-center justify-center">
                  +140
                </div>
              </div>
              <span className="text-xs text-primary font-bold">
                {consensus1} neighbors confirmed this
              </span>
            </div>
            <div className="text-[11px] text-[#16A085] bg-[#E9F6F2] font-semibold px-2 py-0.5 rounded border border-[#16A085]/20">
              Verified Spot
            </div>
          </div>

          {/* Prominent Agreement CTA Group */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAgreePrimary}
              className={`flex-1 font-headline-sm font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all ${
                primaryAgreed
                  ? 'bg-[#E9F6F2] text-[#16A085] border border-[#16A085]/40'
                  : 'bg-primary hover:bg-secondary text-white'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {primaryAgreed ? 'check' : 'thumb_up'}
              </span>
              <span>{primaryAgreed ? 'Agreed! Thank you (+1)' : 'I See This Too / Agree (+1)'}</span>
            </button>
            <button
              onClick={() => primaryIncident && onShare(primaryIncident)}
              aria-label="Share incident details"
              className="w-11 h-11 flex items-center justify-center rounded-lg border border-outline-variant/30 text-primary hover:bg-surface-container-high active:scale-95 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-base">share</span>
            </button>
          </div>
        </article>

        {/* Secondary Nearby Hotspot Card with Authoritative Recorded Timestamp */}
        <article className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-extrabold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#B45309]/30">
                  Road Cavity Risk
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">320m away</span>
              </div>
              <h3 className="font-headline-sm text-sm font-bold text-primary">
                Gandhi Road Junction - Deep Potholes
              </h3>
              <p className="text-xs text-on-surface-variant">
                Trench caved in around sewer manhole cover. Hazard markers needed.
              </p>
            </div>
            <button
              onClick={handleAgreeSecondary}
              className={`flex-shrink-0 font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all border ${
                secondaryAgreed
                  ? 'bg-[#E9F6F2] text-[#16A085] border-[#16A085]/40'
                  : 'bg-surface-container-low hover:bg-surface-container-high border-outline-variant/40 text-primary'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-xs">
                {secondaryAgreed ? 'check' : 'add'}
              </span>
              <span>{secondaryAgreed ? 'Agreed' : 'Agree (+1)'}</span>
            </button>
          </div>

          <div className="pt-1 text-[10px] text-on-surface-variant flex items-center justify-between border-t border-surface-container">
            <span>
              Recorded: {secondaryIncident?.recorded_at || '23 October 2026, 07:40:00 IST (UTC+05:30)'}
            </span>
            <span className="text-secondary font-semibold">
              Updated: {secondaryIncident?.updated_at || '23 October 2026, 07:45:00 IST'}
            </span>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-on-surface-variant font-medium">
            <span>{consensus2} neighbor confirmations</span>
            <button
              onClick={() => secondaryIncident && onSelectIncident(secondaryIncident)}
              className="text-secondary font-bold flex items-center gap-0.5 hover:underline"
              type="button"
            >
              View Details <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};
