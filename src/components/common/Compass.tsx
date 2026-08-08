import React from 'react';

interface CompassProps {
  heading: number; // 0 - 360 degrees
  className?: string;
  onClickReset?: () => void;
}

export const Compass: React.FC<CompassProps> = ({ heading, className = '', onClickReset }) => {
  const normalizedHeading = ((heading % 360) + 360) % 360;

  return (
    <div
      onClick={onClickReset}
      className={`relative w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center cursor-pointer hover:border-teal-500 transition-all group ${className}`}
      title="Click to reset orientation to North"
    >
      {/* Outer ring */}
      <div className="absolute inset-1 rounded-full border border-slate-200/60 pointer-events-none" />

      {/* Rotating Compass Dial */}
      <div
        className="w-8 h-8 relative flex items-center justify-center transition-transform ease-out duration-75"
        style={{ transform: `rotate(${-normalizedHeading}deg)` }}
      >
        {/* North Arrow (Red) */}
        <div className="absolute top-0 w-0 h-0 border-x-4 border-x-transparent border-b-8 border-b-rose-600 drop-shadow-xs" />
        <span className="absolute -top-1.5 text-[9px] font-bold text-rose-600 select-none">N</span>

        {/* South Arrow (Gray) */}
        <div className="absolute bottom-0 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-slate-400" />

        {/* Center Pivot */}
        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 border border-white z-10" />
      </div>

      {/* Heading Degrees tooltip on hover */}
      <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-slate-800 bg-white/95 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap">
        {Math.round(normalizedHeading)}° N
      </div>
    </div>
  );
};
