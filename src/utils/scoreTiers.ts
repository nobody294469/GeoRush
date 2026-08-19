export type ScoreTier = 'neutral' | 'warm' | 'good' | 'master';

export interface ScoreTierStyle {
  tier: ScoreTier;
  label: string;
  badge: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  glowClass: string;
}

/**
 * Classifies a score into one of 4 visual feedback tiers.
 * Default maxScore is 5000 (standard GeoGuessr/Classic scale).
 * For Time Attack, maxScore is 7500.
 * 
 * Tiers:
 * - < 50% (< 2500): Neutral / Slate
 * - 50% - 79.9% (2500 - 3999): Warm / Amber
 * - 80% - 95.9% (4000 - 4799): Good / Green
 * - 96%+ (4800+): Master / High-Score Diamond Celebration
 */
export function getScoreTier(score: number, maxScore: number = 5000): ScoreTier {
  const safeScore = Math.max(0, score);
  const safeMax = Math.max(1, maxScore);
  const ratio = safeScore / safeMax;

  if (ratio >= 0.96) return 'master';
  if (ratio >= 0.80) return 'good';
  if (ratio >= 0.50) return 'warm';
  return 'neutral';
}

/**
 * Returns clean Tailwind styling classes for a score tier.
 * Purely visual presentation.
 */
export function getScoreTierStyles(tier: ScoreTier): ScoreTierStyle {
  switch (tier) {
    case 'master':
      return {
        tier: 'master',
        label: 'Outstanding Guess!',
        badge: '💎',
        textColor: 'text-emerald-500 font-black',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        ringColor: 'ring-2 ring-emerald-400/40',
        glowClass: 'shadow-lg shadow-emerald-500/20'
      };
    case 'good':
      return {
        tier: 'good',
        label: 'Great Guess!',
        badge: '⭐',
        textColor: 'text-emerald-600 font-bold',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        ringColor: 'ring-1 ring-emerald-400/20',
        glowClass: 'shadow-sm'
      };
    case 'warm':
      return {
        tier: 'warm',
        label: 'Decent Guess',
        badge: '🎯',
        textColor: 'text-amber-500 font-semibold',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        ringColor: 'ring-1 ring-amber-400/20',
        glowClass: 'shadow-sm'
      };
    case 'neutral':
    default:
      return {
        tier: 'neutral',
        label: 'Far Away',
        badge: '📍',
        textColor: 'text-slate-400 font-medium',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        ringColor: 'ring-0',
        glowClass: ''
      };
  }
}
