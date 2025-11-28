import { useState, useCallback } from 'react';
import { useGame } from '../../state/GameContext';
import AvatarSelector from '../../components/AvatarSelector';
import './mainMenu.css';

const MainMenu = () => {
  const { state, actions } = useGame();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [playerName, setPlayerName] = useState(state.playerName || '');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleAvatarSelect = useCallback((avatarData) => {
    actions.setPlayerInfo({ playerAvatar: avatarData });
  }, [actions]);

  const handleHostGame = useCallback(() => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!state.playerAvatar) {
      setError('Please select an avatar');
      return;
    }
    setError('');
    actions.setPlayerInfo({ playerName: playerName.trim() });
    actions.setScreen('hosting');
  }, [playerName, state.playerAvatar, actions]);

  const handleJoinGame = useCallback(() => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!state.playerAvatar) {
      setError('Please select an avatar');
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 4) {
      setError('Please enter a valid 4-digit code');
      return;
    }
    setError('');
    actions.setPlayerInfo({ playerName: playerName.trim() });
    actions.setRoom({ roomCode: joinCode.trim() });
    actions.setScreen('joining');
  }, [playerName, state.playerAvatar, joinCode, actions]);

  return (
    <div className="main-menu">
      <div className="menu-content">
        {/* Title */}
        <div className="game-title">
          <span className="title-emoji">🏇</span>
          <h1>Horse Racing</h1>
          <p className="subtitle">Multiplayer Race Game</p>
        </div>

        {/* Avatar Selection */}
        <div className="avatar-section" onClick={() => setShowAvatarSelector(true)}>
          <div className="avatar-display">
            {state.playerAvatar ? (
              <img src={state.playerAvatar} alt="Your avatar" />
            ) : (
              <div className="avatar-placeholder">+</div>
            )}
          </div>
          <span className="avatar-label">
            {state.playerAvatar ? 'Tap to change' : 'Choose avatar'}
          </span>
        </div>

        {/* Name Input */}
        <div className="input-group">
          <label htmlFor="playerName">Your Name</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={16}
          />
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Host Game Button */}
        <button className="menu-btn host-btn" onClick={handleHostGame}>
          <span className="btn-icon">🎮</span>
          Host Game
        </button>

        {/* Join Game Section */}
        <div className="join-section">
          <div className="join-divider">
            <span>or join a game</span>
          </div>
          <div className="join-input-row">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter code"
              maxLength={4}
              className="join-code-input"
            />
            <button 
              className="menu-btn join-btn"
              onClick={handleJoinGame}
              disabled={joinCode.length !== 4}
            >
              Join
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="menu-footer">Up to 14 players</p>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={state.playerAvatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default MainMenu;
