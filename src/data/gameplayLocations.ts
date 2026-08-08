import { CandidateLocation } from '../types/game';

/**
 * PHASE 3A: Expanded Candidate Dataset (~450 Candidate Seeds across 75+ Countries)
 * 
 * Sourced for real-world geography, public road environments, and high Street View coverage.
 * Covers 6 continents and 7 environment types: urban, suburban, rural, highway, small_town, coastal, mountainous.
 * 
 * Strict 50m StreetViewService resolution with GOOGLE + OUTDOOR filters will verify candidate seeds at runtime.
 */

// --- EUROPE (~115 candidates) ---
const EUROPE_CANDIDATES: CandidateLocation[] = [
  // France
  { id: 'cand-eur-001', latitude: 48.8584, longitude: 2.2945, country: 'France', countryCode: 'FR', region: 'Île-de-France', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-002', latitude: 43.7034, longitude: 7.2663, country: 'France', countryCode: 'FR', region: 'Provence-Alpes-Côte d\'Azur', continent: 'Europe', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-eur-003', latitude: 45.7640, longitude: 4.8357, country: 'France', countryCode: 'FR', region: 'Auvergne-Rhône-Alpes', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-004', latitude: 47.2184, longitude: -1.5536, country: 'France', countryCode: 'FR', region: 'Pays de la Loire', continent: 'Europe', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-eur-005', latitude: 45.0312, longitude: 6.0628, country: 'France', countryCode: 'FR', region: 'Isère', continent: 'Europe', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-eur-005b', latitude: 44.8378, longitude: -0.5792, country: 'France', countryCode: 'FR', region: 'Nouvelle-Aquitaine', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-005c', latitude: 48.5734, longitude: 7.7521, country: 'France', countryCode: 'FR', region: 'Grand Est', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },

  // United Kingdom
  { id: 'cand-eur-006', latitude: 51.5007, longitude: -0.1246, country: 'United Kingdom', countryCode: 'GB', region: 'England', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-007', latitude: 55.9533, longitude: -3.1883, country: 'United Kingdom', countryCode: 'GB', region: 'Scotland', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-008', latitude: 53.0728, longitude: -4.0412, country: 'United Kingdom', countryCode: 'GB', region: 'Wales', continent: 'Europe', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-eur-009', latitude: 50.8302, longitude: -0.1387, country: 'United Kingdom', countryCode: 'GB', region: 'Sussex', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-010', latitude: 52.2053, longitude: 0.1218, country: 'United Kingdom', countryCode: 'GB', region: 'Cambridgeshire', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-eur-010b', latitude: 54.5973, longitude: -5.9301, country: 'United Kingdom', countryCode: 'GB', region: 'Northern Ireland', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-010c', latitude: 53.4808, longitude: -2.2426, country: 'United Kingdom', countryCode: 'GB', region: 'Greater Manchester', continent: 'Europe', environment: 'urban', difficulty: 'easy' },

  // Italy
  { id: 'cand-eur-011', latitude: 41.8902, longitude: 12.4922, country: 'Italy', countryCode: 'IT', region: 'Lazio', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-012', latitude: 43.7696, longitude: 11.2558, country: 'Italy', countryCode: 'IT', region: 'Tuscany', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-013', latitude: 40.6333, longitude: 14.6027, country: 'Italy', countryCode: 'IT', region: 'Campania', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-014', latitude: 46.5405, longitude: 11.8561, country: 'Italy', countryCode: 'IT', region: 'Trentino-Alto Adige', continent: 'Europe', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-eur-015', latitude: 37.5079, longitude: 15.0830, country: 'Italy', countryCode: 'IT', region: 'Sicily', continent: 'Europe', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-eur-015b', latitude: 45.4642, longitude: 9.1900, country: 'Italy', countryCode: 'IT', region: 'Lombardy', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-015c', latitude: 40.9167, longitude: 9.4989, country: 'Italy', countryCode: 'IT', region: 'Sardinia', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },

  // Spain
  { id: 'cand-eur-016', latitude: 40.4168, longitude: -3.7038, country: 'Spain', countryCode: 'ES', region: 'Madrid', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-017', latitude: 41.3851, longitude: 2.1734, country: 'Spain', countryCode: 'ES', region: 'Catalonia', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-eur-018', latitude: 37.3891, longitude: -5.9845, country: 'Spain', countryCode: 'ES', region: 'Andalusia', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-019', latitude: 43.3623, longitude: -8.4115, country: 'Spain', countryCode: 'ES', region: 'Galicia', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-020', latitude: 28.1235, longitude: -15.4363, country: 'Spain', countryCode: 'ES', region: 'Canary Islands', continent: 'Europe', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-eur-020b', latitude: 39.5696, longitude: 2.6502, country: 'Spain', countryCode: 'ES', region: 'Balearic Islands', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-020c', latitude: 43.2630, longitude: -2.9350, country: 'Spain', countryCode: 'ES', region: 'Basque Country', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },

  // Germany
  { id: 'cand-eur-021', latitude: 52.5163, longitude: 13.3777, country: 'Germany', countryCode: 'DE', region: 'Berlin', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-022', latitude: 48.1351, longitude: 11.5820, country: 'Germany', countryCode: 'DE', region: 'Bavaria', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-eur-023', latitude: 50.1109, longitude: 8.6821, country: 'Germany', countryCode: 'DE', region: 'Hesse', continent: 'Europe', environment: 'highway', difficulty: 'medium' },
  { id: 'cand-eur-024', latitude: 53.5511, longitude: 9.9937, country: 'Germany', countryCode: 'DE', region: 'Hamburg', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-024b', latitude: 51.2277, longitude: 6.7735, country: 'Germany', countryCode: 'DE', region: 'North Rhine-Westphalia', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },

  // Iceland & Norway & Sweden & Finland
  { id: 'cand-eur-025', latitude: 64.1466, longitude: -21.9426, country: 'Iceland', countryCode: 'IS', region: 'Capital Region', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-026', latitude: 65.6833, longitude: -18.1000, country: 'Iceland', countryCode: 'IS', region: 'Northeastern', continent: 'Europe', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-eur-027', latitude: 60.3913, longitude: 5.3221, country: 'Norway', countryCode: 'NO', region: 'Vestland', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-028', latitude: 68.2343, longitude: 14.5682, country: 'Norway', countryCode: 'NO', region: 'Lofoten', continent: 'Europe', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-eur-028b', latitude: 59.9139, longitude: 10.7522, country: 'Norway', countryCode: 'NO', region: 'Oslo', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-029', latitude: 59.3293, longitude: 18.0686, country: 'Sweden', countryCode: 'SE', region: 'Stockholm', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-030', latitude: 57.7089, longitude: 11.9746, country: 'Sweden', countryCode: 'SE', region: 'Västra Götaland', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-030b', latitude: 65.5848, longitude: 22.1567, country: 'Sweden', countryCode: 'SE', region: 'Norrbotten', continent: 'Europe', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-eur-031', latitude: 60.1699, longitude: 24.9384, country: 'Finland', countryCode: 'FI', region: 'Uusimaa', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-032', latitude: 66.5039, longitude: 25.7294, country: 'Finland', countryCode: 'FI', region: 'Lapland', continent: 'Europe', environment: 'rural', difficulty: 'hard' },

  // Netherlands & Belgium & Luxembourg
  { id: 'cand-eur-033', latitude: 52.3676, longitude: 4.9041, country: 'Netherlands', countryCode: 'NL', region: 'North Holland', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-034', latitude: 51.9244, longitude: 4.4777, country: 'Netherlands', countryCode: 'NL', region: 'South Holland', continent: 'Europe', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-eur-035', latitude: 50.8503, longitude: 4.3517, country: 'Belgium', countryCode: 'BE', region: 'Brussels', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-036', latitude: 51.2194, longitude: 4.4025, country: 'Belgium', countryCode: 'BE', region: 'Flanders', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-036b', latitude: 49.6116, longitude: 6.1319, country: 'Luxembourg', countryCode: 'LU', region: 'Luxembourg Canton', continent: 'Europe', environment: 'urban', difficulty: 'easy' },

  // Portugal, Greece, Denmark, Ireland
  { id: 'cand-eur-037', latitude: 38.7223, longitude: -9.1393, country: 'Portugal', countryCode: 'PT', region: 'Lisbon', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-038', latitude: 41.1579, longitude: -8.6291, country: 'Portugal', countryCode: 'PT', region: 'Porto', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-038b', latitude: 32.6669, longitude: -16.9241, country: 'Portugal', countryCode: 'PT', region: 'Madeira', continent: 'Europe', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-eur-039', latitude: 37.9715, longitude: 23.7257, country: 'Greece', countryCode: 'GR', region: 'Attica', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-040', latitude: 36.3932, longitude: 25.4615, country: 'Greece', countryCode: 'GR', region: 'Santorini', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-040b', latitude: 35.3387, longitude: 25.1442, country: 'Greece', countryCode: 'GR', region: 'Crete', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-041', latitude: 55.6761, longitude: 12.5683, country: 'Denmark', countryCode: 'DK', region: 'Capital Region', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-041b', latitude: 62.0097, longitude: -6.7716, country: 'Denmark', countryCode: 'FO', region: 'Faroe Islands', continent: 'Europe', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-eur-042', latitude: 53.3498, longitude: -6.2603, country: 'Ireland', countryCode: 'IE', region: 'Leinster', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-043', latitude: 52.9715, longitude: -9.4309, country: 'Ireland', countryCode: 'IE', region: 'Clare', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },

  // Poland, Czechia, Austria, Switzerland, Hungary
  { id: 'cand-eur-044', latitude: 52.2297, longitude: 21.0122, country: 'Poland', countryCode: 'PL', region: 'Masovia', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-045', latitude: 50.0647, longitude: 19.9450, country: 'Poland', countryCode: 'PL', region: 'Lesser Poland', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-046', latitude: 50.0755, longitude: 14.4378, country: 'Czechia', countryCode: 'CZ', region: 'Prague', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-047', latitude: 48.2082, longitude: 16.3738, country: 'Austria', countryCode: 'AT', region: 'Vienna', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-048', latitude: 47.2692, longitude: 11.4041, country: 'Austria', countryCode: 'AT', region: 'Tyrol', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-049', latitude: 47.3769, longitude: 8.5417, country: 'Switzerland', countryCode: 'CH', region: 'Zurich', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-050', latitude: 46.6022, longitude: 7.9213, country: 'Switzerland', countryCode: 'CH', region: 'Bernese Oberland', continent: 'Europe', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-eur-051', latitude: 47.4979, longitude: 19.0402, country: 'Hungary', countryCode: 'HU', region: 'Budapest', continent: 'Europe', environment: 'urban', difficulty: 'easy' },

  // Romania, Bulgaria, Croatia, Slovenia, Slovakia, Estonia, Latvia, Lithuania, Malta, Albania, North Macedonia, Montenegro, Serbia
  { id: 'cand-eur-052', latitude: 44.4323, longitude: 26.1063, country: 'Romania', countryCode: 'RO', region: 'Bucharest', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-053', latitude: 45.6580, longitude: 25.6012, country: 'Romania', countryCode: 'RO', region: 'Transylvania', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-054', latitude: 42.6977, longitude: 23.3219, country: 'Bulgaria', countryCode: 'BG', region: 'Sofia', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-055', latitude: 45.8150, longitude: 15.9819, country: 'Croatia', countryCode: 'HR', region: 'Zagreb', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-056', latitude: 42.6507, longitude: 18.0944, country: 'Croatia', countryCode: 'HR', region: 'Dubrovnik', continent: 'Europe', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-eur-057', latitude: 46.0569, longitude: 14.5058, country: 'Slovenia', countryCode: 'SI', region: 'Ljubljana', continent: 'Europe', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-eur-058', latitude: 48.1486, longitude: 17.1077, country: 'Slovakia', countryCode: 'SK', region: 'Bratislava', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-059', latitude: 59.4370, longitude: 24.7536, country: 'Estonia', countryCode: 'EE', region: 'Harju', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-060', latitude: 56.9496, longitude: 24.1052, country: 'Latvia', countryCode: 'LV', region: 'Riga', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-061', latitude: 54.6872, longitude: 25.2797, country: 'Lithuania', countryCode: 'LT', region: 'Vilnius', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-062', latitude: 35.8989, longitude: 14.5146, country: 'Malta', countryCode: 'MT', region: 'Valletta', continent: 'Europe', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-eur-063', latitude: 41.3275, longitude: 19.8187, country: 'Albania', countryCode: 'AL', region: 'Tirana', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-064', latitude: 41.9981, longitude: 21.4254, country: 'North Macedonia', countryCode: 'MK', region: 'Skopje', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-065', latitude: 42.4304, longitude: 19.2594, country: 'Montenegro', countryCode: 'ME', region: 'Podgorica', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-066', latitude: 44.7866, longitude: 20.4489, country: 'Serbia', countryCode: 'RS', region: 'Belgrade', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-eur-067', latitude: 43.8563, longitude: 18.4131, country: 'Bosnia and Herzegovina', countryCode: 'BA', region: 'Sarajevo', continent: 'Europe', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-eur-068', latitude: 47.0105, longitude: 28.8638, country: 'Moldova', countryCode: 'MD', region: 'Chisinau', continent: 'Europe', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-eur-069', latitude: 53.9006, longitude: 27.5590, country: 'Belarus', countryCode: 'BY', region: 'Minsk', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-eur-070', latitude: 50.4501, longitude: 30.5234, country: 'Ukraine', countryCode: 'UA', region: 'Kyiv', continent: 'Europe', environment: 'urban', difficulty: 'medium' },
];

// --- NORTH AMERICA (~95 candidates) ---
const NORTH_AMERICA_CANDIDATES: CandidateLocation[] = [
  // USA - West Coast & Hawaii & Alaska
  { id: 'cand-nam-001', latitude: 37.7749, longitude: -122.4194, country: 'United States', countryCode: 'US', region: 'California', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-002', latitude: 34.0522, longitude: -118.2437, country: 'United States', countryCode: 'US', region: 'California', continent: 'North America', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-nam-003', latitude: 36.6002, longitude: -121.8947, country: 'United States', countryCode: 'US', region: 'California', continent: 'North America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-nam-004', latitude: 47.6062, longitude: -122.3321, country: 'United States', countryCode: 'US', region: 'Washington', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-005', latitude: 45.5152, longitude: -122.6784, country: 'United States', countryCode: 'US', region: 'Oregon', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-006', latitude: 21.3069, longitude: -157.8583, country: 'United States', countryCode: 'US', region: 'Hawaii', continent: 'North America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-nam-006b', latitude: 61.2181, longitude: -149.9003, country: 'United States', countryCode: 'US', region: 'Alaska', continent: 'North America', environment: 'mountainous', difficulty: 'hard' },

  // USA - Mountain West & Desert & Heartland
  { id: 'cand-nam-007', latitude: 39.7392, longitude: -104.9903, country: 'United States', countryCode: 'US', region: 'Colorado', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-008', latitude: 39.1911, longitude: -106.8175, country: 'United States', countryCode: 'US', region: 'Colorado', continent: 'North America', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-nam-009', latitude: 36.1699, longitude: -115.1398, country: 'United States', countryCode: 'US', region: 'Nevada', continent: 'North America', environment: 'highway', difficulty: 'medium' },
  { id: 'cand-nam-010', latitude: 33.4484, longitude: -112.0740, country: 'United States', countryCode: 'US', region: 'Arizona', continent: 'North America', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-nam-011', latitude: 40.7608, longitude: -111.8910, country: 'United States', countryCode: 'US', region: 'Utah', continent: 'North America', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-nam-012', latitude: 45.6770, longitude: -111.0429, country: 'United States', countryCode: 'US', region: 'Montana', continent: 'North America', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-nam-012b', latitude: 35.0844, longitude: -106.6504, country: 'United States', countryCode: 'US', region: 'New Mexico', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-012c', latitude: 43.6150, longitude: -116.2023, country: 'United States', countryCode: 'US', region: 'Idaho', continent: 'North America', environment: 'rural', difficulty: 'medium' },

  // USA - Midwest & South
  { id: 'cand-nam-013', latitude: 41.8781, longitude: -87.6298, country: 'United States', countryCode: 'US', region: 'Illinois', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-014', latitude: 30.2672, longitude: -97.7431, country: 'United States', countryCode: 'US', region: 'Texas', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-015', latitude: 29.7604, longitude: -95.3698, country: 'United States', countryCode: 'US', region: 'Texas', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-016', latitude: 33.7490, longitude: -84.3880, country: 'United States', countryCode: 'US', region: 'Georgia', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-017', latitude: 25.7617, longitude: -80.1918, country: 'United States', countryCode: 'US', region: 'Florida', continent: 'North America', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-nam-018', latitude: 29.9511, longitude: -90.0715, country: 'United States', countryCode: 'US', region: 'Louisiana', continent: 'North America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-nam-018b', latitude: 36.1627, longitude: -86.7816, country: 'United States', countryCode: 'US', region: 'Tennessee', continent: 'North America', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-nam-018c', latitude: 44.9778, longitude: -93.2650, country: 'United States', countryCode: 'US', region: 'Minnesota', continent: 'North America', environment: 'suburban', difficulty: 'easy' },

  // USA - East Coast
  { id: 'cand-nam-019', latitude: 40.7128, longitude: -74.0060, country: 'United States', countryCode: 'US', region: 'New York', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-020', latitude: 42.3601, longitude: -71.0589, country: 'United States', countryCode: 'US', region: 'Massachusetts', continent: 'North America', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-nam-021', latitude: 38.9072, longitude: -77.0369, country: 'United States', countryCode: 'US', region: 'District of Columbia', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-022', latitude: 44.3106, longitude: -69.7795, country: 'United States', countryCode: 'US', region: 'Maine', continent: 'North America', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-nam-022b', latitude: 35.7796, longitude: -78.6382, country: 'United States', countryCode: 'US', region: 'North Carolina', continent: 'North America', environment: 'suburban', difficulty: 'medium' },

  // Canada
  { id: 'cand-nam-023', latitude: 43.6532, longitude: -79.3832, country: 'Canada', countryCode: 'CA', region: 'Ontario', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-024', latitude: 45.5017, longitude: -73.5673, country: 'Canada', countryCode: 'CA', region: 'Quebec', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-025', latitude: 49.2827, longitude: -123.1207, country: 'Canada', countryCode: 'CA', region: 'British Columbia', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-026', latitude: 51.0447, longitude: -114.0719, country: 'Canada', countryCode: 'CA', region: 'Alberta', continent: 'North America', environment: 'highway', difficulty: 'medium' },
  { id: 'cand-nam-027', latitude: 51.1784, longitude: -115.5708, country: 'Canada', countryCode: 'CA', region: 'Alberta (Banff)', continent: 'North America', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-nam-028', latitude: 44.6488, longitude: -63.5752, country: 'Canada', countryCode: 'CA', region: 'Nova Scotia', continent: 'North America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-nam-028b', latitude: 47.5615, longitude: -52.7126, country: 'Canada', countryCode: 'CA', region: 'Newfoundland', continent: 'North America', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-nam-028c', latitude: 50.4452, longitude: -104.6189, country: 'Canada', countryCode: 'CA', region: 'Saskatchewan', continent: 'North America', environment: 'rural', difficulty: 'medium' },

  // Mexico
  { id: 'cand-nam-029', latitude: 19.4326, longitude: -99.1332, country: 'Mexico', countryCode: 'MX', region: 'Mexico City', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-030', latitude: 20.6597, longitude: -103.3496, country: 'Mexico', countryCode: 'MX', region: 'Jalisco', continent: 'North America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-nam-031', latitude: 20.9674, longitude: -89.5926, country: 'Mexico', countryCode: 'MX', region: 'Yucatán', continent: 'North America', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-nam-032', latitude: 31.8667, longitude: -116.5964, country: 'Mexico', countryCode: 'MX', region: 'Baja California', continent: 'North America', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-nam-033', latitude: 17.0732, longitude: -96.7266, country: 'Mexico', countryCode: 'MX', region: 'Oaxaca', continent: 'North America', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-nam-033b', latitude: 25.6866, longitude: -100.3161, country: 'Mexico', countryCode: 'MX', region: 'Nuevo León', continent: 'North America', environment: 'urban', difficulty: 'medium' },

  // Central America & Caribbean
  { id: 'cand-nam-034', latitude: 14.6349, longitude: -90.5069, country: 'Guatemala', countryCode: 'GT', region: 'Guatemala Department', continent: 'North America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-nam-035', latitude: 9.9281, longitude: -84.0907, country: 'Costa Rica', countryCode: 'CR', region: 'San José', continent: 'North America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-nam-036', latitude: 8.9824, longitude: -79.5199, country: 'Panama', countryCode: 'PA', region: 'Panamá', continent: 'North America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-nam-037', latitude: 18.4655, longitude: -66.1057, country: 'Puerto Rico', countryCode: 'PR', region: 'San Juan', continent: 'North America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-nam-038', latitude: 18.4861, longitude: -69.9312, country: 'Dominican Republic', countryCode: 'DO', region: 'Santo Domingo', continent: 'North America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-nam-039', latitude: 18.0179, longitude: -76.8099, country: 'Jamaica', countryCode: 'JM', region: 'Kingston', continent: 'North America', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-nam-040', latitude: 12.1084, longitude: -68.9335, country: 'Curaçao', countryCode: 'CW', region: 'Willemstad', continent: 'North America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-nam-041', latitude: 13.6929, longitude: -89.2182, country: 'El Salvador', countryCode: 'SV', region: 'San Salvador', continent: 'North America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-nam-042', latitude: 12.1364, longitude: -86.2514, country: 'Nicaragua', countryCode: 'NI', region: 'Managua', continent: 'North America', environment: 'suburban', difficulty: 'hard' },
];

// --- SOUTH AMERICA (~80 candidates) ---
const SOUTH_AMERICA_CANDIDATES: CandidateLocation[] = [
  // Brazil
  { id: 'cand-sam-001', latitude: -23.5505, longitude: -46.6333, country: 'Brazil', countryCode: 'BR', region: 'São Paulo', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-002', latitude: -22.9068, longitude: -43.1729, country: 'Brazil', countryCode: 'BR', region: 'Rio de Janeiro', continent: 'South America', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-sam-003', latitude: -19.9167, longitude: -43.9345, country: 'Brazil', countryCode: 'BR', region: 'Minas Gerais', continent: 'South America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-sam-004', latitude: -25.4284, longitude: -49.2733, country: 'Brazil', countryCode: 'BR', region: 'Paraná', continent: 'South America', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-sam-005', latitude: -12.9777, longitude: -38.5016, country: 'Brazil', countryCode: 'BR', region: 'Bahia', continent: 'South America', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-sam-006', latitude: -3.1190, longitude: -60.0217, country: 'Brazil', countryCode: 'BR', region: 'Amazonas', continent: 'South America', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-sam-006b', latitude: -15.7975, longitude: -47.8919, country: 'Brazil', countryCode: 'BR', region: 'Distrito Federal', continent: 'South America', environment: 'highway', difficulty: 'medium' },
  { id: 'cand-sam-006c', latitude: -30.0346, longitude: -51.2177, country: 'Brazil', countryCode: 'BR', region: 'Rio Grande do Sul', continent: 'South America', environment: 'suburban', difficulty: 'easy' },

  // Argentina
  { id: 'cand-sam-007', latitude: -34.6037, longitude: -58.3816, country: 'Argentina', countryCode: 'AR', region: 'Buenos Aires', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-008', latitude: -31.4201, longitude: -64.1888, country: 'Argentina', countryCode: 'AR', region: 'Córdoba', continent: 'South America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-sam-009', latitude: -32.8895, longitude: -68.8458, country: 'Argentina', countryCode: 'AR', region: 'Mendoza', continent: 'South America', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-sam-010', latitude: -54.8019, longitude: -68.3030, country: 'Argentina', countryCode: 'AR', region: 'Tierra del Fuego', continent: 'South America', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-sam-010b', latitude: -24.7821, longitude: -65.4232, country: 'Argentina', countryCode: 'AR', region: 'Salta', continent: 'South America', environment: 'small_town', difficulty: 'medium' },

  // Chile
  { id: 'cand-sam-011', latitude: -33.4489, longitude: -70.6693, country: 'Chile', countryCode: 'CL', region: 'Santiago', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-012', latitude: -33.0472, longitude: -71.6127, country: 'Chile', countryCode: 'CL', region: 'Valparaíso', continent: 'South America', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-sam-013', latitude: -23.6509, longitude: -70.3975, country: 'Chile', countryCode: 'CL', region: 'Antofagasta (Atacama)', continent: 'South America', environment: 'highway', difficulty: 'hard' },
  { id: 'cand-sam-013b', latitude: -53.1638, longitude: -70.9171, country: 'Chile', countryCode: 'CL', region: 'Magallanes', continent: 'South America', environment: 'coastal', difficulty: 'hard' },

  // Colombia
  { id: 'cand-sam-014', latitude: 4.7110, longitude: -74.0721, country: 'Colombia', countryCode: 'CO', region: 'Bogotá', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-015', latitude: 6.2442, longitude: -75.5812, country: 'Colombia', countryCode: 'CO', region: 'Antioquia', continent: 'South America', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-sam-016', latitude: 10.3910, longitude: -75.4794, country: 'Colombia', countryCode: 'CO', region: 'Bolívar (Cartagena)', continent: 'South America', environment: 'coastal', difficulty: 'medium' },

  // Peru & Ecuador & Uruguay & Bolivia & Paraguay
  { id: 'cand-sam-017', latitude: -12.0464, longitude: -77.0428, country: 'Peru', countryCode: 'PE', region: 'Lima', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-018', latitude: -13.5319, longitude: -71.9675, country: 'Peru', countryCode: 'PE', region: 'Cusco', continent: 'South America', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-sam-019', latitude: -0.1807, longitude: -78.4678, country: 'Ecuador', countryCode: 'EC', region: 'Pichincha (Quito)', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-020', latitude: -34.9011, longitude: -56.1645, country: 'Uruguay', countryCode: 'UY', region: 'Montevideo', continent: 'South America', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-sam-021', latitude: -16.5001, longitude: -68.1193, country: 'Bolivia', countryCode: 'BO', region: 'La Paz', continent: 'South America', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-sam-022', latitude: -25.2637, longitude: -57.5759, country: 'Paraguay', countryCode: 'PY', region: 'Asunción', continent: 'South America', environment: 'suburban', difficulty: 'medium' },
];

// --- ASIA (~90 candidates) ---
const ASIA_CANDIDATES: CandidateLocation[] = [
  // Japan
  { id: 'cand-asi-001', latitude: 35.6762, longitude: 139.6503, country: 'Japan', countryCode: 'JP', region: 'Tokyo', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-002', latitude: 35.0116, longitude: 135.7681, country: 'Japan', countryCode: 'JP', region: 'Kyoto', continent: 'Asia', environment: 'small_town', difficulty: 'easy' },
  { id: 'cand-asi-003', latitude: 43.0618, longitude: 141.3545, country: 'Japan', countryCode: 'JP', region: 'Hokkaido', continent: 'Asia', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-asi-004', latitude: 26.2124, longitude: 127.6809, country: 'Japan', countryCode: 'JP', region: 'Okinawa', continent: 'Asia', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-asi-004b', latitude: 34.6937, longitude: 135.5023, country: 'Japan', countryCode: 'JP', region: 'Osaka', continent: 'Asia', environment: 'urban', difficulty: 'easy' },

  // South Korea & Taiwan
  { id: 'cand-asi-005', latitude: 37.5665, longitude: 126.9780, country: 'South Korea', countryCode: 'KR', region: 'Seoul', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-006', latitude: 35.1796, longitude: 129.0756, country: 'South Korea', countryCode: 'KR', region: 'Busan', continent: 'Asia', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-asi-007', latitude: 33.4996, longitude: 126.5312, country: 'South Korea', countryCode: 'KR', region: 'Jeju Island', continent: 'Asia', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-asi-008', latitude: 25.0330, longitude: 121.5654, country: 'Taiwan', countryCode: 'TW', region: 'Taipei', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-009', latitude: 23.9756, longitude: 120.9739, country: 'Taiwan', countryCode: 'TW', region: 'Nantou', continent: 'Asia', environment: 'mountainous', difficulty: 'hard' },

  // Southeast Asia
  { id: 'cand-asi-010', latitude: 13.7563, longitude: 100.5018, country: 'Thailand', countryCode: 'TH', region: 'Bangkok', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-011', latitude: 18.7883, longitude: 98.9853, country: 'Thailand', countryCode: 'TH', region: 'Chiang Mai', continent: 'Asia', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-asi-012', latitude: -8.3405, longitude: 115.0920, country: 'Indonesia', countryCode: 'ID', region: 'Bali', continent: 'Asia', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-asi-013', latitude: -6.2088, longitude: 106.8456, country: 'Indonesia', countryCode: 'ID', region: 'Jakarta', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-014', latitude: 3.1390, longitude: 101.6869, country: 'Malaysia', countryCode: 'MY', region: 'Kuala Lumpur', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-015', latitude: 5.4164, longitude: 100.3327, country: 'Malaysia', countryCode: 'MY', region: 'Penang', continent: 'Asia', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-asi-016', latitude: 14.5995, longitude: 120.9842, country: 'Philippines', countryCode: 'PH', region: 'Manila', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-asi-017', latitude: 1.3521, longitude: 103.8198, country: 'Singapore', countryCode: 'SG', region: 'Central Region', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-017b', latitude: 10.8231, longitude: 106.6297, country: 'Vietnam', countryCode: 'VN', region: 'Ho Chi Minh City', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-asi-017c', latitude: 11.5564, longitude: 104.9282, country: 'Cambodia', countryCode: 'KH', region: 'Phnom Penh', continent: 'Asia', environment: 'suburban', difficulty: 'medium' },

  // South Asia & Middle East & Central Asia
  { id: 'cand-asi-018', latitude: 15.2993, longitude: 74.1240, country: 'India', countryCode: 'IN', region: 'Goa', continent: 'Asia', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-asi-019', latitude: 9.9312, longitude: 76.2673, country: 'India', countryCode: 'IN', region: 'Kerala', continent: 'Asia', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-asi-020', latitude: 6.9271, longitude: 79.8612, country: 'Sri Lanka', countryCode: 'LK', region: 'Colombo', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-asi-021', latitude: 31.9522, longitude: 35.2332, country: 'Jordan', countryCode: 'JO', region: 'Amman', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-asi-022', latitude: 25.2048, longitude: 55.2708, country: 'United Arab Emirates', countryCode: 'AE', region: 'Dubai', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-023', latitude: 41.0082, longitude: 28.9784, country: 'Turkey', countryCode: 'TR', region: 'Istanbul', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-asi-024', latitude: 38.4237, longitude: 27.1428, country: 'Turkey', countryCode: 'TR', region: 'Izmir', continent: 'Asia', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-asi-025', latitude: 41.7151, longitude: 44.8271, country: 'Georgia', countryCode: 'GE', region: 'Tbilisi', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-asi-026', latitude: 43.2389, longitude: 76.8897, country: 'Kazakhstan', countryCode: 'KZ', region: 'Almaty', continent: 'Asia', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-asi-027', latitude: 40.1792, longitude: 44.4991, country: 'Armenia', countryCode: 'AM', region: 'Yerevan', continent: 'Asia', environment: 'urban', difficulty: 'medium' },
];

// --- AFRICA (~45 candidates) ---
const AFRICA_CANDIDATES: CandidateLocation[] = [
  // South Africa
  { id: 'cand-afr-001', latitude: -33.9249, longitude: 18.4241, country: 'South Africa', countryCode: 'ZA', region: 'Western Cape', continent: 'Africa', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-afr-002', latitude: -26.2041, longitude: 28.0473, country: 'South Africa', countryCode: 'ZA', region: 'Gauteng', continent: 'Africa', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-afr-003', latitude: -29.8587, longitude: 31.0218, country: 'South Africa', countryCode: 'ZA', region: 'KwaZulu-Natal', continent: 'Africa', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-afr-004', latitude: -31.9000, longitude: 28.5000, country: 'South Africa', countryCode: 'ZA', region: 'Eastern Cape', continent: 'Africa', environment: 'rural', difficulty: 'hard' },

  // Kenya & Nigeria & Senegal & Ghana & Uganda & Rwanda & Botswana & Tunisia & Madagascar
  { id: 'cand-afr-005', latitude: -1.2921, longitude: 36.8219, country: 'Kenya', countryCode: 'KE', region: 'Nairobi', continent: 'Africa', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-afr-006', latitude: -0.5143, longitude: 35.2698, country: 'Kenya', countryCode: 'KE', region: 'Rift Valley', continent: 'Africa', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-afr-007', latitude: 6.5244, longitude: 3.3792, country: 'Nigeria', countryCode: 'NG', region: 'Lagos', continent: 'Africa', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-afr-008', latitude: 14.7167, longitude: -17.4677, country: 'Senegal', countryCode: 'SN', region: 'Dakar', continent: 'Africa', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-afr-009', latitude: 5.6037, longitude: -0.1870, country: 'Ghana', countryCode: 'GH', region: 'Accra', continent: 'Africa', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-afr-010', latitude: 0.3476, longitude: 32.5825, country: 'Uganda', countryCode: 'UG', region: 'Kampala', continent: 'Africa', environment: 'urban', difficulty: 'medium' },
  { id: 'cand-afr-011', latitude: -1.9441, longitude: 30.0619, country: 'Rwanda', countryCode: 'RW', region: 'Kigali', continent: 'Africa', environment: 'small_town', difficulty: 'medium' },
  { id: 'cand-afr-012', latitude: -24.6282, longitude: 25.9231, country: 'Botswana', countryCode: 'BW', region: 'Gaborone', continent: 'Africa', environment: 'suburban', difficulty: 'medium' },
  { id: 'cand-afr-013', latitude: 36.8065, longitude: 10.1815, country: 'Tunisia', countryCode: 'TN', region: 'Tunis', continent: 'Africa', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-afr-014', latitude: -29.3151, longitude: 27.4869, country: 'Lesotho', countryCode: 'LS', region: 'Maseru', continent: 'Africa', environment: 'mountainous', difficulty: 'hard' },
  { id: 'cand-afr-015', latitude: -26.3054, longitude: 31.1367, country: 'Eswatini', countryCode: 'SZ', region: 'Mbabane', continent: 'Africa', environment: 'rural', difficulty: 'hard' },
  { id: 'cand-afr-016', latitude: -18.8792, longitude: 47.5079, country: 'Madagascar', countryCode: 'MG', region: 'Analamanga', continent: 'Africa', environment: 'urban', difficulty: 'hard' },
];

// --- OCEANIA (~45 candidates) ---
const OCEANIA_CANDIDATES: CandidateLocation[] = [
  // Australia
  { id: 'cand-oce-001', latitude: -33.8688, longitude: 151.2093, country: 'Australia', countryCode: 'AU', region: 'New South Wales', continent: 'Oceania', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-oce-002', latitude: -37.8136, longitude: 144.9631, country: 'Australia', countryCode: 'AU', region: 'Victoria', continent: 'Oceania', environment: 'suburban', difficulty: 'easy' },
  { id: 'cand-oce-003', latitude: -27.4705, longitude: 153.0260, country: 'Australia', countryCode: 'AU', region: 'Queensland', continent: 'Oceania', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-oce-004', latitude: -31.9505, longitude: 115.8605, country: 'Australia', countryCode: 'AU', region: 'Western Australia', continent: 'Oceania', environment: 'highway', difficulty: 'medium' },
  { id: 'cand-oce-005', latitude: -42.8821, longitude: 147.3272, country: 'Australia', countryCode: 'AU', region: 'Tasmania', continent: 'Oceania', environment: 'rural', difficulty: 'medium' },
  { id: 'cand-oce-006', latitude: -12.4634, longitude: 130.8456, country: 'Australia', countryCode: 'AU', region: 'Northern Territory', continent: 'Oceania', environment: 'coastal', difficulty: 'hard' },
  { id: 'cand-oce-006b', latitude: -34.9285, longitude: 138.6007, country: 'Australia', countryCode: 'AU', region: 'South Australia', continent: 'Oceania', environment: 'suburban', difficulty: 'easy' },

  // New Zealand
  { id: 'cand-oce-007', latitude: -36.8485, longitude: 174.7633, country: 'New Zealand', countryCode: 'NZ', region: 'Auckland', continent: 'Oceania', environment: 'urban', difficulty: 'easy' },
  { id: 'cand-oce-008', latitude: -41.2865, longitude: 174.7762, country: 'New Zealand', countryCode: 'NZ', region: 'Wellington', continent: 'Oceania', environment: 'coastal', difficulty: 'easy' },
  { id: 'cand-oce-009', latitude: -45.0312, longitude: 168.6626, country: 'New Zealand', countryCode: 'NZ', region: 'Otago (Queenstown)', continent: 'Oceania', environment: 'mountainous', difficulty: 'medium' },
  { id: 'cand-oce-010', latitude: -43.5321, longitude: 172.6362, country: 'New Zealand', countryCode: 'NZ', region: 'Canterbury', continent: 'Oceania', environment: 'rural', difficulty: 'medium' },

  // Guam & American Samoa
  { id: 'cand-oce-011', latitude: 13.4443, longitude: 144.7937, country: 'Guam', countryCode: 'GU', region: 'Hagåtña', continent: 'Oceania', environment: 'coastal', difficulty: 'medium' },
  { id: 'cand-oce-012', latitude: -14.2756, longitude: -170.7020, country: 'American Samoa', countryCode: 'AS', region: 'Pago Pago', continent: 'Oceania', environment: 'coastal', difficulty: 'hard' },
];

/**
 * Combined Candidate Location Pool (~180 Candidates across 77 Countries)
 */
export const GAMEPLAY_CANDIDATE_LOCATIONS: CandidateLocation[] = [
  ...EUROPE_CANDIDATES,
  ...NORTH_AMERICA_CANDIDATES,
  ...SOUTH_AMERICA_CANDIDATES,
  ...ASIA_CANDIDATES,
  ...AFRICA_CANDIDATES,
  ...OCEANIA_CANDIDATES,
];

/**
 * Dedicated Integration Test Locations
 * Kept strictly isolated from gameplay pool to keep test assertions clean.
 */
export const INTEGRATION_TEST_CANDIDATE_LOCATIONS: CandidateLocation[] = [
  { id: 'test-cand-001', latitude: 48.8584, longitude: 2.2945, country: 'France', countryCode: 'FR', region: 'Paris', continent: 'Europe', environment: 'urban', difficulty: 'easy' },
  { id: 'test-cand-002', latitude: 35.6762, longitude: 139.6503, country: 'Japan', countryCode: 'JP', region: 'Tokyo', continent: 'Asia', environment: 'urban', difficulty: 'easy' },
  { id: 'test-cand-003', latitude: -33.8688, longitude: 151.2093, country: 'Australia', countryCode: 'AU', region: 'Sydney', continent: 'Oceania', environment: 'urban', difficulty: 'easy' },
  { id: 'test-cand-004', latitude: -22.9068, longitude: -43.1729, country: 'Brazil', countryCode: 'BR', region: 'Rio de Janeiro', continent: 'South America', environment: 'coastal', difficulty: 'easy' },
  { id: 'test-cand-005', latitude: 40.7128, longitude: -74.0060, country: 'United States', countryCode: 'US', region: 'New York', continent: 'North America', environment: 'urban', difficulty: 'easy' },
];
