import { useGame } from './useGame';

// Selector hooks for specific state slices
export const usePlayer = () => {
  const { state } = useGame();
  return {
    playerId: state.playerId,
    playerName: state.playerName,
    playerAvatar: state.playerAvatar,
    isHost: state.isHost
  };
};

export const useRoom = () => {
  const { state } = useGame();
  return {
    roomCode: state.roomCode,
    roomStatus: state.roomStatus,
    settings: state.settings,
    players: state.players,
    race: state.race
  };
};

export const usePlayers = () => {
  const { state } = useGame();
  return state.players;
};

export const useSettings = () => {
  const { state } = useGame();
  return state.settings;
};

export const useScreen = () => {
  const { state } = useGame();
  return state.screen;
};
