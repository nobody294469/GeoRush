import React from 'react';
import { MultiplayerGameSession } from '../../shared/types/multiplayer';
import { MultiplayerRoundResults } from './MultiplayerRoundResults';
import { MultiplayerFinalStandings } from './MultiplayerFinalStandings';
import { MultiplayerStreakRoundResults } from './MultiplayerStreakRoundResults';
import { MultiplayerStreakFinalStandings } from './MultiplayerStreakFinalStandings';

interface GameModeRendererProps {
  session: MultiplayerGameSession;
  activeRoundComponent: React.ReactNode;
}

export const GameModeRenderer: React.FC<GameModeRendererProps> = ({ session, activeRoundComponent }) => {
  if (session.gameType === 'country_streak') {
    if (session.roundState === 'ROUND_RESULTS') {
      return <MultiplayerStreakRoundResults />;
    }
    if (session.roundState === 'GAME_FINISHED') {
      return <MultiplayerStreakFinalStandings />;
    }
    return <>{activeRoundComponent}</>;
  }

  if (session.roundState === 'ROUND_RESULTS') {
    return <MultiplayerRoundResults />;
  }

  if (session.roundState === 'GAME_FINISHED') {
    return <MultiplayerFinalStandings />;
  }

  return <>{activeRoundComponent}</>;
};
