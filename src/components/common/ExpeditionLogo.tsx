import React from 'react';

interface ExpeditionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const ExpeditionLogo: React.FC<ExpeditionLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-13 h-13'
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Intricate Cartographic Compass Crest */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        {/* Outer Circular Ring with subtle elevation border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-md shadow-emerald-700/20 flex items-center justify-center border border-emerald-400/30">
          {/* Subtle Rotating Compass / Coordinate Lines SVG */}
          <svg viewBox="0 0 44 44" fill="none" className="w-full h-full p-1.5 text-white">
            {/* Outer coordinate tick ring */}
            <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
            <circle cx="22" cy="22" r="14" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
            
            {/* North/South Crosshairs */}
            <line x1="22" y1="2" x2="22" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <line x1="2" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            
            {/* Four-Point Explorer Star / Compass Needle */}
            <polygon points="22,6 25,19 38,22 25,25 22,38 19,25 6,22 19,19" fill="currentColor" fillOpacity="0.95" />
            
            {/* Center Eye / Jewel */}
            <circle cx="22" cy="22" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Brand Typography (Refined, Editorial, Balanced - Not Vibe Coded) */}
      <div className="flex flex-col text-left leading-none">
        <div className={`tracking-tight text-slate-900 font-display ${titleSizes[size]}`}>
          <span>Geo</span>
          <span className="text-emerald-600 font-semibold">Rush</span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1">
            Global Reconnaissance
          </span>
        )}
      </div>
    </div>
  );
};
