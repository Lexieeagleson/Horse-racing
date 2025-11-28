import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGame } from '../../state/GameContext';
import { 
  subscribeToRoom, 
  updatePlayerProgress, 
  endRace,
  setCurrentTrivia,
  leaveRoom
} from '../../core/network';
import { RaceEngine, RACE_CONFIG } from '../../core/raceEngine';
import { TriviaMode, TRIVIA_CONFIG } from '../../modes/triviaMode';
import { ButtonMashMode } from '../../modes/buttonMashMode';
import { RandomMode, EVENT_TYPES } from '../../modes/randomMode';
import LaneView from '../../views/laneView';
import BirdsEyeView from '../../views/birdsEyeView';
import TriviaModal from './TriviaModal';
import ButtonMashUI from './ButtonMashUI';
import './raceScreen.css';

const RaceScreen = () => {
  const { state, actions } = useGame();
  const [showTrivia, setShowTrivia] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [stamina, setStamina] = useState({ current: 100, max: 100, percentage: 100, isOverheated: false });
  const [events, setEvents] = useState({});
  const [tapCount, setTapCount] = useState(0);
  const [networkPlayers, setNetworkPlayers] = useState(null);
  
  const raceEngineRef = useRef(null);
  const triviaModeRef = useRef(null);
  const buttonMashRef = useRef(null);
  const randomModeRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const lastSyncRef = useRef(0);
  
  // Use network players if available, otherwise fall back to state players
  const localPlayers = useMemo(() => {
    return networkPlayers || state.players || {};
  }, [networkPlayers, state.players]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (raceEngineRef.current) {
      raceEngineRef.current.stop();
      raceEngineRef.current = null;
    }
    if (triviaModeRef.current) {
      triviaModeRef.current.stop();
      triviaModeRef.current = null;
    }
    if (buttonMashRef.current) {
      buttonMashRef.current.stop();
      buttonMashRef.current = null;
    }
    if (randomModeRef.current) {
      randomModeRef.current.stop();
      randomModeRef.current = null;
    }
  }, []);

  // Initialize trivia mode
  const initializeTriviaMode = useCallback(() => {
    triviaModeRef.current = new TriviaMode(
      // On question
      async (question) => {
        setCurrentQuestion(question);
        setShowTrivia(true);
        // Broadcast to all players
        try {
          await setCurrentTrivia(state.roomCode, question);
        } catch (error) {
          console.error('Error broadcasting trivia:', error);
        }
      },
      // On result
      (result) => {
        if (raceEngineRef.current) {
          if (result.isCorrect) {
            raceEngineRef.current.setModifier(result.playerId, { boost: true });
            setTimeout(() => {
              if (raceEngineRef.current) {
                raceEngineRef.current.clearModifiers(result.playerId);
              }
            }, TRIVIA_CONFIG.boostDuration);
          } else {
            raceEngineRef.current.setModifier(result.playerId, { slowdown: true });
            setTimeout(() => {
              if (raceEngineRef.current) {
                raceEngineRef.current.clearModifiers(result.playerId);
              }
            }, TRIVIA_CONFIG.slowdownDuration);
          }
        }
      }
    );
    triviaModeRef.current.start();
  }, [state.roomCode]);

  // Initialize random mode
  const initializeRandomMode = useCallback((playerIds) => {
    randomModeRef.current = new RandomMode(
      playerIds,
      // On event
      (eventsData) => {
        setEvents(eventsData);
      },
      // On speed update
      (speeds) => {
        if (raceEngineRef.current) {
          Object.entries(speeds).forEach(([playerId, speed]) => {
            raceEngineRef.current.updatePlayerSpeed(playerId, speed);
          });
        }
      }
    );
    randomModeRef.current.start();
  }, []);

  // Initialize host race
  const initializeHostRace = useCallback((players) => {
    // Create race engine
    raceEngineRef.current = new RaceEngine(
      // On update
      async (updatedPlayers) => {
        setNetworkPlayers(updatedPlayers);
        
        // Sync to network periodically
        const now = Date.now();
        if (now - lastSyncRef.current > 200) {
          lastSyncRef.current = now;
          // Update all players in the room
          for (const playerId of Object.keys(updatedPlayers)) {
            const player = updatedPlayers[playerId];
            try {
              await updatePlayerProgress(state.roomCode, playerId, player.progress, player.speed);
            } catch (error) {
              console.error('Sync error:', error);
            }
          }
        }
      },
      // On finish
      async (winner, rankings) => {
        try {
          await endRace(state.roomCode, winner, rankings);
        } catch (error) {
          console.error('End race error:', error);
        }
      }
    );

    raceEngineRef.current.setPlayers(players);

    // Initialize game mode
    const gameMode = state.settings.gameMode;
    
    if (gameMode === 'trivia') {
      initializeTriviaMode();
    } else if (gameMode === 'random') {
      initializeRandomMode(Object.keys(players));
    }

    // Start race
    raceEngineRef.current.start();
  }, [state.roomCode, state.settings.gameMode, initializeTriviaMode, initializeRandomMode]);

  // Initialize race
  useEffect(() => {
    // Subscribe to room updates
    unsubscribeRef.current = subscribeToRoom(state.roomCode, (roomData) => {
      if (!roomData) {
        actions.setScreen('menu');
        return;
      }
      
      // Update players from network
      if (roomData.players) {
        setNetworkPlayers(roomData.players);
      }
      
      // Check for race end
      if (roomData.status === 'finished') {
        cleanup();
        actions.updateRoom({
          status: roomData.status,
          race: roomData.race,
          players: roomData.players
        });
        actions.setScreen('results');
        return;
      }

      // Handle trivia question from host
      if (roomData.currentTrivia && !state.isHost) {
        setCurrentQuestion(roomData.currentTrivia);
        setShowTrivia(true);
      }
    });

    // Initialize race engine for host
    const players = state.players || {};
    if (state.isHost) {
      initializeHostRace(players);
    }

    return () => {
      cleanup();
    };
  }, [state.roomCode, state.players, state.isHost, actions, cleanup, initializeHostRace]);

  // Handle trivia answer
  const handleTriviaAnswer = useCallback((answerIndex) => {
    setShowTrivia(false);
    
    if (state.isHost && triviaModeRef.current) {
      triviaModeRef.current.submitAnswer(state.playerId, answerIndex);
    }
  }, [state.isHost, state.playerId]);

  // Initialize button mash mode for player
  useEffect(() => {
    if (state.settings.gameMode === 'buttonMash') {
      const roomCode = state.roomCode;
      const playerId = state.playerId;
      
      buttonMashRef.current = new ButtonMashMode(
        playerId,
        async (speed) => {
          // Update local and sync
          try {
            await updatePlayerProgress(roomCode, playerId, 
              localPlayers[playerId]?.progress || 0, speed);
          } catch {
            // Ignore sync errors
          }
        },
        (staminaData) => {
          setStamina(staminaData);
        }
      );
      buttonMashRef.current.start();
    }

    return () => {
      if (buttonMashRef.current) {
        buttonMashRef.current.stop();
        buttonMashRef.current = null;
      }
    };
  }, [state.settings.gameMode, state.roomCode, state.playerId, localPlayers]);

  // Handle tap
  const handleTap = useCallback(() => {
    if (buttonMashRef.current) {
      buttonMashRef.current.tap();
      setTapCount(prev => prev + 1);
    }
  }, []);

  // Handle leave
  const handleLeave = useCallback(async () => {
    cleanup();
    try {
      await leaveRoom(state.roomCode, state.playerId, state.isHost);
    } catch {
      // Ignore errors when leaving
    }
    actions.reset();
    actions.setScreen('menu');
  }, [state.roomCode, state.playerId, state.isHost, actions, cleanup]);

  // Render view based on settings
  const renderRaceView = () => {
    if (state.settings.viewMode === 'birdsEye') {
      return <BirdsEyeView players={localPlayers} events={events} />;
    }
    return <LaneView players={localPlayers} events={events} />;
  };

  // Get event indicator for random mode
  const getEventIndicator = (playerId) => {
    const event = events[playerId];
    if (!event || event.type === EVENT_TYPES.NONE) return null;
    
    if (event.type === EVENT_TYPES.BOOST || event.type === EVENT_TYPES.SURGE) {
      return <span className="event-indicator boost">🚀</span>;
    }
    if (event.type === EVENT_TYPES.STUMBLE || event.type === EVENT_TYPES.TRIP) {
      return <span className="event-indicator stumble">💫</span>;
    }
    return null;
  };

  return (
    <div className="race-screen">
      {/* Header */}
      <div className="race-header">
        <button className="leave-btn" onClick={handleLeave}>✕</button>
        <div className="race-title">
          <span className="mode-badge">
            {state.settings.gameMode === 'random' && '🎲 Random'}
            {state.settings.gameMode === 'trivia' && '🧠 Trivia'}
            {state.settings.gameMode === 'buttonMash' && '👆 Tap Race'}
          </span>
        </div>
      </div>

      {/* Race View */}
      <div className="race-view-container">
        {renderRaceView()}
      </div>

      {/* Mode-specific UI */}
      {state.settings.gameMode === 'buttonMash' && (
        <ButtonMashUI 
          onTap={handleTap} 
          stamina={stamina}
          tapCount={tapCount}
        />
      )}

      {/* Random mode event indicators */}
      {state.settings.gameMode === 'random' && (
        <div className="random-events-display">
          {Object.entries(events).map(([playerId, event]) => {
            const player = localPlayers[playerId];
            if (!player || event?.type === EVENT_TYPES.NONE) return null;
            return (
              <div key={playerId} className="event-item">
                <span className="event-player">{player.name}</span>
                {getEventIndicator(playerId)}
              </div>
            );
          })}
        </div>
      )}

      {/* Trivia Modal */}
      {showTrivia && currentQuestion && (
        <TriviaModal
          key={currentQuestion.id}
          question={currentQuestion}
          onAnswer={handleTriviaAnswer}
          timeLimit={TRIVIA_CONFIG.answerTimeout}
        />
      )}
    </div>
  );
};

export default RaceScreen;
