import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';
import { RoundResult } from '../../shared/types/multiplayer';
import { Layers, MapPin, Flag, Eye } from 'lucide-react';

export interface SinglePlayerRoundSummary {
  roundNumber: number;
  location: {
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  };
  nodeUsed: {
    lat: number;
    lng: number;
  };
  guess: {
    lat: number;
    lng: number;
  };
  distanceKm: number;
  score: number;
  timeTakenSeconds?: number;
  timeMultiplier?: number;
  baseScore?: number;
}

interface MatchSummaryMapProps {
  singlePlayerResults?: SinglePlayerRoundSummary[];
  multiplayerRoundResults?: RoundResult[];
  apiMode?: 'REAL' | 'MOCK';
  apiKey?: string;
  className?: string;
}

// Helper to create clean Leaflet HTML DivIcon for Target
const createTargetPinIcon = (roundNumber: number, isSelected: boolean) =>
  L.divIcon({
    className: 'leaflet-summary-target-pin',
    html: `<div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <div class="px-2.5 py-1 rounded-lg text-xs font-black font-mono shadow-xl border-2 flex items-center gap-1 transition-transform ${
        isSelected ? 'scale-125 z-30' : 'scale-100'
      } bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-400/60">
        <span>🏁</span>
        <span>R${roundNumber}</span>
      </div>
    </div>`,
    iconSize: [48, 26],
    iconAnchor: [24, 13],
  });

// Helper to create clean Leaflet HTML DivIcon for Guess
const createGuessPinIcon = (roundNumber: number, score: number, isSelected: boolean, playerName?: string) =>
  L.divIcon({
    className: 'leaflet-summary-guess-pin',
    html: `<div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <div class="px-2 py-0.5 rounded-lg text-xs font-bold font-mono shadow-xl border-2 flex items-center gap-1 transition-transform ${
        isSelected ? 'scale-125 z-30' : 'scale-100'
      } bg-rose-500 text-white border-white ring-2 ring-rose-400/60">
        <span>📍</span>
        <span>R${roundNumber}${playerName ? ` ${playerName}` : ''}</span>
        <span class="text-[10px] opacity-90 font-mono">+${Math.round(score)}</span>
      </div>
    </div>`,
    iconSize: [ playerName ? 100 : 70, 24],
    iconAnchor: [ playerName ? 50 : 35, 12],
  });

export const MatchSummaryMap: React.FC<MatchSummaryMapProps> = ({
  singlePlayerResults,
  multiplayerRoundResults,
  apiMode = 'MOCK',
  apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '',
  className = '',
}) => {
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<number | null>(null);

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const googleContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkersRef = useRef<google.maps.Marker[]>([]);
  const googlePolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Normalize round items
  const rounds = React.useMemo(() => {
    if (singlePlayerResults && singlePlayerResults.length > 0) {
      return singlePlayerResults.map(r => ({
        roundNumber: r.roundNumber,
        targetLat: r.nodeUsed?.lat ?? r.location.lat,
        targetLng: r.nodeUsed?.lng ?? r.location.lng,
        locationName: r.location.name || `${r.location.city}, ${r.location.country}`,
        country: r.location.country,
        guesses: [
          {
            playerId: 'player',
            displayName: 'You',
            lat: r.guess?.lat,
            lng: r.guess?.lng,
            score: r.score,
            distanceKm: r.distanceKm,
            timedOut: false,
          }
        ]
      }));
    }

    if (multiplayerRoundResults && multiplayerRoundResults.length > 0) {
      return multiplayerRoundResults.map(r => ({
        roundNumber: r.roundIndex,
        targetLat: r.targetLocation.latitude,
        targetLng: r.targetLocation.longitude,
        locationName: r.targetLocation.locationName || r.targetLocation.country,
        country: r.targetLocation.country,
        guesses: r.guesses.map(g => ({
          playerId: g.playerId,
          displayName: g.displayName,
          lat: g.latitude ?? undefined,
          lng: g.longitude ?? undefined,
          score: g.score,
          distanceKm: g.distanceKm,
          timedOut: g.timedOut ?? false,
        }))
      }));
    }

    return [];
  }, [singlePlayerResults, multiplayerRoundResults]);

  // Leaflet Map Rendering (for MOCK mode or fallback)
  useEffect(() => {
    if (apiMode === 'REAL' && apiKey) return;
    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1.5,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing overlay layers
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    if (rounds.length === 0) return;

    const allBounds = L.latLngBounds([]);
    const roundBoundsMap: Record<number, L.LatLngBounds> = {};

    rounds.forEach((round) => {
      const isSelected = selectedRoundFilter === null || selectedRoundFilter === round.roundNumber;
      const roundBounds = L.latLngBounds([]);

      if (round.targetLat !== undefined && round.targetLng !== undefined) {
        const targetLatLng = L.latLng(round.targetLat, round.targetLng);
        allBounds.extend(targetLatLng);
        roundBounds.extend(targetLatLng);

        // Add Target Marker
        L.marker(targetLatLng, {
          icon: createTargetPinIcon(round.roundNumber, isSelected),
          opacity: isSelected ? 1.0 : 0.4,
          zIndexOffset: isSelected ? 100 : 0,
        })
          .bindPopup(`<b>Round ${round.roundNumber} Target:</b><br/>${round.locationName}`)
          .addTo(map);
      }

      // Add Guess Markers & Connecting Polylines
      round.guesses.forEach((guess) => {
        if (guess.lat !== undefined && guess.lng !== undefined && !guess.timedOut) {
          const guessLatLng = L.latLng(guess.lat, guess.lng);
          allBounds.extend(guessLatLng);
          roundBounds.extend(guessLatLng);

          L.marker(guessLatLng, {
            icon: createGuessPinIcon(round.roundNumber, guess.score, isSelected, guess.displayName !== 'You' ? guess.displayName : undefined),
            opacity: isSelected ? 1.0 : 0.4,
            zIndexOffset: isSelected ? 100 : 0,
          })
            .bindPopup(`<b>Round ${round.roundNumber} Guess (${guess.displayName}):</b><br/>Score: ${Math.round(guess.score)} pts<br/>Distance: ${Math.round(guess.distanceKm)} km`)
            .addTo(map);

          if (round.targetLat !== undefined && round.targetLng !== undefined) {
            const targetLatLng = L.latLng(round.targetLat, round.targetLng);
            L.polyline([targetLatLng, guessLatLng], {
              color: isSelected ? '#10b981' : '#64748b',
              weight: isSelected ? 3.5 : 1.5,
              dashArray: isSelected ? '6, 6' : '3, 6',
              opacity: isSelected ? 0.9 : 0.35,
            }).addTo(map);
          }
        }
      });

      roundBoundsMap[round.roundNumber] = roundBounds;
    });

    // Fit bounds according to selected filter
    if (selectedRoundFilter !== null && roundBoundsMap[selectedRoundFilter]?.isValid()) {
      map.fitBounds(roundBoundsMap[selectedRoundFilter], {
        padding: [60, 60],
        maxZoom: 10,
        animate: true,
        duration: 0.6,
      });
    } else if (allBounds.isValid()) {
      map.fitBounds(allBounds, {
        padding: [50, 50],
        maxZoom: 10,
        animate: true,
        duration: 0.6,
      });
    }
  }, [rounds, selectedRoundFilter, apiMode, apiKey]);

  // Google Maps Rendering (for REAL mode)
  useEffect(() => {
    if (apiMode !== 'REAL' || !apiKey) return;
    if (!googleContainerRef.current) return;

    let isMounted = true;

    loadGoogleMapsApi(apiKey).then((google) => {
      if (!isMounted || !googleContainerRef.current) return;

      if (!googleMapRef.current) {
        googleMapRef.current = new google.maps.Map(googleContainerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          minZoom: 1,
          maxZoom: 18,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.HYBRID,
            ],
          },
          styles: [],
        });
      }

      const map = googleMapRef.current;
      if (!map) return;

      // Clear existing markers & polylines
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];
      googlePolylinesRef.current.forEach(p => p.setMap(null));
      googlePolylinesRef.current = [];

      if (rounds.length === 0) return;

      const allBounds = new google.maps.LatLngBounds();
      const roundBoundsMap: Record<number, google.maps.LatLngBounds> = {};

      rounds.forEach((round) => {
        const isSelected = selectedRoundFilter === null || selectedRoundFilter === round.roundNumber;
        const roundBounds = new google.maps.LatLngBounds();

        if (round.targetLat !== undefined && round.targetLng !== undefined) {
          const targetPos = { lat: round.targetLat, lng: round.targetLng };
          allBounds.extend(targetPos);
          roundBounds.extend(targetPos);

          const targetMarker = new google.maps.Marker({
            position: targetPos,
            map,
            title: `R${round.roundNumber} Target: ${round.locationName}`,
            label: {
              text: `R${round.roundNumber}`,
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
            },
            opacity: isSelected ? 1.0 : 0.4,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 15 : 12,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            },
          });
          googleMarkersRef.current.push(targetMarker);
        }

        round.guesses.forEach((guess) => {
          if (guess.lat !== undefined && guess.lng !== undefined && !guess.timedOut) {
            const guessPos = { lat: guess.lat, lng: guess.lng };
            allBounds.extend(guessPos);
            roundBounds.extend(guessPos);

            const guessMarker = new google.maps.Marker({
              position: guessPos,
              map,
              title: `R${round.roundNumber} Guess (${guess.displayName}): ${Math.round(guess.score)} pts`,
              label: {
                text: `R${round.roundNumber}`,
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
              },
              opacity: isSelected ? 1.0 : 0.4,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: isSelected ? 13 : 10,
                fillColor: '#ef4444',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              },
            });
            googleMarkersRef.current.push(guessMarker);

            if (round.targetLat !== undefined && round.targetLng !== undefined) {
              const poly = new google.maps.Polyline({
                path: [{ lat: round.targetLat, lng: round.targetLng }, guessPos],
                geodesic: true,
                strokeColor: isSelected ? '#38bdf8' : '#94a3b8',
                strokeOpacity: isSelected ? 0.9 : 0.35,
                strokeWeight: isSelected ? 3.5 : 1.5,
                map,
              });
              googlePolylinesRef.current.push(poly);
            }
          }
        });

        roundBoundsMap[round.roundNumber] = roundBounds;
      });

      // Fit bounds
      if (selectedRoundFilter !== null && roundBoundsMap[selectedRoundFilter]) {
        map.fitBounds(roundBoundsMap[selectedRoundFilter], { top: 60, right: 60, bottom: 60, left: 60 });
      } else {
        map.fitBounds(allBounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rounds, selectedRoundFilter, apiMode, apiKey]);

  return (
    <div className={`space-y-3 w-full ${className}`}>
      {/* Round Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedRoundFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRoundFilter === null
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-2 ring-teal-400/40'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Rounds ({rounds.length})</span>
          </button>

          {rounds.map((r) => {
            const isSelected = selectedRoundFilter === r.roundNumber;
            return (
              <button
                key={r.roundNumber}
                type="button"
                onClick={() => setSelectedRoundFilter(isSelected ? null : r.roundNumber)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                }`}
              >
                <span>R{r.roundNumber}</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <Flag className="w-3.5 h-3.5 text-emerald-600" /> Target
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Guess
          </span>
        </div>
      </div>

      {/* Map Display Container */}
      <div className="w-full h-[340px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-100">
        {apiMode === 'REAL' && apiKey ? (
          <div ref={googleContainerRef} className="w-full h-full" />
        ) : (
          <div ref={leafletContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};
