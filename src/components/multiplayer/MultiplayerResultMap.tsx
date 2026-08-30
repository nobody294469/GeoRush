import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RoundResult } from '../../shared/types/multiplayer';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';

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
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const useGoogleMaps = Boolean(apiKey || (typeof window !== 'undefined' && window.google?.maps));

  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const googleContainerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleMarkersRef = useRef<google.maps.Marker[]>([]);
  const googlePolylinesRef = useRef<google.maps.Polyline[]>([]);

  // 1. Google Maps Renderer
  useEffect(() => {
    if (!useGoogleMaps || !googleContainerRef.current) return;

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
              google.maps.MapTypeId.HYBRID
            ]
          },
          styles: []
        });
      }

      const map = googleMapRef.current;
      if (!map) return;

      // Clear previous markers and polylines
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];
      googlePolylinesRef.current.forEach(p => p.setMap(null));
      googlePolylinesRef.current = [];

      const target = roundResult.targetLocation;
      const targetPos = { lat: target.latitude, lng: target.longitude };
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(targetPos);

      // Target Flag Marker
      const targetMarker = new google.maps.Marker({
        position: targetPos,
        map,
        title: `Target: ${target.locationName || target.country}`,
        label: {
          text: '🏁 Target',
          color: '#022c22',
          fontWeight: 'bold',
          fontSize: '11px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeWeight: 2.5,
          strokeColor: '#ffffff'
        }
      });
      googleMarkersRef.current.push(targetMarker);

      // Player Guess Markers & Connecting Polylines
      roundResult.guesses.forEach((guess) => {
        if (guess.latitude !== null && guess.longitude !== null) {
          const guessPos = { lat: guess.latitude, lng: guess.longitude };
          bounds.extend(guessPos);

          const guessMarker = new google.maps.Marker({
            position: guessPos,
            map,
            title: `${guess.displayName}: ${Math.round(guess.score)} pts (${Math.round(guess.distanceKm)} km)`,
            label: {
              text: `${guess.displayName} (+${Math.round(guess.score)})`,
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '10px'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });
          googleMarkersRef.current.push(guessMarker);

          const polyline = new google.maps.Polyline({
            path: [targetPos, guessPos],
            geodesic: true,
            strokeColor: '#0ea5e9',
            strokeOpacity: 0.85,
            strokeWeight: 3,
            map
          });
          googlePolylinesRef.current.push(polyline);
        }
      });

      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    });

    return () => {
      isMounted = false;
    };
  }, [roundResult, useGoogleMaps, apiKey]);

  // 2. Leaflet Fallback Renderer (using clean OpenStreetMap tiles)
  useEffect(() => {
    if (useGoogleMaps || !leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1.5,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Clear existing layers except tile layer
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
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 8'
        }).addTo(map);
      }
    });

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true, duration: 0.6 });
  }, [roundResult, useGoogleMaps]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden min-h-[350px] bg-slate-100 relative">
      {useGoogleMaps ? (
        <div ref={googleContainerRef} className="w-full h-full" />
      ) : (
        <div ref={leafletContainerRef} className="w-full h-full" />
      )}
    </div>
  );
};
