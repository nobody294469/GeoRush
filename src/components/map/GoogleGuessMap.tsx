import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';
import { devTelemetry } from '../../utils/telemetry';
import { MapPin, Check, RefreshCw, Trash2 } from 'lucide-react';

interface GoogleGuessMapProps {
  apiKey: string;
  isExpanded: boolean;
}

export const GoogleGuessMap: React.FC<GoogleGuessMapProps> = ({ apiKey, isExpanded }) => {
  const { gameStatus, currentRoundIndex, selectedGuess, placeGuess, clearGuess, results, submitGuess } = useGame();
  const lastRoundResult = results[results.length - 1];

  const placeGuessRef = useRef(placeGuess);
  placeGuessRef.current = placeGuess;
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const targetMarkerRef = useRef<google.maps.Marker | null>(null);
  const linePolylineRef = useRef<google.maps.Polyline | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap'>('hybrid');

  // Switch map type on demand
  const handleToggleMapType = (newType: 'hybrid' | 'roadmap') => {
    setMapType(newType);
    if (googleMapRef.current && window.google) {
      googleMapRef.current.setMapTypeId(
        newType === 'hybrid' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP
      );
    }
  };

  // Reset map view to global position at the start of every new round
  useEffect(() => {
    if (gameStatus === 'PLAYING' && googleMapRef.current && window.google) {
      googleMapRef.current.setCenter({ lat: 20, lng: 0 });
      googleMapRef.current.setZoom(2);
      if (targetMarkerRef.current) targetMarkerRef.current.setMap(null);
      if (linePolylineRef.current) linePolylineRef.current.setMap(null);
    }
  }, [currentRoundIndex, gameStatus]);

  // 1. Initialize persistent google.maps.Map once
  useEffect(() => {
    let isMounted = true;
    if (!mapContainerRef.current) return;

    loadGoogleMapsApi(apiKey).then((google) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!googleMapRef.current) {
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          minZoom: 1,
          maxZoom: 18,
          mapTypeId: google.maps.MapTypeId.HYBRID,
          disableDefaultUI: false,
          mapTypeControl: false, // Moved to bottom white bar controls
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_BOTTOM
          },
          streetViewControl: false,
          fullscreenControl: false,
          styles: [] // Standard Google Maps satellite / roadmap appearance
        });

        devTelemetry.trackMapInstance();
        devTelemetry.trackRealApiLoad('Google Map Initialization');

        // Handle Map Click for placing Guess directly into GameContext
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            placeGuessRef.current(lat, lng);
          }
        });

        googleMapRef.current = map;
      }

      setIsMapLoaded(true);
    }).catch((err) => {
      console.error('Failed to load Google Maps for GuessMap:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // 2. Trigger map resize when container expands/collapses
  useEffect(() => {
    if (googleMapRef.current && window.google) {
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }, 250);
    }
  }, [isExpanded]);

  // 3. Update Guess Marker on click/selectedGuess state change
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    const PIN_SVG_PATH = 'M 12 0 C 5.37 0 0 5.37 0 12 C 0 21 12 32 12 32 C 12 32 24 21 24 12 C 24 5.37 18.63 0 12 0 Z M 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 C 14.21 8 16 10.07 16 12 C 16 14.21 14.21 16 12 16 Z';

    if (selectedGuess) {
      if (!guessMarkerRef.current) {
        const marker = new window.google.maps.Marker({
          position: selectedGuess,
          map: googleMapRef.current,
          title: 'Your Guess',
          draggable: gameStatus === 'PLAYING',
          animation: window.google.maps.Animation.DROP,
          icon: {
            path: PIN_SVG_PATH,
            scale: 1.15,
            fillColor: '#ef4444', // Red pin
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: '#ffffff',
            anchor: new window.google.maps.Point(12, 32)
          }
        });

        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            placeGuessRef.current(e.latLng.lat(), e.latLng.lng());
          }
        });

        guessMarkerRef.current = marker;
      } else {
        guessMarkerRef.current.setPosition(selectedGuess);
        guessMarkerRef.current.setDraggable(gameStatus === 'PLAYING');
        guessMarkerRef.current.setMap(googleMapRef.current);
      }
    } else {
      if (guessMarkerRef.current) {
        guessMarkerRef.current.setMap(null);
      }
    }
  }, [selectedGuess, gameStatus]);

  // 4. Handle ROUND_RESULT overlay on real Google Map
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !window.google) return;

    const TARGET_SVG_PATH = 'M 12 0 C 5.37 0 0 5.37 0 12 C 0 21 12 32 12 32 C 12 32 24 21 24 12 C 24 5.37 18.63 0 12 0 Z M 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 C 14.21 8 16 10.07 16 12 C 16 14.21 14.21 16 12 16 Z';

    if (gameStatus === 'ROUND_RESULT' && lastRoundResult) {
      const guessLoc = { lat: lastRoundResult.guess.lat, lng: lastRoundResult.guess.lng };
      const actualLoc = { lat: lastRoundResult.location.lat, lng: lastRoundResult.location.lng };

      // Target Marker (Green)
      if (!targetMarkerRef.current) {
        targetMarkerRef.current = new window.google.maps.Marker({
          position: actualLoc,
          map,
          title: 'Actual Location',
          icon: {
            path: TARGET_SVG_PATH,
            scale: 1.15,
            fillColor: '#10b981', // Emerald green
            fillOpacity: 1,
            strokeWeight: 1.5,
            strokeColor: '#ffffff',
            anchor: new window.google.maps.Point(12, 32)
          }
        });
      } else {
        targetMarkerRef.current.setPosition(actualLoc);
        targetMarkerRef.current.setMap(map);
      }

      // Connecting Polyline
      if (!linePolylineRef.current) {
        linePolylineRef.current = new window.google.maps.Polyline({
          path: [guessLoc, actualLoc],
          geodesic: true,
          strokeColor: '#38bdf8', // Sky blue
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map
        });
      } else {
        linePolylineRef.current.setPath([guessLoc, actualLoc]);
        linePolylineRef.current.setMap(map);
      }

      // Fit bounds to show both guess and target
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(guessLoc);
      bounds.extend(actualLoc);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    } else if (gameStatus === 'PLAYING') {
      // Reset result overlays when playing next round
      if (targetMarkerRef.current) targetMarkerRef.current.setMap(null);
      if (linePolylineRef.current) linePolylineRef.current.setMap(null);
    }
  }, [gameStatus, lastRoundResult]);

  const handleSubmitGuess = () => {
    if (!selectedGuess) return;
    submitGuess();
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-100 rounded-2xl border border-slate-200 shadow-xl">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Loading state */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-20 flex items-center justify-center gap-2 text-slate-600 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
          Loading Google Map...
        </div>
      )}

      {/* Submit Guess Button Bar (Only shown when expanded and playing) */}
      {gameStatus === 'PLAYING' && isExpanded && (
        <div className="p-3 bg-white/95 border-t border-slate-200 flex items-center justify-between gap-2.5 z-20">
          {/* Left: Pin text / Coordinates */}
          <div className="text-xs text-slate-600 font-mono flex items-center gap-2 truncate min-w-0">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            {selectedGuess ? (
              <>
                <span className="text-teal-700 font-bold font-mono">
                  {selectedGuess.lat.toFixed(2)}°, {selectedGuess.lng.toFixed(2)}°
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearGuess();
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-mono text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                  title="Clear Pin"
                >
                  <Trash2 className="w-3 h-3 text-rose-500" /> Clear
                </button>
              </>
            ) : (
              <span className="text-slate-500 text-xs truncate">Click map to place pin</span>
            )}
          </div>

          {/* Middle: Map / Hybrid Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMapType('roadmap');
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                mapType === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMapType('hybrid');
              }}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                mapType === 'hybrid'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Right: Enlarged Double-Width Guess Button */}
          <button
            onClick={handleSubmitGuess}
            disabled={!selectedGuess}
            className={`min-w-[140px] sm:min-w-[160px] px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
              selectedGuess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            GUESS
          </button>
        </div>
      )}
    </div>
  );
};
