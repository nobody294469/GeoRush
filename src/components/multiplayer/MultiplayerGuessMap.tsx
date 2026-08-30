import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';
import { playSound } from '../../utils/audioSystem';
import { Maximize2, Minimize2, Check, Trash2, MapPin, Users } from 'lucide-react';

const createRedPinIcon = () =>
  L.divIcon({
    className: 'custom-guess-pin',
    html: `<div class="w-7 h-9 flex items-center justify-center drop-shadow-md">
      <svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 10.07 16 12 C16 14.21 14.21 16 12 16Z" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36]
  });

export const MultiplayerGuessMap: React.FC = () => {
  const { submitGuess, hasSubmittedGuess, myLastGuess, gameSession, room } = useMultiplayer();
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const [isLockedExpanded, setIsLockedExpanded] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [selectedPin, setSelectedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap'>('hybrid');

  const containerBoxRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);

  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);

  const isFullyExpanded = isLockedExpanded;
  const activeExpanded = isFullyExpanded || isHovered;

  // Toggle map/hybrid on demand
  const handleToggleMapType = (newType: 'hybrid' | 'roadmap') => {
    setMapType(newType);
    if (googleMapRef.current && window.google) {
      googleMapRef.current.setMapTypeId(
        newType === 'hybrid' ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP
      );
    }
  };

  // Keyboard shortcut M for expanding/collapsing map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        setIsLockedExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to collapse locked expanded state
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerBoxRef.current && !containerBoxRef.current.contains(e.target as Node)) {
        setIsLockedExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset map view to global position at the start of every new round
  useEffect(() => {
    setIsLockedExpanded(false);
    setSelectedPin(null);
    hasAutoSubmittedRef.current = false;

    if (googleMapRef.current && window.google) {
      googleMapRef.current.setCenter({ lat: 20, lng: 0 });
      googleMapRef.current.setZoom(2);
    } else if (leafletMapRef.current) {
      leafletMapRef.current.setView([20, 0], 2, { animate: false });
    }
  }, [gameSession?.currentRound, gameSession?.roundStartedAt]);

  // Initialize Map (Google Maps if apiKey exists, Leaflet fallback if not)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (apiKey) {
      let isMounted = true;
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
            mapTypeControl: false, // Relocated to bottom white bar
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            streetViewControl: false,
            fullscreenControl: false,
            styles: []
          });

          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (hasSubmittedGuess) return;
            if (e.latLng) {
              setSelectedPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              setIsLockedExpanded(true);
              playSound('pin');
            }
          });

          googleMapRef.current = map;
        }
      }).catch(err => {
        console.error('Failed to load Google Maps for MultiplayerGuessMap:', err);
      });

      return () => { isMounted = false; };
    } else {
      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [20, 0],
          zoom: 2,
          minZoom: 1.5,
          maxBounds: [[-85, -180], [85, 180]],
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
          if (hasSubmittedGuess) return;
          setSelectedPin({ lat: e.latlng.lat, lng: e.latlng.lng });
          setIsLockedExpanded(true);
          playSound('pin');
        });

        leafletMapRef.current = map;
      }
    }
  }, [apiKey, hasSubmittedGuess]);

  // Update marker position
  useEffect(() => {
    // Google Maps Marker
    if (googleMapRef.current && window.google) {
      const PIN_SVG_PATH = 'M 12 0 C 5.37 0 0 5.37 0 12 C 0 21 12 32 12 32 C 12 32 24 21 24 12 C 24 5.37 18.63 0 12 0 Z M 12 16 C 9.79 16 8 14.21 8 12 C 8 9.79 9.79 8 12 8 C 14.21 8 16 10.07 16 12 C 16 14.21 14.21 16 12 16 Z';

      if (selectedPin) {
        if (!googleMarkerRef.current) {
          const marker = new window.google.maps.Marker({
            position: selectedPin,
            map: googleMapRef.current,
            title: 'Your Guess',
            draggable: !hasSubmittedGuess,
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: PIN_SVG_PATH,
              scale: 1.15,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeWeight: 1.5,
              strokeColor: '#ffffff',
              anchor: new window.google.maps.Point(12, 32)
            }
          });

          marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
            if (e.latLng && !hasSubmittedGuess) {
              setSelectedPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }
          });

          googleMarkerRef.current = marker;
        } else {
          googleMarkerRef.current.setPosition(selectedPin);
          googleMarkerRef.current.setDraggable(!hasSubmittedGuess);
          googleMarkerRef.current.setMap(googleMapRef.current);
        }
      } else if (googleMarkerRef.current) {
        googleMarkerRef.current.setMap(null);
      }
    }

    // Leaflet Marker
    if (leafletMapRef.current) {
      const map = leafletMapRef.current;
      if (selectedPin) {
        if (leafletMarkerRef.current) {
          leafletMarkerRef.current.setLatLng([selectedPin.lat, selectedPin.lng]);
        } else {
          const marker = L.marker([selectedPin.lat, selectedPin.lng], {
            icon: createRedPinIcon(),
            draggable: !hasSubmittedGuess
          }).addTo(map);

          marker.on('dragend', (e) => {
            if (!hasSubmittedGuess) {
              const latlng = e.target.getLatLng();
              setSelectedPin({ lat: latlng.lat, lng: latlng.lng });
            }
          });

          leafletMarkerRef.current = marker;
        }
      } else if (leafletMarkerRef.current) {
        leafletMarkerRef.current.remove();
        leafletMarkerRef.current = null;
      }
    }
  }, [selectedPin, hasSubmittedGuess]);

  // Invalidate size on expand/hover toggle
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 200);
    }
    if (googleMapRef.current && window.google) {
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }, 200);
    }
  }, [activeExpanded]);

  const hasAutoSubmittedRef = useRef(false);

  // Timeout auto-submit: if timer expires and player has a pin selected but hasn't submitted
  useEffect(() => {
    if (
      !gameSession?.roundEndsAt ||
      gameSession.roundState !== 'ROUND_ACTIVE' ||
      hasSubmittedGuess ||
      !selectedPin ||
      hasAutoSubmittedRef.current
    ) {
      return;
    }

    const checkTimeout = () => {
      const remainingMs = gameSession.roundEndsAt! - Date.now();
      if (
        remainingMs <= 0 &&
        !hasAutoSubmittedRef.current &&
        !hasSubmittedGuess &&
        selectedPin &&
        gameSession.roundState === 'ROUND_ACTIVE'
      ) {
        hasAutoSubmittedRef.current = true;
        submitGuess(selectedPin.lat, selectedPin.lng).catch(err => {
          console.error('Error auto-submitting guess on timeout:', err);
        });
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 200);
    return () => clearInterval(interval);
  }, [
    gameSession?.roundEndsAt,
    gameSession?.roundState,
    hasSubmittedGuess,
    selectedPin,
    submitGuess
  ]);

  const handleSubmit = async () => {
    if (!selectedPin || isSubmitting || hasSubmittedGuess) return;
    setIsSubmitting(true);
    playSound('submit');
    try {
      await submitGuess(selectedPin.lat, selectedPin.lng);
    } catch (err) {
      console.error('Error submitting guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (!hasSubmittedGuess) {
      setSelectedPin(null);
    }
  };

  const submittedCount = gameSession?.submittedPlayerIds?.length || 0;
  const totalPlayers = room?.players?.length || 1;

  return (
    <div
      ref={containerBoxRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isLockedExpanded) setIsLockedExpanded(true);
      }}
      className={`absolute bottom-6 right-6 transition-all duration-300 ease-in-out z-30 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 bg-white/95 backdrop-blur-2xl flex flex-col max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] ${
        isFullyExpanded
          ? 'w-[calc(100vw-3rem)] h-[calc(100vh-7rem)] max-w-3xl max-h-[580px] sm:w-[700px] sm:h-[500px]'
          : isHovered
          ? 'w-[360px] h-[280px] sm:w-[420px] sm:h-[320px]'
          : 'w-[240px] h-[160px]'
      }`}
    >
      {/* Map Header Bar */}
      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900 z-20">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold text-xs tracking-tight text-slate-800">
            Multiplayer Map
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-normal hidden sm:inline">(Press M)</span>
          
          {/* Real-time Submissions Badge */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Users className="w-2.5 h-2.5 inline" />
            {submittedCount}/{totalPlayers}
          </span>
        </div>

        {/* Expand / Collapse Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLockedExpanded(!isLockedExpanded);
          }}
          className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-xs transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          title={isFullyExpanded ? 'Collapse Map (M)' : 'Expand Map (M)'}
        >
          {isFullyExpanded ? (
            <>
              <Minimize2 className="w-3 h-3 text-slate-500" />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span>Expand</span>
            </>
          )}
        </button>
      </div>

      {/* Map Canvas */}
      <div className="w-full flex-1 relative cursor-crosshair">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />
      </div>

      {/* Map Footer Control Action Bar */}
      <div className="px-3 py-2 bg-white/95 border-t border-slate-200 flex items-center justify-between gap-2.5 z-20">
        {hasSubmittedGuess ? (
          <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-800 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> Guess Locked In!
            </span>
            {myLastGuess && (
              <span className="font-mono text-emerald-700">
                {Math.round(myLastGuess.score)} pts ({Math.round(myLastGuess.distanceKm)} km)
              </span>
            )}
            <span className="text-[10px] text-emerald-600 font-normal">Waiting for round end...</span>
          </div>
        ) : (
          <>
            {/* Left: Pin Coordinates / Clear button */}
            <div className="text-[11px] text-slate-700 font-medium truncate flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              {selectedPin ? (
                <>
                  <span className="text-teal-700 font-bold font-mono text-xs">
                    {selectedPin.lat.toFixed(2)}°, {selectedPin.lng.toFixed(2)}°
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 font-mono text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear Pin"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" /> Clear
                  </button>
                </>
              ) : (
                <span className="text-slate-500 text-xs truncate">Click map to place pin</span>
              )}
            </div>

            {/* Middle: Map / Hybrid Mode Pill Switcher */}
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
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              disabled={!selectedPin || isSubmitting}
              className={`min-w-[140px] sm:min-w-[160px] px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
                selectedPin
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  GUESS
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};


