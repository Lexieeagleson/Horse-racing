import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

// Initial state
const initialState = {
  // Player info
  playerId: null,
  playerName: '',
  playerAvatar: null,
  isHost: false,
  
  // Room info
  roomCode: null,
  roomStatus: null, // null, 'lobby', 'racing', 'finished'
  
  // Game settings
  settings: {
    viewMode: 'lane', // 'lane' or 'birdsEye'
    gameMode: 'random', // 'trivia', 'buttonMash', 'random'
    maxPlayers: 14
  },
  
  // All players in the room
  players: {},
  
  // Race state
  race: null,
  
  // Current trivia question (if in trivia mode)
  currentTrivia: null,
  
  // Connection status
  connected: true,
  
  // UI state
  screen: 'menu', // 'menu', 'lobby', 'race', 'results'
  error: null
};

// Action types
const ACTIONS = {
  SET_PLAYER_INFO: 'SET_PLAYER_INFO',
  SET_ROOM: 'SET_ROOM',
  UPDATE_ROOM: 'UPDATE_ROOM',
  SET_SETTINGS: 'SET_SETTINGS',
  SET_PLAYERS: 'SET_PLAYERS',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  SET_RACE: 'SET_RACE',
  SET_TRIVIA: 'SET_TRIVIA',
  SET_SCREEN: 'SET_SCREEN',
  SET_ERROR: 'SET_ERROR',
  SET_CONNECTED: 'SET_CONNECTED',
  RESET: 'RESET'
};

// Reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_PLAYER_INFO:
      return {
        ...state,
        playerId: action.payload.playerId ?? state.playerId,
        playerName: action.payload.playerName ?? state.playerName,
        playerAvatar: action.payload.playerAvatar ?? state.playerAvatar,
        isHost: action.payload.isHost ?? state.isHost
      };
    
    case ACTIONS.SET_ROOM:
      return {
        ...state,
        roomCode: action.payload.roomCode,
        roomStatus: action.payload.status || 'lobby',
        settings: action.payload.settings || state.settings,
        players: action.payload.players || {},
        race: action.payload.race || null
      };
    
    case ACTIONS.UPDATE_ROOM:
      return {
        ...state,
        roomStatus: action.payload.status ?? state.roomStatus,
        settings: action.payload.settings ?? state.settings,
        players: action.payload.players ?? state.players,
        race: action.payload.race ?? state.race,
        currentTrivia: action.payload.currentTrivia ?? state.currentTrivia
      };
    
    case ACTIONS.SET_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    
    case ACTIONS.SET_PLAYERS:
      return {
        ...state,
        players: action.payload
      };
    
    case ACTIONS.UPDATE_PLAYER:
      return {
        ...state,
        players: {
          ...state.players,
          [action.payload.playerId]: {
            ...state.players[action.payload.playerId],
            ...action.payload.data
          }
        }
      };
    
    case ACTIONS.SET_RACE:
      return {
        ...state,
        race: action.payload
      };
    
    case ACTIONS.SET_TRIVIA:
      return {
        ...state,
        currentTrivia: action.payload
      };
    
    case ACTIONS.SET_SCREEN:
      return {
        ...state,
        screen: action.payload
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case ACTIONS.SET_CONNECTED:
      return {
        ...state,
        connected: action.payload
      };
    
    case ACTIONS.RESET:
      return {
        ...initialState,
        playerName: state.playerName,
        playerAvatar: state.playerAvatar
      };
    
    default:
      return state;
  }
};

// Create context
const GameContext = createContext(null);

// Provider component
export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Action creators
  const actions = useMemo(() => ({
    setPlayerInfo: (info) => dispatch({ type: ACTIONS.SET_PLAYER_INFO, payload: info }),
    setRoom: (room) => dispatch({ type: ACTIONS.SET_ROOM, payload: room }),
    updateRoom: (data) => dispatch({ type: ACTIONS.UPDATE_ROOM, payload: data }),
    setSettings: (settings) => dispatch({ type: ACTIONS.SET_SETTINGS, payload: settings }),
    setPlayers: (players) => dispatch({ type: ACTIONS.SET_PLAYERS, payload: players }),
    updatePlayer: (playerId, data) => dispatch({ type: ACTIONS.UPDATE_PLAYER, payload: { playerId, data } }),
    setRace: (race) => dispatch({ type: ACTIONS.SET_RACE, payload: race }),
    setTrivia: (trivia) => dispatch({ type: ACTIONS.SET_TRIVIA, payload: trivia }),
    setScreen: (screen) => dispatch({ type: ACTIONS.SET_SCREEN, payload: screen }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setConnected: (connected) => dispatch({ type: ACTIONS.SET_CONNECTED, payload: connected }),
    reset: () => dispatch({ type: ACTIONS.RESET })
  }), []);

  const value = useMemo(() => ({
    state,
    actions,
    dispatch
  }), [state, actions]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use game state
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

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

export default GameContext;
