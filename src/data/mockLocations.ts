import { Location } from '../types/game';

export const MOCK_LOCATIONS: Location[] = [
  {
    id: 'tokyo-shibuya',
    name: 'Shibuya Scramble Crossing',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.6595,
    lng: 139.7004,
    heading: 45,
    pitch: 0,
    zoom: 1,
    description: 'The world-famous pedestrian scramble crossing in Shibuya, Tokyo. Surrounded by giant LED billboards and neon lights.',
    hints: ['Japanese Kanji & Katakana signage on store fronts', 'Left-hand side traffic drive', 'Distinctive yellow tactile paving blocks'],
    panoramaTheme: 'tokyo',
    initialNodeId: 'tokyo-node-1',
    nodes: {
      'tokyo-node-1': {
        id: 'tokyo-node-1',
        lat: 35.6595,
        lng: 139.7004,
        heading: 45,
        description: 'Center of Shibuya Crossing facing Tsutaya building',
        connectedNodeIds: ['tokyo-node-2', 'tokyo-node-3']
      },
      'tokyo-node-2': {
        id: 'tokyo-node-2',
        lat: 35.6598,
        lng: 139.7008,
        heading: 60,
        description: 'In front of Shibuya Station Hachiko Exit',
        connectedNodeIds: ['tokyo-node-1']
      },
      'tokyo-node-3': {
        id: 'tokyo-node-3',
        lat: 35.6592,
        lng: 139.7001,
        heading: 220,
        description: 'Center Street entrance (Inokashira-dori)',
        connectedNodeIds: ['tokyo-node-1']
      }
    }
  },
  {
    id: 'paris-eiffel',
    name: 'Champ de Mars / Eiffel Tower',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    lat: 48.8558,
    lng: 2.2981,
    heading: 310,
    pitch: 10,
    zoom: 1,
    description: 'Historic public green space in Paris with a spectacular direct line-of-sight view of the wrought-iron Eiffel Tower.',
    hints: ['French language signs', 'Classic Haussmann-style architectural stonework in distance', 'European blue street name plates'],
    panoramaTheme: 'paris',
    initialNodeId: 'paris-node-1',
    nodes: {
      'paris-node-1': {
        id: 'paris-node-1',
        lat: 48.8558,
        lng: 2.2981,
        heading: 310,
        description: 'Main walkway of Champ de Mars',
        connectedNodeIds: ['paris-node-2']
      },
      'paris-node-2': {
        id: 'paris-node-2',
        lat: 48.8565,
        lng: 2.2972,
        heading: 315,
        description: 'Base park gardens closer to the tower base',
        connectedNodeIds: ['paris-node-1']
      }
    }
  },
  {
    id: 'newyork-times-square',
    name: 'Times Square Broadway',
    city: 'New York City',
    country: 'United States',
    countryCode: 'US',
    lat: 40.758,
    lng: -73.9855,
    heading: 180,
    pitch: 5,
    zoom: 1,
    description: 'Major commercial intersection, tourist destination, and entertainment center in Midtown Manhattan, NYC.',
    hints: ['Yellow NYC taxi cabs', 'English commercial advertisements', 'Red double-decker tour buses'],
    panoramaTheme: 'newyork',
    initialNodeId: 'ny-node-1',
    nodes: {
      'ny-node-1': {
        id: 'ny-node-1',
        lat: 40.758,
        lng: -73.9855,
        heading: 180,
        description: 'Duffy Square near TKTS red bleacher stairs',
        connectedNodeIds: ['ny-node-2']
      },
      'ny-node-2': {
        id: 'ny-node-2',
        lat: 40.7573,
        lng: -73.9858,
        heading: 190,
        description: 'Broadway & 46th Street pedestrian plaza',
        connectedNodeIds: ['ny-node-1']
      }
    }
  },
  {
    id: 'sydney-opera-house',
    name: 'Sydney Harbour Foreshore',
    city: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    lat: -33.8568,
    lng: 151.2153,
    heading: 350,
    pitch: 0,
    zoom: 1,
    description: 'Panoramic view of Sydney Harbour, showing the iconic sail-like shell architecture of the Sydney Opera House and Harbour Bridge.',
    hints: ['Distinctive Australian native flora', 'Left-hand drive road signs nearby', 'English signage in Australian spelling'],
    panoramaTheme: 'sydney',
    initialNodeId: 'syd-node-1',
    nodes: {
      'syd-node-1': {
        id: 'syd-node-1',
        lat: -33.8568,
        lng: 151.2153,
        heading: 350,
        description: 'Circular Quay East promenade',
        connectedNodeIds: ['syd-node-2']
      },
      'syd-node-2': {
        id: 'syd-node-2',
        lat: -33.8575,
        lng: 151.2148,
        heading: 340,
        description: 'Overseas Passenger Terminal concourse',
        connectedNodeIds: ['syd-node-1']
      }
    }
  },
  {
    id: 'capetown-signal-hill',
    name: 'Signal Hill & Table Mountain',
    city: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    lat: -33.9175,
    lng: 18.4031,
    heading: 120,
    pitch: -5,
    zoom: 1,
    description: 'Vantage point overlooking Cape Town bowl, Table Bay harbor, and the dramatic backdrop of Table Mountain.',
    hints: ['South African road marking styles', 'Fynbos coastal scrub vegetation', 'English & Afrikaans bilingual elements'],
    panoramaTheme: 'capetown',
    initialNodeId: 'ct-node-1',
    nodes: {
      'ct-node-1': {
        id: 'ct-node-1',
        lat: -33.9175,
        lng: 18.4031,
        heading: 120,
        description: 'Signal Hill Road lookout area',
        connectedNodeIds: ['ct-node-2']
      },
      'ct-node-2': {
        id: 'ct-node-2',
        lat: -33.9182,
        lng: 18.4042,
        heading: 130,
        description: 'Paragliding launch spine road',
        connectedNodeIds: ['ct-node-1']
      }
    }
  }
];
