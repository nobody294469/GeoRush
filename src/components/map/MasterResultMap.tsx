import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGame } from '../../context/GameContext';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';

// Helper for Leaflet round pin badges
const createLeafletRoundIcon = (text: string, isTarget: boolean) =>
  L.divIcon({
    className: 'leaflet-master-pin',
    html: `<div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
      <div class="px-2 py-1 rounded-md text-[11px] font-black font-mono shadow-xl border flex items-center gap-1 ${
        isTarget
          ? 'bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-400/50'
          : 'bg-rose-500 text-white border-white ring-2 ring-rose-400/50'
      }">
        <span>${isTarget ? '🏁' : '📍'}</span>
        <span>${text}</span>
      </div>
    </div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 12]
  });

export const MasterResultMap: React.FC = () => {
  const { results, telemetry } = useGame();
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const googleContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  // 1. Render Leaflet Map for MOCK Mode
  useEffect(() => {
    if (telemetry.apiMode === 'REAL') return;
    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing layers except basemap
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    if (results.length === 0) return;

    const bounds = L.latLngBounds([]);

    results.forEach((r) => {
      const targetLatLng = L.latLng(r.location.lat, r.location.lng);
      const guessLatLng = L.latLng(r.guess.lat, r.guess.lng);

      bounds.extend(targetLatLng);
      bounds.extend(guessLatLng);

      // Add Target Marker
      L.marker(targetLatLng, {
        icon: createLeafletRoundIcon(`R${r.roundNumber}`, true)
      })
        .bindPopup(`<b>Round ${r.roundNumber} Actual:</b><br/>${r.location.name || `${r.location.city}, ${r.location.country}`}`)
        .addTo(map);

      // Add Guess Marker
      L.marker(guessLatLng, {
        icon: createLeafletRoundIcon(`R${r.roundNumber}`, false)
      })
        .bindPopup(`<b>Round ${r.roundNumber} Guess:</b><br/>Score: ${r.score} pts`)
        .addTo(map);

      // Add connecting line
      L.polyline([targetLatLng, guessLatLng], {
        color: '#10b981',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.8
      }).addTo(map);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [results, telemetry.apiMode]);

  // 2. Render Google Map for REAL Mode
  useEffect(() => {
    if (telemetry.apiMode !== 'REAL') return;
    if (!googleContainerRef.current) return;

    loadGoogleMapsApi(apiKey).then((google) => {
      if (!googleContainerRef.current) return;

      if (!googleMapRef.current) {
        googleMapRef.current = new google.maps.Map(googleContainerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.HYBRID
            ]
          },
          styles: [] // Standard clean light Google Maps style
        });
      }

      const map = googleMapRef.current;
      if (!map) return;

      if (results.length === 0) return;

      const bounds = new google.maps.LatLngBounds();

      results.forEach((r) => {
        const targetPos = { lat: r.location.lat, lng: r.location.lng };
        const guessPos = { lat: r.guess.lat, lng: r.guess.lng };

        bounds.extend(targetPos);
        bounds.extend(guessPos);

        // Target marker
        new google.maps.Marker({
          position: targetPos,
          map,
          title: `Round ${r.roundNumber} Target (${r.location.city}, ${r.location.country})`,
          label: {
            text: `R${r.roundNumber}`,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        // Guess marker
        new google.maps.Marker({
          position: guessPos,
          map,
          title: `Round ${r.roundNumber} Guess`,
          label: {
            text: `R${r.roundNumber}`,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px'
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        // Connecting polyline
        new google.maps.Polyline({
          path: [targetPos, guessPos],
          geodesic: true,
          strokeColor: '#38bdf8',
          strokeOpacity: 0.85,
          strokeWeight: 3,
          map
        });
      });

      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    });
  }, [results, telemetry.apiMode, apiKey]);

  return (
    <div className="w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-100">
      {telemetry.apiMode === 'REAL' ? (
        <div ref={googleContainerRef} className="w-full h-full" />
      ) : (
        <div ref={leafletContainerRef} className="w-full h-full" />
      )}
    </div>
  );
};
