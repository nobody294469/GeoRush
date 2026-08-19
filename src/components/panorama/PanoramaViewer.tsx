import React from 'react';
import { useGame } from '../../context/GameContext';
import { RealPanoramaViewer } from './RealPanoramaViewer';
import { MockPanoramaViewer } from './MockPanoramaViewer';
import { isUsableGoogleMapsKey } from '../../utils/telemetry';

interface PanoramaViewerProps {
  className?: string;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ className = '' }) => {
  const { telemetry } = useGame();

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  if (telemetry.apiMode === 'REAL' && isUsableGoogleMapsKey(apiKey)) {
    return <RealPanoramaViewer apiKey={apiKey} className={className} />;
  }

  return <MockPanoramaViewer className={className} />;
};

