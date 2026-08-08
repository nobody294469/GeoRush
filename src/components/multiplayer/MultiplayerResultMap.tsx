import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoundResult } from '../../shared/types/multiplayer';

const createTargetIcon = () =>
  L.divIcon({
    className: 'multiplayer-target-pin',
    html: `<div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <div class="px-2.5 py-1 rounded-md bg-emerald-500 text-slate-950 font-black font-mono text-xs shadow-xl border-2 border-white flex items-center gap-1">
        <span>🏁</span> Target
      </div>
    </div>`,
    iconSize: [80, 28],
    iconAnchor: [40, 14]
  });

const createPlayerIcon = (name: string, score: number) =>
  L.divIcon({
    className: 'multiplayer-player-pin',
    html: `<div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <div class="px-2 py-1 rounded-md bg-rose-500 text-white font-bold font-mono text-[11px] shadow-lg border border-white flex items-center gap-1">
        <span>📍</span>
        <span>${name} (${score}pt)</span>
      </div>
    </div>`,
    iconSize: [120, 24],
    iconAnchor: [60, 12]
  });

export const MultiplayerResultMap: React.FC<{ roundResult: RoundResult }> = ({ roundResult }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers/lines
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const target = roundResult.targetLocation;
    const targetLatLng: [number, number] = [target.latitude, target.longitude];

    const bounds = L.latLngBounds([targetLatLng]);

    // Target marker
    L.marker(targetLatLng, { icon: createTargetIcon() })
      .bindPopup(`<b>Target Location</b><br/>${target.locationName || target.country}`)
      .addTo(map);

    // Player markers and lines
    roundResult.guesses.forEach((guess) => {
      if (guess.latitude !== null && guess.longitude !== null) {
        const guessLatLng: [number, number] = [guess.latitude, guess.longitude];
        bounds.extend(guessLatLng);

        L.marker(guessLatLng, { icon: createPlayerIcon(guess.displayName, Math.round(guess.score)) })
          .bindPopup(`<b>${guess.displayName}</b><br/>Score: ${Math.round(guess.score)} pts<br/>Distance: ${Math.round(guess.distanceKm)} km`)
          .addTo(map);

        L.polyline([guessLatLng, targetLatLng], {
          color: '#f43f5e',
          weight: 2,
          opacity: 0.8,
          dashArray: '6, 8'
        }).addTo(map);
      }
    });

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [roundResult]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden min-h-[350px]" />;
};
