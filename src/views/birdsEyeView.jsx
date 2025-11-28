import { useState, useEffect, useRef, memo } from 'react';
import './birdsEyeView.css';

// Birds-Eye Track View renderer
// Oval/loop track visible from above, avatars follow path based on progress

const BIRDS_EYE_CONFIG = {
  avatarSize: 36,
  trackWidth: 40,
  animationDuration: 100,
  defaultWidth: 350
};

// Calculate position on oval track
const getPositionOnTrack = (progress, width, height, padding) => {
  // Convert progress (0-100) to radians (0 to 2PI)
  // Start at the bottom-left and go counter-clockwise
  const angle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = (width - padding * 2 - BIRDS_EYE_CONFIG.trackWidth) / 2;
  const radiusY = (height - padding * 2 - BIRDS_EYE_CONFIG.trackWidth) / 2;
  
  return {
    x: centerX + radiusX * Math.cos(angle),
    y: centerY + radiusY * Math.sin(angle)
  };
};

// Individual racer on track
const TrackRacer = memo(({ player, position, size }) => {
  return (
    <div
      className={`track-racer ${player.connected ? '' : 'disconnected'}`}
      style={{
        left: `${position.x - size / 2}px`,
        top: `${position.y - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        transition: `all ${BIRDS_EYE_CONFIG.animationDuration}ms linear`
      }}
    >
      {player.avatar ? (
        <img 
          src={player.avatar} 
          alt={player.name}
          className="track-racer-avatar"
        />
      ) : (
        <div className="track-racer-placeholder">
          {player.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
});

TrackRacer.displayName = 'TrackRacer';

// Main Birds-Eye View Component
const BirdsEyeView = ({ players }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ 
    width: BIRDS_EYE_CONFIG.defaultWidth, 
    height: Math.min(BIRDS_EYE_CONFIG.defaultWidth * 0.75, 300) 
  });
  const padding = 30;

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth || BIRDS_EYE_CONFIG.defaultWidth;
        const height = Math.min(width * 0.75, 300);
        setDimensions({ width, height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { width, height } = dimensions;
  const playerArray = Object.values(players || {}).filter(p => p.connected !== false);

  // Calculate track path for SVG
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = (width - padding * 2 - BIRDS_EYE_CONFIG.trackWidth) / 2;
  const radiusY = (height - padding * 2 - BIRDS_EYE_CONFIG.trackWidth) / 2;

  return (
    <div className="birds-eye-container" ref={containerRef}>
      <div 
        className="birds-eye-track"
        style={{ height: `${height}px` }}
      >
        {/* Track SVG */}
        <svg 
          className="track-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outer grass */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radiusX + BIRDS_EYE_CONFIG.trackWidth}
            ry={radiusY + BIRDS_EYE_CONFIG.trackWidth}
            fill="#2d5016"
          />
          
          {/* Track surface */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radiusX + BIRDS_EYE_CONFIG.trackWidth / 2}
            ry={radiusY + BIRDS_EYE_CONFIG.trackWidth / 2}
            fill="none"
            stroke="#8B6914"
            strokeWidth={BIRDS_EYE_CONFIG.trackWidth}
          />
          
          {/* Inner grass */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radiusX - BIRDS_EYE_CONFIG.trackWidth / 2}
            ry={radiusY - BIRDS_EYE_CONFIG.trackWidth / 2}
            fill="#1a3009"
          />
          
          {/* Track lines */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={radiusX + BIRDS_EYE_CONFIG.trackWidth / 2}
            ry={radiusY + BIRDS_EYE_CONFIG.trackWidth / 2}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            strokeDasharray="10 5"
          />
          
          {/* Start/Finish line */}
          <line
            x1={centerX}
            y1={centerY - radiusY - BIRDS_EYE_CONFIG.trackWidth}
            x2={centerX}
            y2={centerY - radiusY + BIRDS_EYE_CONFIG.trackWidth}
            stroke="white"
            strokeWidth="4"
          />
          <line
            x1={centerX + 4}
            y1={centerY - radiusY - BIRDS_EYE_CONFIG.trackWidth}
            x2={centerX + 4}
            y2={centerY - radiusY + BIRDS_EYE_CONFIG.trackWidth}
            stroke="black"
            strokeWidth="4"
          />
        </svg>

        {/* Racers */}
        {playerArray.map(player => {
          const position = getPositionOnTrack(player.progress || 0, width, height, padding);
          return (
            <TrackRacer
              key={player.id}
              player={player}
              position={position}
              size={BIRDS_EYE_CONFIG.avatarSize}
            />
          );
        })}
      </div>

      {/* Progress list */}
      <div className="birds-eye-progress">
        {playerArray
          .sort((a, b) => (b.progress || 0) - (a.progress || 0))
          .map((player, index) => (
            <div key={player.id} className="birds-eye-progress-item">
              <span className="position">{index + 1}</span>
              <div className="player-info">
                {player.avatar ? (
                  <img src={player.avatar} alt="" className="mini-avatar" />
                ) : (
                  <div className="mini-avatar-placeholder">
                    {player.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="name">{player.name}</span>
              </div>
              <span className="progress-value">{Math.round(player.progress || 0)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BirdsEyeView;
