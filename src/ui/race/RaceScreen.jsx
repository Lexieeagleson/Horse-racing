import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGame } from '../../state/GameContext';
import { 
  subscribeToRoom, 
  updatePlayerProgress, 
  endRace,
  setCurrentTrivia,
  leaveRoom
} from '../../core/network';
import { RaceEngine, RACE_CONFIG, TRACK_LENGTH_CONFIG } from '../../core/raceEngine';
import { TriviaMode, TRIVIA_CONFIG } from '../../modes/triviaMode';
import { ButtonMashMode, isStaminaEnabled } from '../../modes/buttonMashMode';
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
  // Initialize stamina with enabled flag based on track length (6f sprints have no stamina)
  const trackLength = state.settings.trackLength || 6;
  const [stamina, setStamina] = useState({ 
    current: 100, 
    max: 100, 
    percentage: 100, 
    isOverheated: false,
    enabled: isStaminaEnabled(trackLength)
  });
  const [events, setEvents] = useState({});
  const [tapCount, setTapCount] = useState(0);
  const [networkPlayers, setNetworkPlayers] = useState(null);
  
  const raceEngineRef = useRef(null);
  const triviaModeRef = useRef(null);
  const buttonMashRef = useRef(null);
  const randomModeRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const lastSyncRef = useRef(0);
  
  // Compute tap target based on track length
  const tapTarget = useMemo(() => {
    const trackLength = state.settings.trackLength || 6;
    return TRACK_LENGTH_CONFIG[trackLength]?.tapTarget || 300;
  }, [state.settings.trackLength]);
  
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
    const trackLength = state.settings.trackLength || 6;
    triviaModeRef.current = new TriviaMode(
      // On question
      async (question) => {
        setCurrentQuestion(question);
        setShowTrivia(true);
        // Only broadcast to network in multiplayer mode
        if (!state.isLocalMode) {
          try {
            await setCurrentTrivia(state.roomCode, question);
          } catch (error) {
            console.error('Error broadcasting trivia:', error);
          }
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
      },
      trackLength
    );
    triviaModeRef.current.start();
  }, [state.roomCode, state.isLocalMode, state.settings.trackLength]);

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

  // Initialize host race (works for both local and multiplayer)
  const initializeHostRace = useCallback((players, isLocal) => {
    // Create race engine
    raceEngineRef.current = new RaceEngine(
      // On update
      async (updatedPlayers) => {
        setNetworkPlayers(updatedPlayers);
        
        // Only sync to network in multiplayer mode
        if (!isLocal) {
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
        }
      },
      // On finish
      async (winner, rankings) => {
        if (isLocal) {
          // For local mode, update state directly
          cleanup();
          actions.updateRoom({
            status: 'finished',
            race: { winner, rankings }
          });
          actions.setScreen('results');
        } else {
          try {
            await endRace(state.roomCode, winner, rankings);
          } catch (error) {
            console.error('End race error:', error);
          }
        }
      }
    );

    // Initialize game mode
    const gameMode = state.settings.gameMode;
    
    // Set trivia-specific base speed if in trivia mode
    if (gameMode === 'trivia') {
      const trackLength = state.settings.trackLength || 6;
      const triviaBaseSpeed = TRACK_LENGTH_CONFIG[trackLength]?.triviaBaseSpeed || 2.0;
      raceEngineRef.current.setBaseSpeed(triviaBaseSpeed);
    }

    raceEngineRef.current.setPlayers(players);

    if (gameMode === 'trivia') {
      initializeTriviaMode();
    } else if (gameMode === 'random') {
      initializeRandomMode(Object.keys(players));
    }

    // Start race
    raceEngineRef.current.start();
  }, [state.roomCode, state.settings.gameMode, state.settings.trackLength, initializeTriviaMode, initializeRandomMode, cleanup, actions]);

  // Initialize race
  useEffect(() => {
    const isLocal = state.isLocalMode;
    const players = state.players || {};

    // For local mode, skip network subscription
    if (isLocal) {
      // Initialize race engine directly for local mode
      initializeHostRace(players, true);
      return () => {
        cleanup();
      };
    }

    // For multiplayer mode, subscribe to room updates
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
    if (state.isHost) {
      initializeHostRace(players, false);
    }

    return () => {
      cleanup();
    };
  }, [state.roomCode, state.players, state.isHost, state.isLocalMode, actions, cleanup, initializeHostRace]);

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
      const isLocal = state.isLocalMode;
      const trackLength = state.settings.trackLength || 6;
      
      buttonMashRef.current = new ButtonMashMode(
        playerId,
        async (speed, progress) => {
          // For local mode, update race engine directly with progress based on taps
          if (isLocal && raceEngineRef.current) {
            // Directly set progress based on tap count / tap target
            if (raceEngineRef.current.players[playerId]) {
              raceEngineRef.current.players[playerId].progress = progress;
            }
            raceEngineRef.current.updatePlayerSpeed(playerId, speed);
          } else if (!isLocal) {
            // For multiplayer, sync to network
            try {
              await updatePlayerProgress(roomCode, playerId, progress, speed);
            } catch {
              // Ignore sync errors
            }
          }
        },
        (staminaData) => {
          setStamina(staminaData);
        },
        trackLength
      );
      buttonMashRef.current.start();
    }

    return () => {
      if (buttonMashRef.current) {
        buttonMashRef.current.stop();
        buttonMashRef.current = null;
      }
    };
  }, [state.settings.gameMode, state.settings.trackLength, state.roomCode, state.playerId, state.isLocalMode]);

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
    if (!state.isLocalMode) {
      try {
        await leaveRoom(state.roomCode, state.playerId, state.isHost);
      } catch {
        // Ignore errors when leaving
      }
    }
    actions.reset();
    actions.setLocalMode(false);
    actions.setScreen('menu');
  }, [state.roomCode, state.playerId, state.isHost, state.isLocalMode, actions, cleanup]);

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
          tapTarget={tapTarget}
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
