import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { devTelemetry } from '../../utils/telemetry';
import { loadGoogleMapsApi } from '../../utils/googleMapsLoader';
import { Compass } from '../common/Compass';
import { MapPin, AlertTriangle, RefreshCw, Compass as CompassIcon, Navigation } from 'lucide-react';
import { GameRules } from '../../types/game';

interface RealPanoramaViewerProps {
  apiKey: string;
  className?: string;
  panoId?: string;
  initialHeading?: number;
  initialPitch?: number;
  rules?: GameRules;
}

export const RealPanoramaViewer: React.FC<RealPanoramaViewerProps> = ({
  apiKey,
  className = '',
  panoId: overridePanoId,
  initialHeading: overrideHeading,
  initialPitch: overridePitch,
  rules: overrideRules
}) => {
  const { currentLocation, currentNode, settings, setStreetViewReady, resetPovCount, currentRoundIndex } = useGame();
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoramaInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const targetPovRef = useRef<{ heading: number; pitch: number }>({ heading: 0, pitch: 0 });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heading, setHeading] = useState<number>(overrideHeading ?? currentLocation?.heading ?? 0);

  const rules = overrideRules || settings?.rules || { pan: 'ALLOW_PAN', zoom: 'ALLOW_ZOOM', movement: 'ALLOW_MOVING' };

  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  // Listen for resetPOV keyboard shortcut / trigger
  useEffect(() => {
    if (resetPovCount > 0 && panoramaInstanceRef.current) {
      panoramaInstanceRef.current.setPov(targetPovRef.current);
    }
  }, [resetPovCount]);

  // Initialize StreetViewPanorama once
  useEffect(() => {
    let isMounted = true;

    if (!containerRef.current) return;

    setIsLoading(true);
    setStreetViewReady(false);
    setErrorMsg(null);

    loadGoogleMapsApi(apiKey)
      .then((google) => {
        if (!isMounted || !containerRef.current) return;

        // Create persistent panorama instance if not already created
        if (!panoramaInstanceRef.current) {
          const initialLat = currentNode?.lat || currentLocation?.lat || 35.6595;
          const initialLng = currentNode?.lng || currentLocation?.lng || 139.7004;
          const initialHeading = overrideHeading ?? currentNode?.heading ?? currentLocation?.heading ?? 0;
          const initialPitch = overridePitch ?? currentNode?.pitch ?? currentLocation?.pitch ?? 0;

          targetPovRef.current = { heading: initialHeading, pitch: initialPitch };

          const initialPanoId = overridePanoId || currentLocation?.panoId;

          const panoOptions: google.maps.StreetViewPanoramaOptions = {
            pov: {
              heading: initialHeading,
              pitch: initialPitch
            },
            zoom: 1,
            addressControl: false,
            showRoadLabels: false,
            motionTracking: false,
            motionTrackingControl: false,
            fullscreenControl: false,
            panControl: rulesRef.current.pan === 'ALLOW_PAN',
            zoomControl: rulesRef.current.zoom === 'ALLOW_ZOOM',
            scrollwheel: rulesRef.current.zoom === 'ALLOW_ZOOM',
            linksControl: rulesRef.current.movement === 'ALLOW_MOVING',
            clickToGo: rulesRef.current.movement === 'ALLOW_MOVING',
            enableCloseButton: false
          };

          if (initialPanoId) {
            panoOptions.pano = initialPanoId;
          } else {
            panoOptions.position = { lat: initialLat, lng: initialLng };
          }

          const panorama = new google.maps.StreetViewPanorama(containerRef.current, panoOptions);

          if (initialPanoId) {
            panorama.setPano(initialPanoId);
          }
          panorama.setPov({
            heading: initialHeading,
            pitch: initialPitch
          });

          devTelemetry.trackPanoramaInstance();
          devTelemetry.trackRealApiLoad('StreetViewPanorama Instantiation');
          if (initialPanoId) {
            devTelemetry.trackSetPano(initialPanoId);
          } else {
            devTelemetry.trackSetPosition(initialLat, initialLng);
          }

          // Listeners for rules enforcement (always referencing rulesRef.current)
          panorama.addListener('pov_changed', () => {
            const currentRules = rulesRef.current;
            const pov = panorama.getPov();
            if (pov && typeof pov.heading === 'number') {
              setHeading(pov.heading);

              // Enforce NO_PAN rule by snapping back to initial starting POV
              if (currentRules.pan === 'NO_PAN') {
                if (pov.heading !== targetPovRef.current.heading || pov.pitch !== targetPovRef.current.pitch) {
                  panorama.setPov(targetPovRef.current);
                }
              }
            }
          });

          panorama.addListener('zoom_changed', () => {
            const currentRules = rulesRef.current;
            // Enforce NO_ZOOM rule by resetting to zoom level 1
            if (currentRules.zoom === 'NO_ZOOM') {
              if (panorama.getZoom() !== 1) {
                panorama.setZoom(1);
              }
            }
          });

          // Pano changed & position changed
          panorama.addListener('status_changed', () => {
            const status = panorama.getStatus();
            if (status && status !== 'OK' && status !== (google.maps as any).StreetViewStatus?.OK) {
              devTelemetry.trackError(`StreetView status: ${status}`);
              setErrorMsg(`Google Street View status error: ${status}`);
              setIsLoading(false);
              setStreetViewReady(false);
            }
          });

          panorama.addListener('pano_changed', () => {
            const currentPano = panorama.getPano();
            if (currentPano) {
              devTelemetry.trackSetPano(currentPano);
              setIsLoading(false);
              setStreetViewReady(true);
            }
          });

          panorama.addListener('position_changed', () => {
            const pos = panorama.getPosition();
            if (pos) {
              devTelemetry.trackSetPosition(pos.lat(), pos.lng());
            }
          });

          panoramaInstanceRef.current = panorama;
        }

        setIsLoading(false);
        setStreetViewReady(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setStreetViewReady(false);
        setErrorMsg(err?.message || 'Failed to initialize Google Maps Street View');
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Dynamic Rule updates & Location node updates on existing panorama instance
  useEffect(() => {
    const panorama = panoramaInstanceRef.current;
    if (!panorama) return;

    // Apply rule configurations directly to existing options
    panorama.setOptions({
      linksControl: rules.movement === 'ALLOW_MOVING',
      clickToGo: rules.movement === 'ALLOW_MOVING',
      panControl: rules.pan === 'ALLOW_PAN',
      zoomControl: rules.zoom === 'ALLOW_ZOOM',
      scrollwheel: rules.zoom === 'ALLOW_ZOOM'
    });

    const effectivePanoId = overridePanoId || currentLocation?.panoId;
    if (effectivePanoId) {
      const initHeading = overrideHeading ?? currentNode?.heading ?? currentLocation?.heading ?? 0;
      const initPitch = overridePitch ?? currentNode?.pitch ?? currentLocation?.pitch ?? 0;
      targetPovRef.current = { heading: initHeading, pitch: initPitch };

      panorama.setPano(effectivePanoId);
      panorama.setPov({
        heading: initHeading,
        pitch: initPitch
      });

      if (rules.zoom === 'NO_ZOOM') {
        panorama.setZoom(1);
      }

      devTelemetry.trackSetPano(effectivePanoId);
      devTelemetry.trackRealApiLoad('Pano ID Change');
    } else if (currentNode) {
      const targetPos = { lat: currentNode.lat, lng: currentNode.lng };
      const initHeading = currentNode.heading ?? currentLocation?.heading ?? 0;
      const initPitch = currentNode.pitch ?? currentLocation?.pitch ?? 0;

      targetPovRef.current = { heading: initHeading, pitch: initPitch };

      panorama.setPosition(targetPos);
      panorama.setPov({
        heading: initHeading,
        pitch: initPitch
      });

      if (rules.zoom === 'NO_ZOOM') {
        panorama.setZoom(1);
      }

      devTelemetry.trackSetPosition(targetPos.lat, targetPos.lng);
      devTelemetry.trackRealApiLoad('Pano Position Change');
    }
  }, [overridePanoId, overrideHeading, overridePitch, currentNode?.id, currentLocation?.id, rules.movement, rules.pan, rules.zoom]);

  const handleResetOrientation = useCallback(() => {
    if (panoramaInstanceRef.current) {
      panoramaInstanceRef.current.setPov({
        heading: currentLocation?.heading || 0,
        pitch: 0
      });
    }
  }, [currentLocation]);

  if (errorMsg) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-4 ${className}`}>
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="font-bold text-slate-100 text-base">Real Street View Initialization Error</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">{errorMsg}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-sm font-sans space-y-2">
          <p>Verify that your Google Maps API key is correct and has the <strong>Maps JavaScript API</strong> enabled in Google Cloud Console.</p>
          <p className="text-emerald-400">You can easily switch back to MOCK MODE in the Telemetry panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-slate-950 overflow-hidden ${className}`}>
      
      {/* Real Google Street View DOM Container */}
      <div ref={containerRef} className="w-full h-full block" />

      {/* NMPZ / Restricted Interaction Overlay */}
      {(rules.pan === 'NO_PAN' || rules.zoom === 'NO_ZOOM') && rules.movement === 'NO_MOVING' && (
        <div 
          className="absolute inset-0 z-10 bg-transparent cursor-default select-none"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 text-white">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          <div className="text-sm font-bold tracking-wide">Initializing Google Street View...</div>
          <div className="text-xs text-slate-300 font-mono">Loading Maps JavaScript SDK</div>
        </div>
      )}

      {/* Real API Status Badge */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md text-xs font-mono text-slate-800">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-bold text-teal-700">GOOGLE STREET VIEW</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-sans font-semibold">Round {currentRoundIndex + 1}</span>
        </div>
      </div>

      {/* Compass Widget */}
      <div className="absolute top-4 right-4 z-20">
        <Compass heading={heading} onClickReset={handleResetOrientation} />
      </div>

    </div>
  );
};
