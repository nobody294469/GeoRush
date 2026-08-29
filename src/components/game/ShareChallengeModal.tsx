import React, { useState } from 'react';
import { 
  ChallengeDuelData, 
  generateChallengeUrl 
} from '../../utils/challengeManager';
import { Swords, Copy, Check, X, Trophy } from 'lucide-react';

export interface ShareChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeData?: ChallengeDuelData;
  score?: number;
  seed?: string;
  challengerName?: string;
  gameMode?: 'normal' | 'pro';
  modeId?: 'classic' | 'time_attack';
  mapId?: string;
  timeLimit?: number;
  maxRounds?: number;
  roundScores?: number[];
}

export const ShareChallengeModal: React.FC<ShareChallengeModalProps> = ({
  isOpen,
  onClose,
  challengeData,
  score = 0,
  seed = 'EXP-SOLO',
  challengerName = 'Anonymous Explorer',
  gameMode = 'normal',
  modeId = 'classic',
  mapId = 'world',
  timeLimit = 0,
  maxRounds = 5,
  roundScores
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const finalChallengeData: ChallengeDuelData = challengeData || {
    seed: seed || 'EXP-SOLO',
    challengerName: challengerName || 'Anonymous Explorer',
    challengerScore: typeof score === 'number' ? score : 0,
    mapId: mapId || 'world',
    gameMode: (gameMode === 'pro' ? 'pro' : 'normal'),
    modeId: (modeId === 'time_attack' ? 'time_attack' : 'classic'),
    timeLimit: typeof timeLimit === 'number' ? timeLimit : 0,
    maxRounds: typeof maxRounds === 'number' ? maxRounds : 5,
    roundScores: roundScores,
    createdAt: Date.now()
  };

  let challengeUrl = '';
  try {
    challengeUrl = generateChallengeUrl(finalChallengeData);
  } catch {
    challengeUrl = window.location.href;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-6 text-left text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Challenge a Friend</h3>
              <p className="text-xs text-slate-500 font-medium">
                Share this match seed so a friend plays the exact same 5 locations!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duel Match Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Trophy className="w-4 h-4 text-amber-500" /> Score to Beat:
            </span>
            <span className="font-mono text-base font-black text-emerald-700">
              {(finalChallengeData.challengerScore || 0).toLocaleString()} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600 pt-3 border-t border-slate-200">
            <div>
              <span className="text-slate-400">Map: </span>
              <span className="font-bold text-slate-800 capitalize">{finalChallengeData.mapId}</span>
            </div>
            <div>
              <span className="text-slate-400">Mode: </span>
              <span className="font-bold text-slate-800 uppercase">{finalChallengeData.gameMode}</span>
            </div>
            <div>
              <span className="text-slate-400">Rounds: </span>
              <span className="font-bold text-slate-800">{finalChallengeData.maxRounds} Rounds</span>
            </div>
            <div>
              <span className="text-slate-400">Match Seed: </span>
              <span className="font-mono font-bold text-amber-700">{finalChallengeData.seed}</span>
            </div>
          </div>
        </div>

        {/* Shareable Link Input & Copy */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Shareable Duel Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={challengeUrl}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono px-3.5 py-3 rounded-2xl focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-amber-900 leading-relaxed bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
          💡 Anyone who opens this link will be placed into the exact same 5 Street View panoramas in sequence. When they finish, they'll see a head-to-head score comparison against your <strong className="text-amber-900">{(finalChallengeData.challengerScore || 0).toLocaleString()} pts</strong>!
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
