import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';
import { Maximize2, Minimize2, Check, Trash2, Send } from 'lucide-react';

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

export const MultiplayerGuessMap: React.FC = () => {
  const { submitGuess, hasSubmittedGuess, myLastGuess, gameSession, room } = useMultiplayer();
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);

  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkerRef = useRef<google.maps.Marker | null>(null);

  // Keyboard shortcut M for expanding/collapsing map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_LEFT,
              mapTypeIds: [
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.SATELLITE
              ]
            },
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
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        map.on('click', (e: L.LeafletMouseEvent) => {
          if (hasSubmittedGuess) return;
          setSelectedPin({ lat: e.latlng.lat, lng: e.latlng.lng });
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

  // Invalidate size on expand toggle
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 150);
    }
    if (googleMapRef.current && window.google) {
      setTimeout(() => {
        window.google.maps.event.trigger(googleMapRef.current, 'resize');
      }, 150);
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!selectedPin || isSubmitting || hasSubmittedGuess) return;
    setIsSubmitting(true);
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
      className={`absolute bottom-6 right-6 transition-all duration-300 z-30 flex flex-col bg-white/95 border border-slate-200 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5rem)] ${
        isExpanded
          ? 'w-[360px] h-[340px] sm:w-[560px] sm:h-[420px]'
          : 'w-72 h-64 sm:w-80 sm:h-72'
      }`}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full relative cursor-crosshair">
        
        {/* Toggle Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-3 right-3 z-20 px-2.5 py-1.5 bg-white/95 hover:bg-teal-50 text-slate-800 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-lg shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          title={isExpanded ? 'Collapse Map (M)' : 'Expand Map (M)'}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-slate-800" />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-slate-800" />
              <span>Expand</span>
            </>
          )}
        </button>

        {/* Players submitted badge */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-white/90 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg shadow-md backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{submittedCount} / {totalPlayers} Submitted</span>
        </div>
      </div>

      {/* Control Footer */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 z-20">
        {hasSubmittedGuess ? (
          <div className="w-full flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-emerald-700 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Guess Submitted!
            </span>
            {myLastGuess && (
              <span className="font-mono">{Math.round(myLastGuess.score)} pts ({Math.round(myLastGuess.distanceKm)} km)</span>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={handleClear}
              disabled={!selectedPin}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 border border-slate-200 disabled:opacity-40 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Clear
            </button>

            <button
              onClick={handleSubmit}
              disabled={!selectedPin || isSubmitting}
              className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Guess
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

