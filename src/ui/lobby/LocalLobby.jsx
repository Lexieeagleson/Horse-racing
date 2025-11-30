import { useState, useCallback } from 'react';
import { useGame } from '../../state/GameContext';
import './lobby.css';

// AI player names and emoji avatars for local mode
const AI_PLAYERS = [
  { name: 'Thunder', emoji: '🐎', color: '#FF6B6B' },
  { name: 'Lightning', emoji: '⚡', color: '#F8B500' },
  { name: 'Storm', emoji: '🌪️', color: '#45B7D1' },
  { name: 'Blaze', emoji: '🔥', color: '#FF6B6B' },
  { name: 'Shadow', emoji: '🌑', color: '#4A4A6A' },
  { name: 'Spirit', emoji: '👻', color: '#DDA0DD' },
  { name: 'Flash', emoji: '💨', color: '#4ECDC4' },
  { name: 'Rocket', emoji: '🚀', color: '#96CEB4' },
  { name: 'Comet', emoji: '☄️', color: '#85C1E9' },
  { name: 'Star', emoji: '⭐', color: '#FFEAA7' }
];

// Generate avatar data URL from emoji
const generateAvatarDataUrl = (emoji, color) => {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Draw background circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw emoji
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + 5);

  return canvas.toDataURL('image/png');
};

// Generate a unique player ID
const generatePlayerId = () => {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const LocalLobby = () => {
  const { state, actions } = useGame();
  const [aiCount, setAiCount] = useState(3);

  // Handle going back to menu
  const handleBackToMenu = useCallback(() => {
    actions.reset();
    actions.setLocalMode(false);
    actions.setScreen('menu');
  }, [actions]);

  // Handle settings change
  const handleSettingChange = useCallback((setting, value) => {
    actions.setSettings({ [setting]: value });
  }, [actions]);

  // Handle start race
  const handleStartRace = useCallback(() => {
    const playerId = generatePlayerId();
    
    // Create player entry for human player
    const humanPlayer = {
      id: playerId,
      name: state.playerName,
      avatar: state.playerAvatar,
      isHost: true,
      progress: 0,
      speed: 0,
      connected: true
    };

    // Create AI players
    const players = { [playerId]: humanPlayer };
    
    // Shuffle AI players and pick the required number
    const shuffledAI = [...AI_PLAYERS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < aiCount; i++) {
      const aiData = shuffledAI[i];
      const aiId = generatePlayerId();
      players[aiId] = {
        id: aiId,
        name: aiData.name,
        avatar: generateAvatarDataUrl(aiData.emoji, aiData.color),
        isHost: false,
        isAI: true,
        progress: 0,
        speed: 0,
        connected: true
      };
    }

    // Set up game state
    actions.setPlayerInfo({ playerId, isHost: true });
    actions.setPlayers(players);
    actions.updateRoom({ status: 'racing' });
    actions.setScreen('race');
  }, [state.playerName, state.playerAvatar, aiCount, actions]);

  // Preview of AI players that will be in the race
  const previewPlayers = AI_PLAYERS.slice(0, aiCount);

  return (
    <div className="lobby">
      {/* Header */}
      <div className="lobby-header">
        <button className="back-btn" onClick={handleBackToMenu}>←</button>
        <div className="local-title-section">
          <span className="local-label">Local Mode</span>
          <span className="local-title">🏠 Play vs AI</span>
        </div>
      </div>

      {/* Your Player Card */}
      <div className="players-section">
        <h3>You</h3>
        <div className="players-grid">
          <div className="player-card host">
            <div className="player-avatar">
              {state.playerAvatar ? (
                <img src={state.playerAvatar} alt={state.playerName} />
              ) : (
                <div className="avatar-placeholder">
                  {state.playerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <span className="player-name">{state.playerName}</span>
            <span className="host-badge">YOU</span>
          </div>
        </div>
      </div>

      {/* AI Opponents */}
      <div className="players-section">
        <h3>AI Opponents ({aiCount})</h3>
        <div className="ai-count-selector">
          {[1, 2, 3, 4, 5, 6].map(count => (
            <button
              key={count}
              className={`ai-count-btn ${aiCount === count ? 'active' : ''}`}
              onClick={() => setAiCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
        <div className="players-grid">
          {previewPlayers.map((ai, index) => (
            <div key={index} className="player-card ai-card">
              <div className="player-avatar" style={{ background: ai.color }}>
                <span className="ai-emoji">{ai.emoji}</span>
              </div>
              <span className="player-name">{ai.name}</span>
              <span className="ai-badge">AI</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
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

      {/* Start button */}
      <button className="start-btn" onClick={handleStartRace}>
        🏁 Start Race
      </button>
    </div>
  );
};

export default LocalLobby;
