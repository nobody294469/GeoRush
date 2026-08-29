import React from 'react';

/**
 * Custom Expedition Insignia and Cartographic Badges
 * Designed specifically for GeoRush to provide authentic, bespoke explorer aesthetics
 * avoiding generic SaaS icon-in-a-box patterns.
 */

// 1. Rank & Level Insignia (Officer/Surveyor Rank Shield)
export const RankInsignia: React.FC<{ level: number; className?: string }> = ({ level, className = 'w-12 h-12' }) => (
  <div className={`relative ${className} shrink-0 flex items-center justify-center`}>
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
      {/* Outer Shield Path */}
      <path
        d="M24 4L40 10V22C40 33.2 33.2 41.5 24 44C14.8 41.5 8 33.2 8 22V10L24 4Z"
        fill="url(#rank-shield-grad)"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      {/* Inner Inset Shield */}
      <path
        d="M24 8L36 12.8V22C36 30.5 30.8 37 24 39C17.2 37 12 30.5 12 22V12.8L24 8Z"
        fill="#ffffff"
        fillOpacity="0.92"
        stroke="#a7f3d0"
        strokeWidth="1"
      />
      {/* Fine Topo / Chevron Marks */}
      <path d="M19 19L24 15L29 19" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 23L24 19L29 23" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Rank Value Label */}
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fill="#065f46"
        fontSize="11"
        fontWeight="800"
        fontFamily="monospace"
      >
        {level}
      </text>

      <defs>
        <linearGradient id="rank-shield-grad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// 2. Honors & Achievements Medal (Cartographer Explorer Star Medallion)
export const MedalInsignia: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <div className={`relative ${className} shrink-0 flex items-center justify-center`}>
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
      {/* Hanging Silk Ribbon */}
      <path d="M16 4H32L28 16H20L16 4Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
      <path d="M22 4H26V16H22V4Z" fill="#fbbf24" />
      
      {/* Outer Coin / Medallion Rim */}
      <circle cx="24" cy="29" r="15" fill="url(#medal-gold-grad)" stroke="#d97706" strokeWidth="1.5" />
      <circle cx="24" cy="29" r="12.5" stroke="#fde68a" strokeWidth="1" strokeDasharray="2 2" />
      
      {/* Laurel Wreath Accents */}
      <path
        d="M15 28C15 33 18.5 37 24 37C29.5 37 33 33 33 28"
        stroke="#92400e"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1 3"
      />

      {/* Explorer 8-point Star Motif */}
      <polygon
        points="24,19 25.8,25.2 32,24 26.8,27.8 30,34 24,30.2 18,34 21.2,27.8 16,24 22.2,25.2"
        fill="#d97706"
      />
      <circle cx="24" cy="28" r="2.5" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />

      <defs>
        <linearGradient id="medal-gold-grad" x1="12" y1="17" x2="36" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// 3. Daily Challenge Astrolabe / Solar Chronometer Insignia
export const DailyChronometerInsignia: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <div className={`relative ${className} shrink-0 flex items-center justify-center`}>
    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full drop-shadow-sm">
      {/* Outer Brass Astrolabe Suspension Ring */}
      <circle cx="22" cy="7" r="4" stroke="#d97706" strokeWidth="1.2" />
      
      {/* Main Astrolabe Gear/Dial Body */}
      <rect x="5" y="10" width="34" height="30" rx="8" fill="url(#astrolabe-grad)" stroke="#f59e0b" strokeWidth="1.5" />
      
      {/* Coordinate Arc & Hour Markings */}
      <circle cx="22" cy="25" r="10" stroke="#b45309" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      
      {/* Sun/Horizon Ray Dial */}
      <line x1="22" y1="17" x2="22" y2="33" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="25" x2="30" y2="25" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="22" cy="25" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
      
      {/* Calendar Date Aperture Box */}
      <rect x="17" y="31" width="10" height="6" rx="2" fill="#ffffff" stroke="#f59e0b" strokeWidth="0.8" />
      <circle cx="22" cy="34" r="1" fill="#b45309" />

      <defs>
        <linearGradient id="astrolabe-grad" x1="5" y1="10" x2="39" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffbeb" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// 4. Explorer Field Guide & Cartography Atlas Insignia
export const FieldAtlasInsignia: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <div className={`relative ${className} shrink-0 flex items-center justify-center`}>
    <svg viewBox="0 0 44 44" fill="none" className="w-full h-full drop-shadow-sm">
      {/* Leather-bound Journal Base */}
      <rect x="8" y="6" width="28" height="32" rx="4" fill="url(#atlas-cover-grad)" stroke="#059669" strokeWidth="1.5" />
      
      {/* Spine Binding */}
      <rect x="8" y="6" width="6" height="32" rx="2" fill="#047857" />
      <line x1="11" y1="10" x2="11" y2="34" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="2 3" opacity="0.7" />
      
      {/* Survey Bookmark Ribbon */}
      <path d="M28 6V18L31 15L34 18V6H28Z" fill="#f59e0b" />
      
      {/* Topographic Contours on Journal Cover */}
      <path d="M17 16Q24 12 31 17" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M17 22Q25 18 31 23" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M17 28Q24 24 31 29" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      
      {/* Surveyor Loupe / Lens Motif */}
      <circle cx="24" cy="22" r="5" fill="#ffffff" fillOpacity="0.85" stroke="#059669" strokeWidth="1.2" />
      <circle cx="24" cy="22" r="2" fill="#059669" />

      <defs>
        <linearGradient id="atlas-cover-grad" x1="8" y1="6" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
