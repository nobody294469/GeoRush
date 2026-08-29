/**
 * GeoRush — Progression, XP Calculation & Achievement Engine
 * 
 * Provides:
 * 1. XP calculation based on in-game performance, accuracy, speed, and streaks
 * 2. Player level formulas, titles, and XP thresholds
 * 3. Achievement registry, unlocking logic, and persistent storage
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'accuracy' | 'score' | 'streak' | 'daily' | 'exploration' | 'multiplayer';
  iconName: string;
  unlockedAt?: number; // timestamp if unlocked
  progress?: number;   // 0 to 100
  target?: number;
  currentValue?: number;
  xpReward: number;
}

export interface XPBreakdown {
  baseScoreXP: number;
  accuracyBonusXP: number;
  speedBonusXP: number;
  streakXP: number;
  completionXP: number;
  dailyBonusXP: number;
  duelBonusXP: number;
  achievementBonusXP: number;
  totalXP: number;
}

export interface PlayerProgression {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  title: string;
  unlockedAchievements: Record<string, number>; // achievementId -> unlocked timestamp
  stats: {
    perfectRounds: number;
    sub50kmGuesses: number;
    sub1kmGuesses: number;
    mapsPlayed: string[];
    highestSingleGameXP: number;
  };
}

export const STORAGE_KEY_PROGRESSION = 'georush_progression_v1';

// Base list of all available achievements
export const ACHIEVEMENTS_REGISTRY: Omit<Achievement, 'unlockedAt' | 'progress' | 'currentValue'>[] = [
  {
    id: 'first_steps',
    title: 'First Expedition',
    description: 'Complete your very first game of GeoRush',
    category: 'exploration',
    iconName: 'Compass',
    target: 1,
    xpReward: 200
  },
  {
    id: 'close_call',
    title: 'Bullseye',
    description: 'Make a guess within 50 km of the true location',
    category: 'accuracy',
    iconName: 'Target',
    target: 1,
    xpReward: 350
  },
  {
    id: 'pinpoint_precision',
    title: 'Pinpoint Master',
    description: 'Make a guess within 5 km of the true location',
    category: 'accuracy',
    iconName: 'Crosshair',
    target: 1,
    xpReward: 600
  },
  {
    id: 'perfect_5k',
    title: 'Flawless Deduction',
    description: 'Score a perfect 5,000 points on a single round',
    category: 'score',
    iconName: 'Sparkles',
    target: 1,
    xpReward: 750
  },
  {
    id: 'high_scorer',
    title: 'Globe Master',
    description: 'Score over 20,000 points in a standard 5-round game',
    category: 'score',
    iconName: 'Trophy',
    target: 1,
    xpReward: 800
  },
  {
    id: 'streak_cadet',
    title: 'Border Patrol',
    description: 'Achieve a Country Streak of at least 3 countries',
    category: 'streak',
    iconName: 'Flag',
    target: 3,
    xpReward: 300
  },
  {
    id: 'streak_champion',
    title: 'Streak Titan',
    description: 'Achieve a Country Streak of at least 10 countries',
    category: 'streak',
    iconName: 'Flame',
    target: 10,
    xpReward: 1000
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Submit a guess with 4,000+ points in under 10 seconds',
    category: 'score',
    iconName: 'Zap',
    target: 1,
    xpReward: 500
  },
  {
    id: 'daily_pioneer',
    title: 'Daily Challenger',
    description: 'Complete your first Daily Challenge match',
    category: 'daily',
    iconName: 'Calendar',
    target: 1,
    xpReward: 400
  },
  {
    id: 'daily_habit',
    title: 'Committed Explorer',
    description: 'Maintain a 3-day Daily Challenge streak',
    category: 'daily',
    iconName: 'Sun',
    target: 3,
    xpReward: 850
  },
  {
    id: 'world_traveler',
    title: 'World Traveler',
    description: 'Play games on at least 4 different regional maps',
    category: 'exploration',
    iconName: 'Globe',
    target: 4,
    xpReward: 650
  },
  {
    id: 'duel_victor',
    title: 'Duel Victor',
    description: 'Win a multiplayer duel against another explorer',
    category: 'multiplayer',
    iconName: 'Swords',
    target: 1,
    xpReward: 500
  },
  {
    id: 'level_5',
    title: 'Seasoned Traveler',
    description: 'Reach Player Level 5',
    category: 'exploration',
    iconName: 'Award',
    target: 5,
    xpReward: 500
  },
  {
    id: 'level_10',
    title: 'Master Cartographer',
    description: 'Reach Player Level 10',
    category: 'exploration',
    iconName: 'Crown',
    target: 10,
    xpReward: 1200
  }
];

/**
 * Calculates XP required to advance to a level.
 * Level 1: 0 XP
 * Level 2: 500 XP
 * Level 3: 1,200 XP
 * Level 4: 2,100 XP
 * Level 5: 3,200 XP
 * ...
 */
export function getRequiredXPForLevel(lvl: number): number {
  if (lvl <= 1) return 0;
  // Cumulative progression curve: 250 * (lvl - 1)^1.4 + 250 * (lvl - 1)
  let total = 0;
  for (let i = 1; i < lvl; i++) {
    total += Math.round(350 + Math.pow(i, 1.35) * 150);
  }
  return total;
}

export function getLevelDetails(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  title: string;
} {
  let level = 1;
  while (totalXP >= getRequiredXPForLevel(level + 1)) {
    level++;
  }

  const currentLevelThreshold = getRequiredXPForLevel(level);
  const nextLevelThreshold = getRequiredXPForLevel(level + 1);
  const span = nextLevelThreshold - currentLevelThreshold;
  const currentXPInLevel = Math.max(0, totalXP - currentLevelThreshold);
  const progressPercent = span > 0 ? Math.min(100, Math.round((currentXPInLevel / span) * 100)) : 100;

  let title = 'Novice Scout';
  if (level >= 30) title = 'Legendary Atlas';
  else if (level >= 20) title = 'Geo Grandmaster';
  else if (level >= 15) title = 'Master Navigator';
  else if (level >= 10) title = 'Globe Voyager';
  else if (level >= 5) title = 'Cartographer';
  else if (level >= 3) title = 'Pathfinder';

  return {
    level,
    currentLevelXP: currentXPInLevel,
    nextLevelXP: span,
    progressPercent,
    title
  };
}

/**
 * Calculate XP breakdown for a finished round or match.
 */
export function calculateMatchXP(params: {
  totalScore?: number;
  roundScores?: number[];
  roundDistances?: number[];
  roundTimesSeconds?: number[];
  mode: 'classic' | 'time_attack' | 'country_streak' | 'daily_challenge' | 'duels';
  streakCount?: number;
  isDuelWon?: boolean;
}): XPBreakdown {
  const {
    totalScore = 0,
    roundDistances = [],
    roundScores = [],
    roundTimesSeconds = [],
    mode,
    streakCount = 0,
    isDuelWon = false
  } = params;

  // 1. Base Score XP: 1 XP per 10 points
  const baseScoreXP = Math.round(totalScore / 10);

  // 2. Accuracy Bonuses
  let accuracyBonusXP = 0;
  roundDistances.forEach(distKm => {
    if (distKm <= 1) accuracyBonusXP += 250;       // < 1 km
    else if (distKm <= 15) accuracyBonusXP += 120;  // < 15 km
    else if (distKm <= 50) accuracyBonusXP += 60;   // < 50 km
    else if (distKm <= 250) accuracyBonusXP += 25;  // < 250 km
  });

  // 3. Speed & Perfect Round Bonuses
  let speedBonusXP = 0;
  roundScores.forEach((score, index) => {
    if (score >= 5000) {
      speedBonusXP += 150; // Perfect round bonus
    }
    const timeTaken = roundTimesSeconds[index] || 999;
    if (timeTaken <= 8 && score >= 4000) {
      speedBonusXP += 100; // Quick deduction bonus
    }
  });

  // 4. Streak Mode XP
  let streakXP = 0;
  if (mode === 'country_streak') {
    streakXP = streakCount * 50;
    if (streakCount >= 5) streakXP += 200;
    if (streakCount >= 10) streakXP += 500;
  }

  // 5. Match Completion Bonus
  const completionXP = 100;

  // 6. Daily Challenge Bonus
  const dailyBonusXP = mode === 'daily_challenge' ? 250 : 0;

  // 7. Multiplayer Duel Win Bonus
  const duelBonusXP = isDuelWon ? 350 : 0;

  const totalXP = baseScoreXP + accuracyBonusXP + speedBonusXP + streakXP + completionXP + dailyBonusXP + duelBonusXP;

  return {
    baseScoreXP,
    accuracyBonusXP,
    speedBonusXP,
    streakXP,
    completionXP,
    dailyBonusXP,
    duelBonusXP,
    achievementBonusXP: 0,
    totalXP
  };
}

/**
 * Loads current player progression from localStorage.
 */
export function loadProgression(): PlayerProgression {
  const defaultState: PlayerProgression = {
    totalXP: 0,
    level: 1,
    currentLevelXP: 0,
    nextLevelXP: 500,
    progressPercent: 0,
    title: 'Novice Scout',
    unlockedAchievements: {},
    stats: {
      perfectRounds: 0,
      sub50kmGuesses: 0,
      sub1kmGuesses: 0,
      mapsPlayed: ['world'],
      highestSingleGameXP: 0
    }
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      const levelInfo = getLevelDetails(parsed.totalXP || 0);
      return {
        ...defaultState,
        ...parsed,
        ...levelInfo,
        stats: {
          ...defaultState.stats,
          ...(parsed.stats || {})
        },
        unlockedAchievements: parsed.unlockedAchievements || {}
      };
    }
  } catch (err) {
    console.warn('[Progression] Failed to load progression:', err);
  }

  return defaultState;
}

/**
 * Saves progression to localStorage.
 */
export function saveProgression(prog: PlayerProgression): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESSION, JSON.stringify(prog));
  } catch (err) {
    console.warn('[Progression] Failed to save progression:', err);
  }
}

/**
 * Awards XP and checks for newly unlocked achievements.
 */
export function addXPAndCheckAchievements(params: {
  earnedXP: number;
  matchContext?: {
    score?: number;
    mode?: string;
    mapId?: string;
    roundDistances?: number[];
    roundScores?: number[];
    roundTimesSeconds?: number[];
    streak?: number;
    isDuelWon?: boolean;
    dailyStreak?: number;
    totalGamesPlayed?: number;
  };
}): {
  updatedProgression: PlayerProgression;
  newlyUnlocked: Achievement[];
  leveledUp: boolean;
  previousLevel: number;
  currentLevel: number;
} {
  const current = loadProgression();
  const previousLevel = current.level;
  const newTotalXP = current.totalXP + params.earnedXP;

  // Track map played
  const mapsPlayedSet = new Set(current.stats.mapsPlayed || []);
  if (params.matchContext?.mapId) {
    mapsPlayedSet.add(params.matchContext.mapId);
  }

  // Track accuracy stats
  let newSub50km = current.stats.sub50kmGuesses || 0;
  let newSub1km = current.stats.sub1kmGuesses || 0;
  let newPerfectRounds = current.stats.perfectRounds || 0;

  params.matchContext?.roundDistances?.forEach(d => {
    if (d <= 50) newSub50km++;
    if (d <= 5) newSub1km++;
  });

  params.matchContext?.roundScores?.forEach(s => {
    if (s >= 5000) newPerfectRounds++;
  });

  const updatedStats = {
    perfectRounds: newPerfectRounds,
    sub50kmGuesses: newSub50km,
    sub1kmGuesses: newSub1km,
    mapsPlayed: Array.from(mapsPlayedSet),
    highestSingleGameXP: Math.max(current.stats.highestSingleGameXP || 0, params.earnedXP)
  };

  const levelInfo = getLevelDetails(newTotalXP);
  const leveledUp = levelInfo.level > previousLevel;

  const unlockedMap = { ...current.unlockedAchievements };
  const newlyUnlocked: Achievement[] = [];
  const now = Date.now();

  // Helper to check & unlock
  const checkUnlock = (id: string, condition: boolean) => {
    if (condition && !unlockedMap[id]) {
      unlockedMap[id] = now;
      const def = ACHIEVEMENTS_REGISTRY.find(a => a.id === id);
      if (def) {
        newlyUnlocked.push({
          ...def,
          unlockedAt: now,
          progress: 100,
          currentValue: def.target
        });
      }
    }
  };

  const ctx = params.matchContext;

  // Evaluate achievements
  checkUnlock('first_steps', (ctx?.totalGamesPlayed || 0) >= 1);
  checkUnlock('close_call', (ctx?.roundDistances?.some(d => d <= 50) ?? false) || newSub50km >= 1);
  checkUnlock('pinpoint_precision', (ctx?.roundDistances?.some(d => d <= 5) ?? false) || newSub1km >= 1);
  checkUnlock('perfect_5k', (ctx?.roundScores?.some(s => s >= 5000) ?? false) || newPerfectRounds >= 1);
  checkUnlock('high_scorer', (ctx?.score || 0) >= 20000);
  checkUnlock('streak_cadet', (ctx?.streak || 0) >= 3);
  checkUnlock('streak_champion', (ctx?.streak || 0) >= 10);
  
  // Speed demon: score >= 4000 in <= 10s
  if (ctx?.roundScores && ctx?.roundTimesSeconds) {
    const hasFastHigh = ctx.roundScores.some((score, i) => score >= 4000 && (ctx.roundTimesSeconds?.[i] || 999) <= 10);
    checkUnlock('speed_demon', hasFastHigh);
  }

  checkUnlock('daily_pioneer', ctx?.mode === 'daily_challenge');
  checkUnlock('daily_habit', (ctx?.dailyStreak || 0) >= 3);
  checkUnlock('world_traveler', mapsPlayedSet.size >= 4);
  checkUnlock('duel_victor', !!ctx?.isDuelWon);
  checkUnlock('level_5', levelInfo.level >= 5);
  checkUnlock('level_10', levelInfo.level >= 10);

  // Add XP bonus for any newly unlocked achievements
  let achievementExtraXP = 0;
  newlyUnlocked.forEach(a => {
    achievementExtraXP += a.xpReward;
  });

  const finalTotalXP = newTotalXP + achievementExtraXP;
  const finalLevelInfo = getLevelDetails(finalTotalXP);

  const updatedProgression: PlayerProgression = {
    totalXP: finalTotalXP,
    ...finalLevelInfo,
    unlockedAchievements: unlockedMap,
    stats: updatedStats
  };

  saveProgression(updatedProgression);

  return {
    updatedProgression,
    newlyUnlocked,
    leveledUp: finalLevelInfo.level > previousLevel,
    previousLevel,
    currentLevel: finalLevelInfo.level
  };
}

/**
 * Returns complete list of achievements with unlock status and current progress.
 */
export function getAllAchievementsWithStatus(prog: PlayerProgression): Achievement[] {
  return ACHIEVEMENTS_REGISTRY.map(def => {
    const isUnlocked = !!prog.unlockedAchievements[def.id];
    const unlockedAt = prog.unlockedAchievements[def.id];

    let currentValue = 0;
    if (def.id === 'first_steps') currentValue = isUnlocked ? 1 : 0;
    else if (def.id === 'close_call') currentValue = prog.stats.sub50kmGuesses;
    else if (def.id === 'pinpoint_precision') currentValue = prog.stats.sub1kmGuesses;
    else if (def.id === 'perfect_5k') currentValue = prog.stats.perfectRounds;
    else if (def.id === 'world_traveler') currentValue = prog.stats.mapsPlayed.length;
    else if (def.id === 'level_5' || def.id === 'level_10') currentValue = prog.level;
    else currentValue = isUnlocked ? (def.target || 1) : 0;

    const target = def.target || 1;
    const progress = isUnlocked ? 100 : Math.min(100, Math.round((currentValue / target) * 100));

    return {
      ...def,
      unlockedAt,
      progress,
      currentValue: Math.min(target, currentValue)
    };
  });
}
