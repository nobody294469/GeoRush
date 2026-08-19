import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { Compass } from '../common/Compass';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Navigation,
  Eye,
  MapPin
} from 'lucide-react';

interface MockPanoramaViewerProps {
  className?: string;
}

export const MockPanoramaViewer: React.FC<MockPanoramaViewerProps> = ({ className = '' }) => {
  const { currentLocation, currentNode, moveToNode, settings, setStreetViewReady, resetPovCount, currentRoundIndex } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rules = settings.rules;

  // Signal ready when mounted or location changes
  useEffect(() => {
    setStreetViewReady(true);
  }, [currentLocation?.id, currentNode?.id, setStreetViewReady]);

  // Handle camera reset POV trigger
  useEffect(() => {
    if (resetPovCount > 0) {
      setHeading(currentLocation?.heading || 0);
      setPitch(currentLocation?.pitch || 0);
      setFov(90);
    }
  }, [resetPovCount, currentLocation]);

  // Panorama Viewport Angles State
  const [heading, setHeading] = useState<number>(currentLocation?.heading || 0);
  const [pitch, setPitch] = useState<number>(currentLocation?.pitch || 0);
  const [fov, setFov] = useState<number>(90); // Field of view in degrees (zoom)

  // Drag state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update orientation when location changes
  useEffect(() => {
    if (currentLocation) {
      setHeading(currentLocation.heading);
      setPitch(currentLocation.pitch);
      setFov(90);
    }
  }, [currentLocation?.id]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (rules.pan === 'NO_PAN') return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (rules.pan === 'NO_PAN' || !isDraggingRef.current) return;

    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;

    // Adjust sensitivity based on FOV
    const sensitivity = (fov / 90) * 0.25;

    setHeading(prev => (prev + deltaX * sensitivity + 360) % 360);
    setPitch(prev => Math.max(-80, Math.min(80, prev - deltaY * sensitivity)));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [fov, rules.pan]);

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (rules.zoom === 'NO_ZOOM') return;
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 5 : -5;
    setFov(prev => Math.max(30, Math.min(110, prev + zoomDelta)));
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;
    const sensitivity = (fov / 90) * 0.3;

    setHeading(prev => (prev + deltaX * sensitivity + 360) % 360);
    setPitch(prev => Math.max(-80, Math.min(80, prev - deltaY * sensitivity)));

    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Render 360 Procedural Equirectangular Panorama onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    const theme = currentLocation?.panoramaTheme || 'tokyo';

    // Vertical pitch offset on screen
    const pitchOffset = (pitch / 90) * (height * 0.4);

    // 1. Render Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height / 2 + pitchOffset);
    if (theme === 'tokyo' || theme === 'newyork') {
      // Twilight / Night metropolis sky
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else if (theme === 'paris' || theme === 'sydney') {
      // Sunny crisp day sky
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    } else {
      // Cape Town coastal mountain day sky
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#e0f2fe');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height / 2 + pitchOffset + 50);

    // 2. Render Horizon & Ground
    const groundGrad = ctx.createLinearGradient(0, height / 2 + pitchOffset, 0, height);
    if (theme === 'tokyo' || theme === 'newyork') {
      groundGrad.addColorStop(0, '#1e293b');
      groundGrad.addColorStop(0.3, '#0f172a');
      groundGrad.addColorStop(1, '#020617');
    } else if (theme === 'paris') {
      groundGrad.addColorStop(0, '#15803d'); // Champ de mars lawn
      groundGrad.addColorStop(0.4, '#334155'); // Asphalt walkway
      groundGrad.addColorStop(1, '#1e293b');
    } else {
      groundGrad.addColorStop(0, '#334155');
      groundGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height / 2 + pitchOffset, width, height / 2 - pitchOffset);

    // 3. Render 360 Environmental Features Based on Heading
    // We map a 360-degree world horizontally relative to screen center
    const degreesPerPixel = fov / width;

    // Helper to calculate screen X coordinate for a world bearing
    const bearingToX = (bearing: number) => {
      let diff = bearing - heading;
      while (diff < -180) diff += 360;
      while (diff > 180) diff -= 360;
      return width / 2 + diff / degreesPerPixel;
    };

    // Draw Theme Specific Landmark Landmarks
    if (theme === 'tokyo') {
      // Shibuya Tsutaya & Billboards
      const xTsutaya = bearingToX(45);
      if (xTsutaya > -200 && xTsutaya < width + 200) {
        // High-rise glass building
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const bWidth = 240 / (fov / 90);
        ctx.fillRect(xTsutaya - bWidth / 2, height / 2 + pitchOffset - 220, bWidth, 240);
        ctx.strokeRect(xTsutaya - bWidth / 2, height / 2 + pitchOffset - 220, bWidth, 240);

        // Neon screens
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(xTsutaya - bWidth / 3, height / 2 + pitchOffset - 180, bWidth * 0.6, 60);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(xTsutaya - bWidth / 3, height / 2 + pitchOffset - 110, bWidth * 0.6, 50);

        // Japanese Text Kanji Mock Billboard
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('渋谷スクランブル 109', xTsutaya - 60, height / 2 + pitchOffset - 140);
      }

      // Pedestrian Scramble Crosswalk Stripes on Ground
      const xGroundCenter = bearingToX(0);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 7; i++) {
        const offset = (i - 3) * 40;
        ctx.fillRect(xGroundCenter + offset, height / 2 + pitchOffset + 80, 20, 120);
      }
    } else if (theme === 'paris') {
      // Eiffel Tower Landmark
      const xTower = bearingToX(310);
      if (xTower > -200 && xTower < width + 200) {
        const tScale = 1.2 / (fov / 90);
        ctx.strokeStyle = '#334155';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 3;

        // Eiffel tower silhouette
        ctx.beginPath();
        ctx.moveTo(xTower - 50 * tScale, height / 2 + pitchOffset + 20);
        ctx.lineTo(xTower - 15 * tScale, height / 2 + pitchOffset - 120 * tScale);
        ctx.lineTo(xTower - 5 * tScale, height / 2 + pitchOffset - 260 * tScale);
        ctx.lineTo(xTower + 5 * tScale, height / 2 + pitchOffset - 260 * tScale);
        ctx.lineTo(xTower + 15 * tScale, height / 2 + pitchOffset - 120 * tScale);
        ctx.lineTo(xTower + 50 * tScale, height / 2 + pitchOffset + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('TOUR EIFFEL', xTower - 40, height / 2 + pitchOffset - 270 * tScale);
      }
    } else if (theme === 'newyork') {
      // Times Square Billboards
      const xBroadway = bearingToX(180);
      if (xBroadway > -200 && xBroadway < width + 200) {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(xBroadway - 120, height / 2 + pitchOffset - 190, 240, 90);
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(xBroadway - 140, height / 2 + pitchOffset - 90, 280, 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'extrabold 18px sans-serif';
        ctx.fillText('BROADWAY • TIMES SQ', xBroadway - 100, height / 2 + pitchOffset - 130);
      }
    } else if (theme === 'sydney') {
      // Sydney Opera House Sails
      const xOpera = bearingToX(350);
      if (xOpera > -200 && xOpera < width + 200) {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';

        // Shell 1
        ctx.beginPath();
        ctx.moveTo(xOpera - 80, height / 2 + pitchOffset);
        ctx.quadraticCurveTo(xOpera - 40, height / 2 + pitchOffset - 120, xOpera, height / 2 + pitchOffset);
        ctx.fill();

        // Shell 2
        ctx.beginPath();
        ctx.moveTo(xOpera - 30, height / 2 + pitchOffset);
        ctx.quadraticCurveTo(xOpera + 20, height / 2 + pitchOffset - 150, xOpera + 70, height / 2 + pitchOffset);
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('SYDNEY OPERA HOUSE', xOpera - 60, height / 2 + pitchOffset - 160);
      }
    } else if (theme === 'capetown') {
      // Table Mountain
      const xMountain = bearingToX(120);
      if (xMountain > -300 && xMountain < width + 300) {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(xMountain - 250, height / 2 + pitchOffset);
        ctx.lineTo(xMountain - 180, height / 2 + pitchOffset - 140);
        ctx.lineTo(xMountain + 180, height / 2 + pitchOffset - 140); // Table plateau
        ctx.lineTo(xMountain + 250, height / 2 + pitchOffset);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('TABLE MOUNTAIN', xMountain - 50, height / 2 + pitchOffset - 155);
      }
    }

    // 4. Render Horizon Cardinal Directions (N, E, S, W badges in sky)
    const cardinals = [
      { name: 'N', angle: 0, color: '#f43f5e' },
      { name: 'E', angle: 90, color: '#38bdf8' },
      { name: 'S', angle: 180, color: '#94a3b8' },
      { name: 'W', angle: 270, color: '#38bdf8' }
    ];

    cardinals.forEach(card => {
      const cx = bearingToX(card.angle);
      if (cx > 20 && cx < width - 20) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(cx - 14, height / 2 + pitchOffset - 30, 28, 22);
        ctx.strokeStyle = card.color;
        ctx.strokeRect(cx - 14, height / 2 + pitchOffset - 30, 28, 22);

        ctx.fillStyle = card.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(card.name, cx, height / 2 + pitchOffset - 15);
      }
    });

  }, [heading, pitch, fov, currentLocation]);

  // Connected Movement Hotspots (3D road arrows)
  const connectedNodes = currentNode && currentLocation
    ? currentNode.connectedNodeIds.map(id => currentLocation.nodes[id]).filter(Boolean)
    : [];

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-slate-950 ${className}`}>
      
      {/* HTML5 Canvas 360 Viewer */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      />

      {/* Street View Badge Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md text-xs font-mono text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-bold text-teal-700">360° PANORAMA</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-sans font-semibold">Round {currentRoundIndex + 1}</span>
        </div>
      </div>

      {/* Compass Widget (Top Right) */}
      <div className="absolute top-4 right-4 z-20">
        <Compass heading={heading} onClickReset={() => { setHeading(currentLocation?.heading || 0); setPitch(0); }} />
      </div>

      {/* Onscreen Navigation Hotspot Arrows (When looking around road) */}
      {rules.movement === 'ALLOW_MOVING' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {connectedNodes.map(node => (
            <button
              key={node.id}
              onClick={() => moveToNode(node.id)}
              className="pointer-events-auto px-4 py-2 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl backdrop-blur-md border border-emerald-300 flex items-center gap-1.5 transform hover:scale-110 active:scale-95 transition-all animate-bounce"
              style={{ marginTop: '120px' }}
            >
              <Navigation className="w-4 h-4 fill-slate-950" />
              Step Forward ({node.description || 'Next Node'})
            </button>
          ))}
        </div>
      )}

      {/* Panorama Controls (Bottom Left Floating Bar) */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xl">
        <button
          onClick={() => setFov(prev => Math.max(30, prev - 15))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFov(prev => Math.min(110, prev + 15))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-700/80 mx-0.5" />
        <button
          onClick={() => setHeading(prev => (prev - 30 + 360) % 360)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Rotate Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setHeading(prev => (prev + 30) % 360)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Rotate Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-700/80 mx-0.5" />
        <button
          onClick={() => {
            setHeading(currentLocation?.heading || 0);
            setPitch(0);
            setFov(90);
          }}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
