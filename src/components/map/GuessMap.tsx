import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGame } from '../../context/GameContext';
import { GoogleGuessMap } from './GoogleGuessMap';
import { Maximize2, Minimize2, Check, Trash2, MapPin } from 'lucide-react';

// Fix Leaflet default icon path issues in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom Red Guess Pin Icon (bottom center tip anchored)
const createRedPinIcon = () =>
  L.divIcon({
    className: 'custom-guess-pin',
    html: `<div class="w-7 h-9 flex items-center justify-center drop-shadow-md">
      <svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36]
  });

// Custom Green Target Flag Icon (bottom center tip anchored)
const createGreenTargetIcon = () =>
  L.divIcon({
    className: 'custom-target-pin',
    html: `<div class="w-7 h-9 flex items-center justify-center drop-shadow-md">
      <svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36]
  });

interface GuessMapProps {
  className?: string;
  isKeyboardExpanded?: boolean;
}

export const GuessMap: React.FC<GuessMapProps> = ({ className = '', isKeyboardExpanded = false }) => {
  const { 
    gameStatus, 
    selectedGuess, 
    placeGuess, 
    clearGuess,
    submitGuess, 
    results,
    telemetry
  } = useGame();

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [isLockedExpanded, setIsLockedExpanded] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isFullyExpanded = isLockedExpanded || isKeyboardExpanded || gameStatus === 'ROUND_RESULT';
  const activeExpanded = isFullyExpanded || isHovered;

  // Click outside listener to collapse locked expanded state when clicking outside
  const containerBoxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerBoxRef.current && !containerBoxRef.current.contains(e.target as Node)) {
        setIsLockedExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Leaflet Map (for MOCK mode)
  useEffect(() => {
    if (telemetry.apiMode === 'REAL') return;
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1.5,
      maxBounds: [[-85, -180], [85, 180]],
      zoomControl: false,
      attributionControl: false
    });

    // Clean Dark/Voyager Basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Click handler to place guess
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeGuess(e.latlng.lat, e.latlng.lng);
      setIsLockedExpanded(true);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [telemetry.apiMode]);

  // Update map layout on resize / expansion
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [activeExpanded, gameStatus]);

  // Handle Marker & Result Rendering for Leaflet
  useEffect(() => {
    if (telemetry.apiMode === 'REAL') return;
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing guess marker if any
    if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }

    // Add guess marker if selected
    if (selectedGuess) {
      const marker = L.marker([selectedGuess.lat, selectedGuess.lng], {
        icon: createRedPinIcon(),
        draggable: gameStatus === 'PLAYING'
      }).addTo(map);

      marker.on('dragend', (e) => {
        const latlng = e.target.getLatLng();
        placeGuess(latlng.lat, latlng.lng);
      });

      guessMarkerRef.current = marker;
    }

    // Handle ROUND_RESULT visualization
    if (gameStatus === 'ROUND_RESULT') {
      const currentResult = results[results.length - 1];
      if (currentResult) {
        const targetLatLng = L.latLng(currentResult.nodeUsed.lat, currentResult.nodeUsed.lng);
        const guessLatLng = L.latLng(currentResult.guess.lat, currentResult.guess.lng);

        // Add Target Marker
        if (targetMarkerRef.current) targetMarkerRef.current.remove();
        targetMarkerRef.current = L.marker(targetLatLng, { icon: createGreenTargetIcon() }).addTo(map);

        // Add connecting dashed polyline
        if (polylineRef.current) polylineRef.current.remove();
        polylineRef.current = L.polyline([targetLatLng, guessLatLng], {
          color: '#10b981',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.85
        }).addTo(map);

        // Fit bounds to show both target & guess with padding
        const bounds = L.latLngBounds([targetLatLng, guessLatLng]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    } else {
      // Clear result visualizers if playing
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    }
  }, [selectedGuess, gameStatus, results, telemetry.apiMode]);

  return (
    <div
      ref={containerBoxRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isLockedExpanded) setIsLockedExpanded(true);
      }}
      className={`relative transition-all duration-300 ease-in-out z-30 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 bg-white/95 backdrop-blur-md flex flex-col max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] ${
        isFullyExpanded
          ? 'w-[calc(100vw-3rem)] h-[calc(100vh-7rem)] max-w-3xl max-h-[580px] sm:w-[700px] sm:h-[500px]'
          : isHovered
          ? 'w-[360px] h-[280px] sm:w-[420px] sm:h-[320px]'
          : 'w-[240px] h-[160px]'
      } ${className}`}
    >
      {/* Map Header Bar */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 z-20">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span>
            {gameStatus === 'ROUND_RESULT'
              ? 'Round Result Map'
              : 'World Guess Map'}
          </span>
          <span className="text-[10px] font-mono text-slate-400 font-normal hidden sm:inline">(Press M)</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLockedExpanded(!isLockedExpanded);
          }}
          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 text-slate-800 hover:text-teal-700 hover:border-teal-300 shadow-sm transition-all cursor-pointer flex items-center gap-1"
          title={isFullyExpanded ? 'Collapse Map (M)' : 'Expand Map (M)'}
        >
          {isFullyExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-[11px] font-bold text-slate-700">Collapse</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-800" />
              <span className="text-[11px] font-bold text-slate-700">Expand</span>
            </>
          )}
        </button>
      </div>

      {/* Map Content Switcher */}
      {telemetry.apiMode === 'REAL' ? (
        <GoogleGuessMap apiKey={apiKey} isExpanded={activeExpanded} />
      ) : (
        <>
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full flex-1 relative z-10 cursor-crosshair" />

          {/* Map Footer Control Action */}
          {gameStatus === 'PLAYING' && (
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 z-20">
              <div className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-2">
                {selectedGuess ? (
                  <>
                    <span className="text-teal-700 font-bold font-mono">
                      Pin: {selectedGuess.lat.toFixed(2)}°, {selectedGuess.lng.toFixed(2)}°
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGuess();
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 font-mono text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Clear Pin"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" /> Clear
                    </button>
                  </>
                ) : (
                  <span>Click map to place pin</span>
                )}
              </div>
              <button
                disabled={!selectedGuess}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedGuess) submitGuess();
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all ${
                  selectedGuess
                    ? 'bg-teal-600 hover:bg-teal-500 text-white hover:scale-105 active:scale-95 cursor-pointer shadow-teal-600/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 border border-slate-200'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                GUESS
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

