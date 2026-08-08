import { GameMode, GameRules, GAME_MODE_PRESETS } from '../types/game';

export const DEFAULT_RULES: GameRules = {
  movement: 'ALLOW_MOVING',
  pan: 'ALLOW_PAN',
  zoom: 'ALLOW_ZOOM',
  timeLimitSeconds: 0
};

export const RULESET_PRESETS: Record<GameMode, Partial<GameRules>> = GAME_MODE_PRESETS;

export function getRulesetForMode(mode: GameMode, timeLimitSeconds: GameRules['timeLimitSeconds'] = 0): GameRules {
  const preset = RULESET_PRESETS[mode] || RULESET_PRESETS.normal;
  return {
    ...DEFAULT_RULES,
    ...preset,
    timeLimitSeconds
  };
}
