import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../state/GameContext';
import { 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  updateRoomSettings, 
  startRace,
  subscribeToRoom,
  isFirebaseConfigured
} from '../../core/network';
import './lobby.css';

// Connection timeout in milliseconds
const CONNECTION_TIMEOUT_MS = 15000;

const Lobby = () => {
  const { state, actions } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle going back to menu
  const handleBackToMenu = useCallback(() => {
    actions.reset();
    actions.setScreen('menu');
  }, [actions]);

  // Initialize room (create or join)
  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;
    let timeoutId = null;
    let connectionComplete = false;
    
    const initRoom = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Check if Firebase is properly configured
        if (!isFirebaseConfigured()) {
          if (mounted) {
            setError('Firebase is not configured. Please set up your Firebase project and add the configuration to a .env file. See README.md for instructions.');
            setIsLoading(false);
          }
          return;
        }
        
        // Set a timeout to prevent indefinite loading
        timeoutId = setTimeout(() => {
          if (mounted && !connectionComplete) {
            setError('Connection timed out.');
            setIsLoading(false);
          }
        }, CONNECTION_TIMEOUT_MS);
        
        let roomCode = state.roomCode;
        let playerId = state.playerId;
        
        // If we're hosting (coming from 'hosting' screen)
        if (state.screen === 'hosting' && !roomCode) {
          const result = await createRoom(state.playerName, state.playerAvatar);
          if (!mounted) return;
          roomCode = result.roomCode;
          playerId = result.playerId;
          actions.setRoom({ roomCode });
          actions.setPlayerInfo({ playerId, isHost: true });
        }
        // If we're joining (coming from 'joining' screen)
        else if (state.screen === 'joining' && roomCode && !playerId) {
          const result = await joinRoom(roomCode, state.playerName, state.playerAvatar);
          if (!mounted) return;
          playerId = result.playerId;
          actions.setPlayerInfo({ playerId, isHost: false });
        }
        
        // Mark connection as complete and clear timeout
        connectionComplete = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Subscribe to room updates
        if (roomCode) {
          unsubscribe = subscribeToRoom(roomCode, (roomData) => {
            if (!mounted) return;
            if (!roomData) {
              // Room was deleted
              setError('Room no longer exists');
              actions.setScreen('menu');
              return;
            }
            
            actions.updateRoom({
              status: roomData.status,
              settings: roomData.settings,
              players: roomData.players,
              race: roomData.race,
              currentTrivia: roomData.currentTrivia
            });

            // If race started, switch to race screen
            if (roomData.status === 'racing') {
              actions.setScreen('race');
            }
            // If race finished, switch to results screen
            else if (roomData.status === 'finished') {
              actions.setScreen('results');
            }
          });
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        connectionComplete = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (mounted) {
          // Provide more helpful error messages based on error codes
          let errorMessage = err.message || 'Failed to connect';
          
          // Use error codes as primary classification (Firebase uses these)
          if (err.code === 'PERMISSION_DENIED') {
            errorMessage = 'Permission denied. Please check your Firebase database rules.';
          } else if (err.code === 'NETWORK_ERROR' || err.code === 'UNAVAILABLE') {
            errorMessage = 'Network error. Please check your internet connection.';
          } else if (err.message === 'Room not found') {
            // This is our own error from network.js joinRoom function
            errorMessage = 'Room not found. Please check the room code.';
          }
          
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };
    
    initRoom();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle leave
  const handleLeave = useCallback(async () => {
    try {
      await leaveRoom(state.roomCode, state.playerId, state.isHost);
      actions.reset();
      actions.setScreen('menu');
    } catch (error) {
      console.error('Error leaving room:', error);
      actions.reset();
      actions.setScreen('menu');
    }
  }, [state.roomCode, state.playerId, state.isHost, actions]);

  // Handle settings change
  const handleSettingChange = useCallback(async (setting, value) => {
    if (!state.isHost) return;
    try {
      await updateRoomSettings(state.roomCode, { [setting]: value });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [state.roomCode, state.isHost]);

  // Handle start race
  const handleStartRace = useCallback(async () => {
    if (!state.isHost) return;
    try {
      await startRace(state.roomCode);
    } catch {
      setError('Failed to start race');
    }
  }, [state.roomCode, state.isHost]);

  // Copy room code
  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(state.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [state.roomCode]);

  const players = Object.values(state.players || {}).filter(p => p.connected !== false);
  const playerCount = players.length;
  const canStart = playerCount >= 1 && state.isHost;

  if (isLoading) {
    return (
      <div className="lobby loading">
        <div className="loader"></div>
        <p>Connecting...</p>
        <button className="back-btn-loading" onClick={handleBackToMenu}>Cancel</button>
      </div>
    );
  }

  if (error && !state.roomCode) {
    return (
      <div className="lobby error-screen">
        <p className="error-text">{error}</p>
        <button onClick={handleBackToMenu}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="lobby">
      {/* Header with room code */}
      <div className="lobby-header">
        <button className="back-btn" onClick={handleLeave}>←</button>
        <div className="room-code-section" onClick={copyRoomCode}>
          <span className="room-label">Room Code</span>
          <span className="room-code">{state.roomCode}</span>
          <span className="copy-hint">{copied ? '✓ Copied!' : 'Tap to copy'}</span>
        </div>
      </div>

      {/* Players list */}
      <div className="players-section">
        <h3>Players ({playerCount}/{state.settings.maxPlayers})</h3>
        <div className="players-grid">
          {players.map(player => (
            <div key={player.id} className={`player-card ${player.isHost ? 'host' : ''}`}>
              <div className="player-avatar">
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {player.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <span className="player-name">{player.name}</span>
              {player.isHost && <span className="host-badge">HOST</span>}
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar">
                <div className="avatar-placeholder">?</div>
              </div>
              <span className="player-name">Waiting...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings (host only) */}
      {state.isHost && (
        <div className="settings-section">
          <h3>Game Settings</h3>
          
          <div className="setting-row">
            <label>Track View</label>
            <div className="toggle-buttons">
              <button 
                className={state.settings.viewMode === 'lane' ? 'active' : ''}
                onClick={() => handleSettingChange('viewMode', 'lane')}
              >
                Lane
              </button>
              <button 
                className={state.settings.viewMode === 'birdsEye' ? 'active' : ''}
                onClick={() => handleSettingChange('viewMode', 'birdsEye')}
              >
                Birds-Eye
              </button>
            </div>
          </div>
          
          <div className="setting-row">
            <label>Game Mode</label>
            <div className="toggle-buttons mode-buttons">
              <button 
                className={state.settings.gameMode === 'random' ? 'active' : ''}
                onClick={() => handleSettingChange('gameMode', 'random')}
              >
                🎲 Random
              </button>
              <button 
                className={state.settings.gameMode === 'trivia' ? 'active' : ''}
                onClick={() => handleSettingChange('gameMode', 'trivia')}
              >
                🧠 Trivia
              </button>
              <button 
                className={state.settings.gameMode === 'buttonMash' ? 'active' : ''}
                onClick={() => handleSettingChange('gameMode', 'buttonMash')}
              >
                👆 Tap
              </button>
            </div>
          </div>
          
          <div className="setting-row">
            <label>Track Length</label>
            <div className="toggle-buttons">
              <button 
                className={state.settings.trackLength === 6 ? 'active' : ''}
                onClick={() => handleSettingChange('trackLength', 6)}
              >
                🏃 Short (6F)
              </button>
              <button 
                className={state.settings.trackLength === 10 ? 'active' : ''}
                onClick={() => handleSettingChange('trackLength', 10)}
              >
                🏇 Long (10F)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-host sees settings display */}
      {!state.isHost && (
        <div className="settings-display">
          <p>
            <strong>Mode:</strong> {
              state.settings.gameMode === 'random' ? '🎲 Random' :
              state.settings.gameMode === 'trivia' ? '🧠 Trivia' :
              '👆 Tap Race'
            }
          </p>
          <p>
            <strong>View:</strong> {
              state.settings.viewMode === 'lane' ? 'Lane View' : 'Birds-Eye View'
            }
          </p>
          <p>
            <strong>Track:</strong> {
              state.settings.trackLength === 6 ? '🏃 Short (6 Furlongs)' : '🏇 Long (10 Furlongs)'
            }
          </p>
          <p className="waiting-text">Waiting for host to start...</p>
        </div>
      )}

      {/* Error display */}
      {error && <div className="error-message">{error}</div>}

      {/* Start button (host only) */}
      {state.isHost && (
        <button 
          className="start-btn"
          onClick={handleStartRace}
          disabled={!canStart}
        >
          🏁 Start Race
        </button>
      )}
    </div>
  );
};

export default Lobby;
