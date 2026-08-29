import { GameType, RoomSettings } from '../shared/types/multiplayer';

export interface GameModeStrategy {
  id: GameType;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultMaxRounds: number;
  maxAllowedRounds: number;
  allowedRulesets: Array<'normal' | 'pro'>;
  validateSettings: (
    customSettings?: Partial<RoomSettings>,
    currentPlayersCount?: number
  ) => { valid: boolean; settings: RoomSettings; error?: string };
}

export const CLASSIC_MODE_STRATEGY: GameModeStrategy = {
  id: 'classic',
  name: 'Classic',
  description: 'Global Street View location guessing across 5 rounds',
  minPlayers: 1,
  maxPlayers: 10,
  defaultMaxRounds: 5,
  maxAllowedRounds: 10,
  allowedRulesets: ['normal', 'pro'],
  validateSettings: (customSettings, _currentPlayersCount) => {
    const defaultSettings: RoomSettings = {
      maxRounds: 5,
      timeLimitSeconds: 0,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'classic'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    const merged: RoomSettings = { ...defaultSettings, ...customSettings, gameType: 'classic' };

    if (customSettings.maxRounds !== undefined) {
      if (!Number.isInteger(customSettings.maxRounds) || customSettings.maxRounds < 1 || customSettings.maxRounds > 10) {
        return { valid: false, settings: defaultSettings, error: 'maxRounds must be an integer between 1 and 10 for Classic mode.' };
      }
      merged.maxRounds = customSettings.maxRounds;
    }

    if (customSettings.timeLimitSeconds !== undefined) {
      if (!Number.isInteger(customSettings.timeLimitSeconds) || customSettings.timeLimitSeconds < 0 || customSettings.timeLimitSeconds > 300) {
        return { valid: false, settings: defaultSettings, error: 'timeLimitSeconds must be an integer between 0 and 300 seconds.' };
      }
      merged.timeLimitSeconds = customSettings.timeLimitSeconds;
    }

    if (customSettings.gameMode !== undefined) {
      if (customSettings.gameMode !== 'normal' && customSettings.gameMode !== 'pro') {
        return { valid: false, settings: defaultSettings, error: 'gameMode must be either "normal" or "pro".' };
      }
      merged.gameMode = customSettings.gameMode;
    }

    if (customSettings.mapId !== undefined) {
      if (typeof customSettings.mapId !== 'string' || customSettings.mapId.trim().length === 0) {
        return { valid: false, settings: defaultSettings, error: 'mapId must be a non-empty string.' };
      }
      merged.mapId = customSettings.mapId.trim();
    }

    return { valid: true, settings: merged };
  }
};

export const DUELS_MODE_STRATEGY: GameModeStrategy = {
  id: 'duels',
  name: '1v1 Duels',
  description: 'Head-to-head 1v1 battle with 6,000 HP and damage multipliers',
  minPlayers: 2,
  maxPlayers: 2,
  defaultMaxRounds: 20,
  maxAllowedRounds: 20,
  allowedRulesets: ['normal', 'pro'],
  validateSettings: (customSettings, _currentPlayersCount) => {
    const defaultSettings: RoomSettings = {
      maxRounds: 20,
      timeLimitSeconds: 0,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'duels'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    const merged: RoomSettings = { ...defaultSettings, ...customSettings, gameType: 'duels' };

    if (customSettings.maxRounds !== undefined) {
      if (!Number.isInteger(customSettings.maxRounds) || customSettings.maxRounds < 1 || customSettings.maxRounds > 20) {
        return { valid: false, settings: defaultSettings, error: 'maxRounds must be an integer between 1 and 20 for Duels mode.' };
      }
      merged.maxRounds = customSettings.maxRounds;
    }

    if (customSettings.timeLimitSeconds !== undefined) {
      if (!Number.isInteger(customSettings.timeLimitSeconds) || customSettings.timeLimitSeconds < 0 || customSettings.timeLimitSeconds > 300) {
        return { valid: false, settings: defaultSettings, error: 'timeLimitSeconds must be an integer between 0 and 300 seconds.' };
      }
      merged.timeLimitSeconds = customSettings.timeLimitSeconds;
    }

    if (customSettings.gameMode !== undefined) {
      if (customSettings.gameMode !== 'normal' && customSettings.gameMode !== 'pro') {
        return { valid: false, settings: defaultSettings, error: 'gameMode must be either "normal" or "pro".' };
      }
      merged.gameMode = customSettings.gameMode;
    }

    if (customSettings.mapId !== undefined) {
      if (typeof customSettings.mapId !== 'string' || customSettings.mapId.trim().length === 0) {
        return { valid: false, settings: defaultSettings, error: 'mapId must be a non-empty string.' };
      }
      merged.mapId = customSettings.mapId.trim();
    }

    return { valid: true, settings: merged };
  }
};

export const STREAK_MODE_STRATEGY: GameModeStrategy = {
  id: 'country_streak',
  name: 'Country Streak',
  description: 'Identify the country of global Street View panoramas to build a streak',
  minPlayers: 1,
  maxPlayers: 10,
  defaultMaxRounds: 100,
  maxAllowedRounds: 100,
  allowedRulesets: ['normal', 'pro'],
  validateSettings: (customSettings, _currentPlayersCount) => {
    const defaultSettings: RoomSettings = {
      maxRounds: 100,
      timeLimitSeconds: 0,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'country_streak'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    // Force mapId to 'world' and gameType to 'country_streak'
    const merged: RoomSettings = {
      ...defaultSettings,
      ...customSettings,
      gameType: 'country_streak',
      mapId: 'world'
    };

    if (customSettings.timeLimitSeconds !== undefined) {
      if (!Number.isInteger(customSettings.timeLimitSeconds) || customSettings.timeLimitSeconds < 0 || customSettings.timeLimitSeconds > 300) {
        return { valid: false, settings: defaultSettings, error: 'timeLimitSeconds must be an integer between 0 and 300 seconds.' };
      }
      merged.timeLimitSeconds = customSettings.timeLimitSeconds;
    }

    if (customSettings.gameMode !== undefined) {
      if (customSettings.gameMode !== 'normal' && customSettings.gameMode !== 'pro') {
        return { valid: false, settings: defaultSettings, error: 'gameMode must be either "normal" or "pro".' };
      }
      merged.gameMode = customSettings.gameMode;
    }

    return { valid: true, settings: merged };
  }
};

export const TIME_ATTACK_MODE_STRATEGY: GameModeStrategy = {
  id: 'time_attack',
  name: 'Time Attack',
  description: 'Fast-paced geographic guessing with a time multiplier (30s rounds)',
  minPlayers: 1,
  maxPlayers: 10,
  defaultMaxRounds: 5,
  maxAllowedRounds: 10,
  allowedRulesets: ['normal', 'pro'],
  validateSettings: (customSettings, _currentPlayersCount) => {
    const defaultSettings: RoomSettings = {
      maxRounds: 5,
      timeLimitSeconds: 30,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'time_attack'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    const merged: RoomSettings = { ...defaultSettings, ...customSettings, gameType: 'time_attack' };

    if (customSettings.maxRounds !== undefined) {
      if (!Number.isInteger(customSettings.maxRounds) || customSettings.maxRounds < 1 || customSettings.maxRounds > 10) {
        return { valid: false, settings: defaultSettings, error: 'maxRounds must be an integer between 1 and 10 for Time Attack mode.' };
      }
      merged.maxRounds = customSettings.maxRounds;
    }

    if (customSettings.timeLimitSeconds !== undefined) {
      if (!Number.isInteger(customSettings.timeLimitSeconds) || customSettings.timeLimitSeconds < 5 || customSettings.timeLimitSeconds > 300) {
        return { valid: false, settings: defaultSettings, error: 'timeLimitSeconds must be an integer between 5 and 300 seconds.' };
      }
      merged.timeLimitSeconds = customSettings.timeLimitSeconds;
    }

    if (customSettings.gameMode !== undefined) {
      if (customSettings.gameMode !== 'normal' && customSettings.gameMode !== 'pro') {
        return { valid: false, settings: defaultSettings, error: 'gameMode must be either "normal" or "pro".' };
      }
      merged.gameMode = customSettings.gameMode;
    }

    if (customSettings.mapId !== undefined) {
      if (typeof customSettings.mapId !== 'string' || customSettings.mapId.trim().length === 0) {
        return { valid: false, settings: defaultSettings, error: 'mapId must be a non-empty string.' };
      }
      merged.mapId = customSettings.mapId.trim();
    }

    return { valid: true, settings: merged };
  }
};

export const DAILY_CHALLENGE_MODE_STRATEGY: GameModeStrategy = {
  id: 'daily_challenge',
  name: 'Daily Challenge',
  description: 'Daily global challenge: 5 rounds with a fixed 2-minute timer on the World map (Normal Mode)',
  minPlayers: 1,
  maxPlayers: 1,
  defaultMaxRounds: 5,
  maxAllowedRounds: 5,
  allowedRulesets: ['normal'],
  validateSettings: (customSettings, _currentPlayersCount) => {
    const defaultSettings: RoomSettings = {
      maxRounds: 5,
      timeLimitSeconds: 120,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'daily_challenge'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    // Force mapId to 'world', timeLimitSeconds to 120, maxRounds to 5, gameMode to 'normal'
    const merged: RoomSettings = {
      ...defaultSettings,
      ...customSettings,
      gameType: 'daily_challenge',
      mapId: 'world',
      timeLimitSeconds: 120,
      maxRounds: 5,
      gameMode: 'normal'
    };

    return { valid: true, settings: merged };
  }
};

const MODE_REGISTRY: Record<string, GameModeStrategy> = {
  classic: CLASSIC_MODE_STRATEGY,
  duels: DUELS_MODE_STRATEGY,
  country_streak: STREAK_MODE_STRATEGY,
  time_attack: TIME_ATTACK_MODE_STRATEGY,
  daily_challenge: DAILY_CHALLENGE_MODE_STRATEGY
};

export function getModeStrategy(gameType: GameType = 'classic'): GameModeStrategy {
  const strategy = MODE_REGISTRY[gameType];
  if (!strategy) {
    throw new Error(`Unsupported game mode: "${gameType}". Supported modes are: classic, duels, country_streak, time_attack, daily_challenge.`);
  }
  return strategy;
}

export function getRegisteredModes(): GameModeStrategy[] {
  return Object.values(MODE_REGISTRY);
}

export function isModeRegistered(gameType: string): boolean {
  return gameType in MODE_REGISTRY;
}

export function validateRoomSettings(
  customSettings?: Partial<RoomSettings>,
  currentPlayersCount?: number
): { valid: boolean; settings: RoomSettings; error?: string } {
  const requestedType: GameType = customSettings?.gameType || 'classic';
  if (!isModeRegistered(requestedType)) {
    return {
      valid: false,
      settings: {
        maxRounds: 5,
        timeLimitSeconds: 0,
        gameMode: 'normal',
        mapId: 'world',
        gameType: 'classic'
      },
      error: `Unsupported game type: "${requestedType}". Allowed game types are: classic, duels, country_streak, time_attack, daily_challenge.`
    };
  }

  const strategy = getModeStrategy(requestedType);
  return strategy.validateSettings(customSettings, currentPlayersCount);
}
