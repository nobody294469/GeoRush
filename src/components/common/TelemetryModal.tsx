import React from 'react';
import { useGame } from '../../context/GameContext';
import { devTelemetry } from '../../utils/telemetry';
import { X, Activity, ShieldCheck, Database, Server, RefreshCw, Cpu, CheckCircle, ToggleLeft, ToggleRight, MapPin, AlertCircle } from 'lucide-react';

export const TelemetryModal: React.FC = () => {
  const { isTelemetryOpen, toggleTelemetry, telemetry } = useGame();

  if (!isTelemetryOpen) return null;

  const logs = devTelemetry.getLogs();

  const handleToggleApiMode = () => {
    const nextMode = telemetry.apiMode === 'MOCK' ? 'REAL' : 'MOCK';
    devTelemetry.setApiMode(nextMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Google Maps Development Telemetry
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold ${
                  telemetry.apiMode === 'REAL'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {telemetry.apiMode === 'REAL' ? 'REAL API ACTIVE' : 'MOCK MODE ACTIVE'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Phase 1B • Real Google Street View Proof of Concept Telemetry Tracker
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleTelemetry(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          
          {/* Mode Switcher Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                API Integration Mode Switcher
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Toggle between cost-free procedural mock environment and real Google Maps JavaScript API.
              </p>
            </div>

            <button
              onClick={handleToggleApiMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border shadow-xs ${
                telemetry.apiMode === 'REAL'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200'
              }`}
            >
              {telemetry.apiMode === 'REAL' ? (
                <>
                  <ToggleRight className="w-5 h-5 text-amber-700" />
                  <span>Switch to MOCK</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-teal-700" />
                  <span>Switch to REAL API</span>
                </>
              )}
            </button>
          </div>

          {/* Safety Notice */}
          {telemetry.apiMode === 'REAL' ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-900">REAL API Active • Daily Safety Budget Guard</p>
                <p className="leading-relaxed text-amber-800">
                  Calls to <code>google.maps.StreetViewPanorama</code> and <code>google.maps.Map</code> consume real Google Maps API quota. Instance reuse is enforced to minimize overhead.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-teal-900">Zero Google Maps API Consumption Guaranteed</p>
                <p className="leading-relaxed text-teal-800">
                  Mock mode runs entirely in-memory using procedural equirectangular panoramas and Leaflet maps.
                </p>
              </div>
            </div>
          )}

          {/* Key Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <Server className="w-3.5 h-3.5 text-teal-600" />
                API Mode
              </div>
              <div className="text-base font-bold text-teal-700 font-mono">
                {telemetry.apiMode}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {telemetry.apiMode === 'REAL' ? 'Real Google API' : 'Client Mock'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <Database className="w-3.5 h-3.5 text-purple-600" />
                Maps JS Inits
              </div>
              <div className="text-base font-bold text-slate-800 font-mono">
                {telemetry.mapsJsInits}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Script tag loads</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                Pano Instances
              </div>
              <div className="text-base font-bold text-slate-800 font-mono">
                {telemetry.panoramaInstances}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Persistent reuse</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                Map Instances
              </div>
              <div className="text-base font-bold text-slate-800 font-mono">
                {telemetry.mapInstances || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Google map objects</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                setPosition Calls
              </div>
              <div className="text-base font-bold text-slate-800 font-mono">
                {telemetry.setPositionCalls}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Location updates</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-semibold">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                Estimated Quota
              </div>
              <div className="text-base font-bold text-teal-700 font-mono">
                {telemetry.quotaUsed} / {telemetry.quotaSafetyLimit}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Local safety limit</div>
            </div>
          </div>

          {/* Current Location State */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              Active Panorama State
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-slate-600 pt-1">
              <div>
                <span className="text-slate-400">Pano ID:</span> {telemetry.currentPanoId || 'N/A'}
              </div>
              <div>
                <span className="text-slate-400">Coordinates:</span>{' '}
                {telemetry.currentLatLng
                  ? `${telemetry.currentLatLng.lat.toFixed(4)}, ${telemetry.currentLatLng.lng.toFixed(4)}`
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Event Logs */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Diagnostic Telemetry Event Stream
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-700">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                  <span className="text-teal-700 font-bold">{log.event}</span>
                  {log.detail && <span className="text-slate-500">{log.detail}</span>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer with Mandatory Disclaimer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-600">
          <div className="text-[11px] text-slate-500 leading-snug max-w-md">
            <strong>Authoritative Source Disclaimer:</strong> This telemetry counter is an application-side estimated tracker for safety checks. The Google Cloud Console is the authoritative source for actual billing and API usage.
          </div>
          <button
            onClick={() => toggleTelemetry(false)}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer shrink-0"
          >
            Close Telemetry
          </button>
        </div>

      </div>
    </div>
  );
};
