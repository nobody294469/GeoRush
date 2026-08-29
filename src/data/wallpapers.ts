export interface WallpaperOption {
  id: string;
  name: string;
  location: string;
  category: string;
  imageUrl: string;
  accentColor: string;
  description: string;
}

export const WALLPAPER_PRESETS: WallpaperOption[] = [
  {
    id: 'nordic_fjords',
    name: 'Nordic Glacial Fjords',
    location: 'Geirangerfjord, Norway',
    category: 'Coastal Fjords',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop',
    accentColor: '#059669',
    description: 'Emerald waters slicing through dramatic mist-covered Scandinavian peaks.'
  },
  {
    id: 'alpine_sunset',
    name: 'Alpine Sunset Ridges',
    location: 'Dolomites, Italian Alps',
    category: 'Mountain Range',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2560&auto=format&fit=crop',
    accentColor: '#d97706',
    description: 'Layered mountain silhouettes bathed in golden hour expedition light.'
  },
  {
    id: 'earth_orbit',
    name: 'Satellite Earth Orbit',
    location: 'Low Earth Orbit (400km)',
    category: 'Planetary Space',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2560&auto=format&fit=crop',
    accentColor: '#0284c7',
    description: 'Atmospheric curvature of Earth showing continental coastlines and weather.'
  },
  {
    id: 'sahara_dunes',
    name: 'Sahara Sand Sea',
    location: 'Erg Chebbi, Morocco',
    category: 'Desert Topography',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2560&auto=format&fit=crop',
    accentColor: '#ea580c',
    description: 'Wind-sculpted golden dunes and desert ridgelines extending to the horizon.'
  },
  {
    id: 'patagonia_peaks',
    name: 'Patagonian Glaciers',
    location: 'Torres del Paine, Chile',
    category: 'Glacial Lakes',
    imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=2560&auto=format&fit=crop',
    accentColor: '#0d9488',
    description: 'Dramatic granite spires rising above turquoise glacial waters.'
  }
];

export const WALLPAPER_STORAGE_KEY = 'georush_selected_wallpaper';

/**
 * Returns the deterministic daily wallpaper based on current UTC day of the year
 */
export function getDailyWallpaper(): WallpaperOption {
  const now = new Date();
  const startOfYear = new Date(now.getUTCFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = Math.abs(dayOfYear) % WALLPAPER_PRESETS.length;
  return WALLPAPER_PRESETS[index];
}

/**
 * Gets currently active wallpaper (respecting 'daily_auto' setting or specific ID)
 */
export function getActiveWallpaper(selectedId?: string | null): { wallpaper: WallpaperOption; isDailyAuto: boolean } {
  const currentSetting = selectedId !== undefined ? selectedId : (typeof window !== 'undefined' ? localStorage.getItem(WALLPAPER_STORAGE_KEY) : null);
  
  if (!currentSetting || currentSetting === 'daily_auto') {
    return {
      wallpaper: getDailyWallpaper(),
      isDailyAuto: true
    };
  }

  const found = WALLPAPER_PRESETS.find(w => w.id === currentSetting);
  if (found) {
    return {
      wallpaper: found,
      isDailyAuto: false
    };
  }

  return {
    wallpaper: getDailyWallpaper(),
    isDailyAuto: true
  };
}
