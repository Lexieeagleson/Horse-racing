import { useState, useCallback, useEffect } from 'react';
import './buttonMashUI.css';

const ButtonMashUI = ({ onTap, stamina, tapCount }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const handleTapStart = useCallback((e) => {
    e.preventDefault();
    setIsPressed(true);
    setShowRipple(true);
    onTap();
    
    // Reset ripple
    setTimeout(() => setShowRipple(false), 150);
  }, [onTap]);

  const handleTapEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  // Calculate stamina bar color
  const getStaminaColor = () => {
    if (stamina.isOverheated) return '#FF6B6B';
    if (stamina.percentage > 60) return '#4CAF50';
    if (stamina.percentage > 30) return '#FFC107';
    return '#FF6B6B';
  };

  return (
    <div className="button-mash-ui">
      {/* Stamina bar */}
      <div className="stamina-section">
        <div className="stamina-label">
          <span>Stamina</span>
          {stamina.isOverheated && <span className="overheat-warning">OVERHEATED!</span>}
        </div>
        <div className="stamina-bar-container">
          <div 
            className="stamina-bar-fill"
            style={{ 
              width: `${stamina.percentage}%`,
              backgroundColor: getStaminaColor()
            }}
          />
        </div>
      </div>

      {/* Tap counter */}
      <div className="tap-counter">
        <span className="tap-count">{tapCount}</span>
        <span className="tap-label">TAPS</span>
      </div>

      {/* Big tap button */}
      <div 
        className={`tap-button ${isPressed ? 'pressed' : ''} ${stamina.isOverheated ? 'disabled' : ''}`}
        onTouchStart={handleTapStart}
        onTouchEnd={handleTapEnd}
        onMouseDown={handleTapStart}
        onMouseUp={handleTapEnd}
        onMouseLeave={handleTapEnd}
      >
        {showRipple && <div className="tap-ripple" />}
        <span className="tap-icon">👆</span>
        <span className="tap-text">
          {stamina.isOverheated ? 'COOLING...' : 'TAP!'}
        </span>
      </div>

      {/* Instructions */}
      <p className="tap-instructions">
        Tap as fast as you can to race faster!
      </p>
    </div>
  );
};

export default ButtonMashUI;
