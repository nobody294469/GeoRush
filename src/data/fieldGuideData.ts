export interface GuideEntry {
  id: string;
  category: 'driving' | 'bollards' | 'scripts' | 'plates' | 'camera_meta' | 'landscapes';
  title: string;
  subtitle: string;
  countryOrRegion: string;
  flag?: string;
  keyRule: string;
  visualClue: string;
  tags: string[];
  badgeColor?: string;
}

export const DRIVING_SIDE_INFO = {
  leftDriving: [
    { country: 'United Kingdom & Ireland', flag: '🇬🇧 🇮🇪', note: 'Yellow rear plates, white front plates.' },
    { country: 'Japan', flag: '🇯🇵', note: 'Low camera Gen 4, yellow plates on Kei cars, Japanese script.' },
    { country: 'Australia & New Zealand', flag: '🇦🇺 🇳🇿', note: 'Unique eucalyptus / gum trees, give way markings.' },
    { country: 'South Africa, Botswana, Eswatini, Lesotho', flag: '🇿🇦 🇧🇼 🇱🇸', note: 'Yellow outer road lines, safari/savannah terrain.' },
    { country: 'Thailand & Malaysia & Indonesia', flag: '🇹🇭 🇲🇾 🇮🇩', note: 'Tropical foliage, Thai/Malay/Indonesian script and bollards.' },
    { country: 'India, Sri Lanka, Bangladesh, Bhutan', flag: '🇮🇳 🇱🇰 🇧🇩 🇧🇹', note: 'Distinct local scripts, rickshaws, Bhutanese architecture.' },
    { country: 'Kenya & Uganda', flag: '🇰🇪 🇺🇬', note: 'Kenya has snorkel car, Uganda has white car front.' },
    { country: 'Malta & Cyprus', flag: '🇲🇹 🇨🇾', note: 'Mediterranean architecture, EU blue strips, left-hand drive.' },
    { country: 'Hong Kong & Macau', flag: '🇭🇰 🇲🇴', note: 'Dual Chinese/English signage, yellow rear plates in HK.' },
    { country: 'Singapore', flag: '🇸🇬', note: 'Dense tropical urban greenery, modern infrastructure.' }
  ],
  rightDrivingNote: 'The vast majority (~75%) of the world drives on the RIGHT side of the road (Europe mainland, Americas, China, Middle East, North/West Africa).'
};

export const FIELD_GUIDE_ENTRIES: GuideEntry[] = [
  // 1. BOLLARDS & ROAD FURNITURE
  {
    id: 'bollard_france',
    category: 'bollards',
    title: 'French D-Shape Bollard',
    subtitle: 'White cylinder with slanted red band and white reflector',
    countryOrRegion: 'France',
    flag: '🇫🇷',
    keyRule: 'White plastic bollard with a red reflector on the right and white on the left. Rounded top.',
    visualClue: 'Look for the distinct flat red band near the top of the post on French rural departmental roads (D-roads).',
    tags: ['France', 'Bollard', 'Europe', 'Red Band'],
    badgeColor: 'blue'
  },
  {
    id: 'bollard_poland',
    category: 'bollards',
    title: 'Polish Red-and-White Post',
    subtitle: 'Tall white post with wide red top band',
    countryOrRegion: 'Poland',
    flag: '🇵🇱',
    keyRule: 'White post with a very prominent red top portion and horizontal white reflector line.',
    visualClue: 'Distinctive tall red top band on roadside kilometre posts and guideposts throughout Poland.',
    tags: ['Poland', 'Bollard', 'Eastern Europe', 'Red White'],
    badgeColor: 'red'
  },
  {
    id: 'bollard_iceland',
    category: 'bollards',
    title: 'Icelandic Yellow Snow Markers',
    subtitle: 'Bright yellow tall posts with white/red reflectors',
    countryOrRegion: 'Iceland',
    flag: '🇮🇸',
    keyRule: 'Iceland features tall, bright yellow cylindrical snow marker posts along Route 1 (Ring Road).',
    visualClue: 'Treeless volcanic landscape, mossy rocks, yellow snow posts, and blue/white bridge markers.',
    tags: ['Iceland', 'Bollard', 'Snow Marker', 'Yellow', 'Nordic'],
    badgeColor: 'amber'
  },
  {
    id: 'bollard_australia',
    category: 'bollards',
    title: 'Australian White Guide Post',
    subtitle: 'White flat paddle post with red rectangular reflector',
    countryOrRegion: 'Australia',
    flag: '🇦🇺',
    keyRule: 'White rectangular flexible post with red reflector on left and white reflector on right.',
    visualClue: 'Often paired with red dirt shoulders, eucalyptus trees, and driving on the left.',
    tags: ['Australia', 'Bollard', 'Oceania', 'Red Dirt'],
    badgeColor: 'emerald'
  },
  {
    id: 'bollard_turkey',
    category: 'bollards',
    title: 'Turkish Trapezoid Bollard',
    subtitle: 'White post with red reflective slanted strip in black trapezoid',
    countryOrRegion: 'Turkey',
    flag: '🇹🇷',
    keyRule: 'White post with a black inset housing a red/white angled reflector.',
    visualClue: 'Paired with Turkish script (ğ, ı, ş, ç, ö, ü) and distinct mountainous Mediterranean/Anatolian terrain.',
    tags: ['Turkey', 'Bollard', 'Eurasia', 'Black Inset'],
    badgeColor: 'rose'
  },
  {
    id: 'bollard_austria_slovenia',
    category: 'bollards',
    title: 'Austrian & Slovenian Black Top Bollard',
    subtitle: 'White bollard with black slanted top and white reflector',
    countryOrRegion: 'Austria & Slovenia',
    flag: '🇦🇹 🇸🇮',
    keyRule: 'Austria has rounder posts with a black top cap; Slovenia uses similar black tops with small red reflectors on reverse side.',
    visualClue: 'Alpine valleys, tidy wooden barns, and German/Slovenian signage.',
    tags: ['Austria', 'Slovenia', 'Bollard', 'Black Top', 'Alps'],
    badgeColor: 'slate'
  },

  // 2. ALPHABETS & SCRIPTS
  {
    id: 'script_cyrillic_unique',
    category: 'scripts',
    title: 'Cyrillic Country Distinctions',
    subtitle: 'Recognize unique Cyrillic letters to pinpoint specific nations',
    countryOrRegion: 'Russia, Ukraine, Bulgaria, Serbia, North Macedonia',
    flag: '🇷🇺 🇺🇦 🇧🇬 🇷🇸 🇲🇰',
    keyRule: '• Ukraine: Uses "і", "ї", "є", and "ґ".\n• Russia: Uses "ы", "э", "ё", and "ъ" (never "і" or "ї").\n• Bulgaria: Uses standard Cyrillic with "ъ" common in town names (e.g., гр. / ул.).\n• Serbia: Cyrillic + Latin dual signage; uses "Ђ", "Ћ", "Џ", "Љ", "Њ".\n• North Macedonia: Uses "Ѓ", "Ќ", "Ѕ".',
    visualClue: 'Spotting single letters like "ї" instantly locks you into Ukraine. "і" is also seen in Belarus and Kazakhstan.',
    tags: ['Cyrillic', 'Script', 'Ukraine', 'Russia', 'Bulgaria', 'Serbia'],
    badgeColor: 'indigo'
  },
  {
    id: 'script_greek',
    category: 'scripts',
    title: 'Greek Alphabet (Ελληνικά)',
    subtitle: 'Classic Greek characters with yellow rear signs',
    countryOrRegion: 'Greece & Cyprus',
    flag: '🇬🇷 🇨🇾',
    keyRule: 'Distinctive Greek letters (Ω, Ψ, Φ, Δ, Λ, Σ, Ξ, Θ). Road signs often show Greek on top in yellow and English below in white.',
    visualClue: 'Look for blue and white Orthodox church domes, olive trees, and island coastlines.',
    tags: ['Greek', 'Script', 'Greece', 'Cyprus', 'Mediterranean'],
    badgeColor: 'blue'
  },
  {
    id: 'script_thai_khmer',
    category: 'scripts',
    title: 'Thai vs Khmer vs Lao Scripts',
    subtitle: 'Distinguishing Southeast Asian cursive alphabets',
    countryOrRegion: 'Thailand, Cambodia, Laos',
    flag: '🇹🇭 🇰🇭 🇱🇦',
    keyRule: '• Thai (ไทย): Round loops on letters, sharp vertical strokes (drive on LEFT).\n• Khmer (ភាសាខ្មែរ): Wavy top crowns/crests above letters (drive on RIGHT).\n• Lao (ລາວ): Rounded curvy loops without crowns.',
    visualClue: 'If you see Thai script and driving is on the LEFT, it is Thailand. If driving on the RIGHT, check Cambodia.',
    tags: ['Thai', 'Khmer', 'Lao', 'Script', 'Southeast Asia'],
    badgeColor: 'amber'
  },
  {
    id: 'script_hangul',
    category: 'scripts',
    title: 'Korean Hangul (한글)',
    subtitle: 'Geometric blocks composed of circles, squares, and lines',
    countryOrRegion: 'South Korea',
    flag: '🇰🇷',
    keyRule: 'Hangul is composed of syllables arranged in square blocks (e.g. 서울). Prominent circles (ㅇ) and straight angles.',
    visualClue: 'Paired with blue highway signs with yellow exit numbers and clean urban infrastructure.',
    tags: ['Korean', 'Hangul', 'Script', 'South Korea', 'Asia'],
    badgeColor: 'emerald'
  },
  {
    id: 'script_hebrew',
    category: 'scripts',
    title: 'Hebrew Script (עברית)',
    subtitle: 'Square block letters written right-to-left',
    countryOrRegion: 'Israel',
    flag: '🇮🇱',
    keyRule: 'Square block characters (ש, ל, מ, א, ת). Road signs are trilingual: Hebrew on top, Arabic in middle, English at bottom.',
    visualClue: 'Yellow front and rear license plates on all regular Israeli passenger cars.',
    tags: ['Hebrew', 'Script', 'Israel', 'Middle East', 'Trilingual'],
    badgeColor: 'sky'
  },

  // 3. LICENSE PLATES
  {
    id: 'plate_yellow_rear',
    category: 'plates',
    title: 'Yellow Rear License Plates',
    subtitle: 'Front white, rear yellow',
    countryOrRegion: 'United Kingdom & Gibraltar',
    flag: '🇬🇧 🇬🇮',
    keyRule: 'Vehicles have white front plates and bright yellow rectangular rear plates. Drive on the LEFT.',
    visualClue: 'Paired with English road signs (miles/mph) and red double-decker buses or brick terraced housing.',
    tags: ['UK', 'License Plate', 'Yellow Plate', 'Europe'],
    badgeColor: 'amber'
  },
  {
    id: 'plate_yellow_both',
    category: 'plates',
    title: 'Double Yellow License Plates',
    subtitle: 'Both front and rear plates are yellow',
    countryOrRegion: 'Netherlands, Luxembourg, Israel',
    flag: '🇳🇱 🇱🇺 🇮🇱',
    keyRule: '• Netherlands: Yellow plates front & back with blue EU strip on left. Flat country, bicycle paths, brick roads.\n• Luxembourg: Yellow plates with blue EU strip; French/German bilingual signs.\n• Israel: Yellow plates front & back without EU strip; Hebrew/Arabic signs.',
    visualClue: 'If you see double yellow plates in flat Northern Europe with brick architecture, it is Netherlands.',
    tags: ['Netherlands', 'Luxembourg', 'Israel', 'License Plate', 'Yellow'],
    badgeColor: 'yellow'
  },
  {
    id: 'plate_colombia',
    category: 'plates',
    title: 'Colombian Yellow Commercial & Taxi Plates',
    subtitle: 'Yellow plates on taxis, buses, and commercial vehicles',
    countryOrRegion: 'Colombia',
    flag: '🇨🇴',
    keyRule: 'Public transport, taxis, and utility trucks in Colombia sport bright yellow license plates with side door municipal stickers.',
    visualClue: 'Lush green Andean mountains, red brick buildings in Bogotá/Medellín, and cross-shaped back of road signs.',
    tags: ['Colombia', 'License Plate', 'South America', 'Andes'],
    badgeColor: 'orange'
  },
  {
    id: 'plate_mercosur',
    category: 'plates',
    title: 'Mercosur License Plate Standard',
    subtitle: 'White plate with top blue stripe',
    countryOrRegion: 'Brazil, Argentina, Uruguay',
    flag: '🇧🇷 🇦🇷 🇺🇾',
    keyRule: 'White license plate featuring a solid blue band along the top edge with the Mercosur logo.',
    visualClue: '• Brazil: Portuguese road text (Pare, Rodovia, Rua).\n• Argentina: Spanish road text with black road sign backs.\n• Uruguay: Tridents and coastal rolling plains.',
    tags: ['Mercosur', 'Brazil', 'Argentina', 'Uruguay', 'License Plate'],
    badgeColor: 'blue'
  },

  // 4. CAMERA & CAR META CLUES
  {
    id: 'meta_kenya_snorkel',
    category: 'camera_meta',
    title: 'Kenya Snorkel Car',
    subtitle: 'Prominent black intake snorkel visible on front right of car hood',
    countryOrRegion: 'Kenya',
    flag: '🇰🇪',
    keyRule: 'Kenya Street View car has a large black safari snorkel mounted along the hood/windshield.',
    visualClue: 'Acacia trees, red dirt, driving on the left, Swahili/English signage.',
    tags: ['Kenya', 'Camera Meta', 'Snorkel', 'Africa'],
    badgeColor: 'emerald'
  },
  {
    id: 'meta_roof_racks',
    category: 'camera_meta',
    title: 'Prominent Metal Roof Racks',
    subtitle: 'Visible metal roof bars framing the 360 camera',
    countryOrRegion: 'Guatemala, Kyrgyzstan, Dominican Republic, Mongolia',
    flag: '🇬🇹 🇰🇬 🇩🇴 🇲🇳',
    keyRule: '• Guatemala: Thick black/silver roof rack with mirrors.\n• Kyrgyzstan: White/silver roof rack bars, high mountains.\n• Dominican Republic: Black roof rack with yellow/black roof light.\n• Mongolia: Heavy pickup truck bed / roof rack in vast steppe.',
    visualClue: 'Looking down at the car base reveals distinct tubular roof rack structures.',
    tags: ['Roof Rack', 'Guatemala', 'Kyrgyzstan', 'Mongolia', 'Dominican Republic'],
    badgeColor: 'purple'
  },
  {
    id: 'meta_ghana_tape',
    category: 'camera_meta',
    title: 'Ghana Black Tape Roof Bar',
    subtitle: 'Black electrical tape on one of the four roof rack bars',
    countryOrRegion: 'Ghana',
    flag: '🇬🇭',
    keyRule: 'Ghana Street View car features four roof rack poles, with one bar distinctly wrapped in black tape.',
    visualClue: 'Tropical West Africa, English signage, red soil, TroTro minibuses.',
    tags: ['Ghana', 'Camera Meta', 'Black Tape', 'West Africa'],
    badgeColor: 'amber'
  },
  {
    id: 'meta_senegal_rifts',
    category: 'camera_meta',
    title: 'Senegal Sky Rifts & French Signage',
    subtitle: 'Distinct sky stitching cracks and flat arid Sahel landscape',
    countryOrRegion: 'Senegal',
    flag: '🇸🇳',
    keyRule: 'Senegal coverage often features noticeable sky tear / halo rifts and French road signs (Stop / Ralentir).',
    visualClue: 'Baobab trees, sandy arid soil, colorful horse-drawn carts.',
    tags: ['Senegal', 'Sahel', 'Africa', 'Sky Rift', 'French'],
    badgeColor: 'teal'
  },

  // 5. LANDSCAPES & INFRASTRUCTURE
  {
    id: 'infra_japan_poles',
    category: 'landscapes',
    title: 'Japanese Utility Poles & Yellow Strips',
    subtitle: 'Concrete utility poles with yellow/black reflective stripes',
    countryOrRegion: 'Japan',
    flag: '🇯🇵',
    keyRule: 'Japanese telephone poles are round concrete with yellow-and-black hazard wrap at pedestrian height.',
    visualClue: 'Drive on LEFT, low camera height (Gen 4), blue roof tiles, and Kanji/Kana characters on asphalt.',
    tags: ['Japan', 'Utility Pole', 'Asia', 'Gen 4', 'Left Drive'],
    badgeColor: 'rose'
  },
  {
    id: 'infra_curacao_license',
    category: 'landscapes',
    title: 'Curaçao Unique Utility Poles & Tropical Coast',
    subtitle: 'Poles with yellow/black stripes, Dutch/Papiamento language',
    countryOrRegion: 'Curaçao',
    flag: '🇨🇼',
    keyRule: 'Caribbean island with Dutch colonial pastel architecture and arid cactus landscapes.',
    visualClue: 'Bright turquoise water, cactus trees, and Caribbean island plates.',
    tags: ['Curacao', 'Caribbean', 'Dutch', 'Poles'],
    badgeColor: 'cyan'
  }
];
