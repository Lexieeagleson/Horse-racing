import { useCallback } from 'react';
import { useGame } from '../../state/GameContext';
import { returnToLobby, leaveRoom } from '../../core/network';
import './results.css';

const Results = () => {
  const { state, actions } = useGame();
  
  const rankings = state.race?.rankings || [];
  const winner = rankings.find(r => r.isWinner) || rankings[0];

  // Handle play again
  const handlePlayAgain = useCallback(async () => {
    if (state.isLocalMode) {
      // For local mode, go back to local lobby
      actions.setScreen('localLobby');
    } else {
      try {
        await returnToLobby(state.roomCode);
        actions.setScreen('lobby');
      } catch (error) {
        console.error('Error returning to lobby:', error);
      }
    }
  }, [state.roomCode, state.isLocalMode, actions]);

  // Handle leave
  const handleLeave = useCallback(async () => {
    if (!state.isLocalMode) {
      try {
        await leaveRoom(state.roomCode, state.playerId, state.isHost);
      } catch {
        // Ignore
      }
    }
    actions.reset();
    actions.setLocalMode(false);
    actions.setScreen('menu');
  }, [state.roomCode, state.playerId, state.isHost, state.isLocalMode, actions]);

  // Get medal for position
  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="results-screen">
      {/* Winner announcement */}
      <div className="winner-section">
        <span className="trophy">🏆</span>
        <h1 className="winner-title">
          {winner?.playerId === state.playerId ? 'You Win!' : `${winner?.name || 'Winner'} Wins!`}
        </h1>
        {winner && (
          <div className="winner-avatar">
            {winner.avatar ? (
              <img src={winner.avatar} alt={winner.name} />
            ) : (
              <div className="avatar-placeholder">
                {winner.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rankings list */}
      <div className="rankings-section">
        <h2>Final Standings</h2>
        <div className="rankings-list">
          {rankings.map((player) => (
            <div 
              key={player.playerId} 
              className={`ranking-item ${player.playerId === state.playerId ? 'is-you' : ''} ${player.isWinner ? 'is-winner' : ''}`}
            >
              <span className="rank-medal">{getMedal(player.rank)}</span>
              <div className="rank-player">
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} className="rank-avatar" />
                ) : (
                  <div className="rank-avatar-placeholder">
                    {player.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="rank-name">
                  {player.name}
                  {player.playerId === state.playerId && <span className="you-tag">(You)</span>}
                </span>
              </div>
              <span className="rank-progress">{Math.round(player.progress)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="results-actions">
        {(state.isHost || state.isLocalMode) ? (
          <button className="action-btn primary" onClick={handlePlayAgain}>
            🔄 Play Again
          </button>
        ) : (
          <p className="waiting-host">Waiting for host...</p>
        )}
        <button className="action-btn secondary" onClick={handleLeave}>
          🚪 Leave Game
        </button>
      </div>
    </div>
  );
};

export default Results;
