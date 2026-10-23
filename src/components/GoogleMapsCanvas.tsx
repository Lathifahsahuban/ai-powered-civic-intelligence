import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';

export interface MapMarkerItem {
  id: string;
  type: 'user' | 'flood_zone' | 'sensor' | 'community' | 'emergency';
  title: string;
  subtitle: string;
  position: { lat: number; lng: number };
  severity?: 'critical' | 'high' | 'medium' | 'info';
  details?: string;
  isDemo?: boolean;
}

interface GoogleMapsCanvasProps {
  userLocation: { lat: number; lng: number; accuracy?: number; address?: string } | null;
  activeFilter: string;
  onMarkerSelect: (marker: MapMarkerItem) => void;
  selectedMarkerId?: string | null;
  onMapLoaded?: () => void;
}

// Controller component to smoothly pan/zoom when userLocation changes
function MapCameraController({
  target
}: {
  target: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && target) {
      map.panTo(target);
      map.setZoom(16);
    }
  }, [map, target]);

  return null;
}

export const GoogleMapsCanvas: React.FC<GoogleMapsCanvasProps> = ({
  userLocation,
  activeFilter,
  onMarkerSelect,
  selectedMarkerId
}) => {
  const [activeInfoWindow, setActiveInfoWindow] = useState<MapMarkerItem | null>(null);

  // Authoritative & demo data items strictly separated
  const markers: MapMarkerItem[] = [
    // 1. Critical Flood Zone (100ft Bypass Road Culvert)
    {
      id: 'flood-1',
      type: 'flood_zone',
      title: '84cm Waterlogging & Submersion Hazard',
      subtitle: 'Velachery Drainage Corridor • 100ft Bypass Rd',
      position: { lat: 12.9784, lng: 80.2212 },
      severity: 'critical',
      details: 'Critical flood zone: 84cm standing runoff submerging curbs and sewer intakes. De-watering pumps deployed.',
      isDemo: true
    },
    // 2. Flood Grid Telemetry Sensor Station
    {
      id: 'sensor-1',
      type: 'sensor',
      title: 'Velachery Basin Telemetry Station #08',
      subtitle: 'Telemetry: Water Level +0.42m • Flow: 1.8 m³/s',
      position: { lat: 12.9798, lng: 80.2228 },
      severity: 'high',
      details: 'Automated water level gauge indicating elevated stormwater accumulation in low-lying basin.',
      isDemo: true
    },
    // 3. Community Alert - Road Cavity (CS-8922)
    {
      id: 'comm-1',
      type: 'community',
      title: 'Gandhi Road Junction - Deep Potholes & Cavity',
      subtitle: 'Trench caved in around sewer manhole cover (320m away)',
      position: { lat: 12.9760, lng: 80.2185 },
      severity: 'high',
      details: '68 neighbors verified. Compromised subgrade creating dangerous skidding risk for two-wheelers.',
      isDemo: true
    },
    // 4. Community Alert - Drain Block (Lake View St)
    {
      id: 'comm-2',
      type: 'community',
      title: 'Lake View Street - Silt & Drain Overflow',
      subtitle: 'Storm grating choked with construction debris',
      position: { lat: 12.9812, lng: 80.2245 },
      severity: 'medium',
      details: 'Reported by local residents. Requires municipal silt suction clearing.',
      isDemo: true
    },
    // 5. Emergency Facility - GCDA Drainage Unit #04
    {
      id: 'em-1',
      type: 'emergency',
      title: 'GCDA Emergency Drainage Unit #04',
      subtitle: 'En route with 150HP de-watering pumps (1.2 km away)',
      position: { lat: 12.9740, lng: 80.2205 },
      severity: 'info',
      details: 'Municipal rapid response crew dispatched for emergency stormwater clearance.',
      isDemo: true
    },
    // 6. Emergency Facility - Velachery Fire & Rescue Station
    {
      id: 'em-2',
      type: 'emergency',
      title: 'Velachery Fire & Rescue Substation',
      subtitle: 'Emergency Disaster Relief & Inflatable Rafts',
      position: { lat: 12.9835, lng: 80.2165 },
      severity: 'info',
      details: 'Official standby station for flood extraction and severe waterlogging clearance.',
      isDemo: true
    }
  ];

  // Filter markers based on active tab
  const visibleMarkers = markers.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'flood_zones' && m.type === 'flood_zone') return true;
    if (activeFilter === 'sensors' && m.type === 'sensor') return true;
    if (activeFilter === 'community' && m.type === 'community') return true;
    if (activeFilter === 'emergency' && m.type === 'emergency') return true;
    if (activeFilter === 'high' && (m.severity === 'critical' || m.severity === 'high')) return true;
    return false;
  });

  const defaultCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 12.9784, lng: 80.2212 };

  return (
    <div className="relative w-full h-[340px] md:h-[420px] bg-slate-900 rounded-xl overflow-hidden shadow-inner">
      <Map
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={defaultCenter}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        zoomControl={true}
        className="w-full h-full"
      >
        {/* Camera controller for automatic pan-to when user coordinates update */}
        <MapCameraController target={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null} />

        {/* 1. Real-time User Location Marker (rendered when user location is detected) */}
        {userLocation && (
          <AdvancedMarker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title="Your Current Location (GPS Verified)"
            onClick={() => {
              const userItem: MapMarkerItem = {
                id: 'user-loc',
                type: 'user',
                title: 'Your Exact GPS Location',
                subtitle: userLocation.address || 'Real-time device position',
                position: { lat: userLocation.lat, lng: userLocation.lng },
                details: `Latitude: ${userLocation.lat.toFixed(5)}°, Longitude: ${userLocation.lng.toFixed(
                  5
                )}° (Accuracy: ±${userLocation.accuracy || 3}m).`,
                isDemo: false
              };
              setActiveInfoWindow(userItem);
              onMarkerSelect(userItem);
            }}
          >
            <div className="flex flex-col items-center pointer-events-auto cursor-pointer group">
              <div className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 ring-1 ring-white/50 mb-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-ping"></span>
                <span>YOU ARE HERE</span>
              </div>
              <div className="relative flex items-center justify-center">
                <span className="beacon-ring absolute w-8 h-8 rounded-full bg-secondary opacity-75"></span>
                <div className="w-5 h-5 rounded-full bg-secondary text-white ring-2 ring-white shadow-md flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* 2. Flood Risk & Municipal Hazard Markers */}
        {visibleMarkers.map((m) => {
          return (
            <AdvancedMarker
              key={m.id}
              position={m.position}
              title={m.title}
              onClick={() => {
                setActiveInfoWindow(m);
                onMarkerSelect(m);
              }}
            >
              {m.type === 'flood_zone' && (
                <div className="flex flex-col items-center cursor-pointer group hover:scale-105 transition-transform">
                  <div className="bg-[#D94F52] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-md ring-2 ring-white/40 animate-bounce duration-1000 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    <span>84cm Waterlogging</span>
                  </div>
                  <div className="w-2 h-2 bg-[#D94F52] rotate-45 -mt-1 shadow-xs"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#D94F52] ring-4 ring-[#D94F52]/30 mt-0.5"></div>
                </div>
              )}

              {m.type === 'sensor' && (
                <div className="flex items-center gap-1 bg-cyan-700 text-white px-2 py-0.5 rounded-full shadow-md border border-cyan-300 cursor-pointer hover:scale-105 transition-transform text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse"></span>
                  <span>Sensor: +0.42m</span>
                </div>
              )}

              {m.type === 'community' && (
                <div className="flex items-center gap-1 bg-[#B45309] text-white px-1.5 py-0.5 rounded shadow-md cursor-pointer hover:scale-105 transition-transform text-[9px] font-bold uppercase">
                  <span className="material-symbols-outlined text-[12px]">dangerous</span>
                  <span>{m.id === 'comm-1' ? 'Road Cavity' : 'Drain Block'}</span>
                </div>
              )}

              {m.type === 'emergency' && (
                <div className="flex items-center gap-1 bg-primary text-secondary-fixed px-2 py-0.5 rounded shadow-md border border-secondary/50 cursor-pointer hover:scale-105 transition-transform text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                  <span>{m.id === 'em-1' ? 'Drainage Unit #04' : 'Fire & Rescue'}</span>
                </div>
              )}
            </AdvancedMarker>
          );
        })}

        {/* InfoWindow Popup for selected marker */}
        {activeInfoWindow && (
          <InfoWindow
            position={activeInfoWindow.position}
            onCloseClick={() => setActiveInfoWindow(null)}
          >
            <div className="p-1 max-w-[220px] text-on-surface">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs text-primary font-headline-sm leading-tight">
                  {activeInfoWindow.title}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium leading-snug">
                {activeInfoWindow.subtitle}
              </p>
              {activeInfoWindow.details && (
                <p className="text-[10px] text-on-surface mt-1.5 pt-1.5 border-t border-slate-200 leading-relaxed">
                  {activeInfoWindow.details}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-500">
                  {activeInfoWindow.position.lat.toFixed(4)}°N, {activeInfoWindow.position.lng.toFixed(4)}°E
                </span>
                <span
                  className={`px-1 py-0.2 rounded font-bold uppercase ${
                    activeInfoWindow.isDemo
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {activeInfoWindow.isDemo ? 'Demo Baseline' : 'GPS Verified'}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Floating Bottom Left Legend */}
      <div className="absolute left-2.5 bottom-2.5 bg-primary/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-white flex items-center gap-2 text-xs shadow-md z-10 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-xs border border-dashed border-[#D94F52] bg-[#D94F52]/40 flex-shrink-0"></span>
        <span className="text-[10px] font-semibold tracking-wide">
          RED ZONE: Velachery Flood Hazard Perimeter
        </span>
      </div>
    </div>
  );
};
