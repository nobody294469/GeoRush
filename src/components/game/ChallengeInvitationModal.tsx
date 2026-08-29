import React from 'react';
import { ChallengeDuelData } from '../../utils/challengeManager';
import { Swords, Trophy, Play } from 'lucide-react';

interface ChallengeInvitationModalProps {
  challenge: ChallengeDuelData | null;
  onAccept: (challenge: ChallengeDuelData) => void;
  onDecline: () => void;
}

export const ChallengeInvitationModal: React.FC<ChallengeInvitationModalProps> = ({
  challenge,
  onAccept,
  onDecline
}) => {
  if (!challenge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-7 space-y-6 text-left text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Swords className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Duel Invitation
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              You Have Been Challenged!
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              <strong className="text-slate-800">{challenge.challengerName}</strong> sent you a direct geography match.
            </p>
          </div>
        </div>

        {/* Duel Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Target to Beat:</span>
            <span className="font-mono text-xl font-black text-emerald-700 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              {challenge.challengerScore.toLocaleString()} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2.5 border-t border-slate-200">
            <div>
              <span className="text-slate-400">Map: </span>
              <span className="font-bold text-slate-800 capitalize">{challenge.mapId}</span>
            </div>
            <div>
              <span className="text-slate-400">Mode: </span>
              <span className="font-bold text-slate-800 uppercase">{challenge.gameMode}</span>
            </div>
            <div>
              <span className="text-slate-400">Time Limit: </span>
              <span className="font-bold text-slate-800">
                {challenge.timeLimit > 0 ? `${challenge.timeLimit}s` : 'Unlimited'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Seed: </span>
              <span className="font-mono font-bold text-amber-700">{challenge.seed}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center leading-relaxed font-medium">
          You will play the exact same 5 locations in the same sequence.
        </p>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onAccept(challenge)}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white stroke-none" />
            <span>Accept Duel & Start Match</span>
          </button>

          <button
            type="button"
            onClick={onDecline}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center border border-slate-200"
          >
            Decline & Go to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
