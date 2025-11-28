import { useState, useEffect, useRef, memo } from 'react';
import './laneView.css';

// Lane-based top-down view renderer
// Players race in horizontal lanes with progress along x-axis

const LANE_CONFIG = {
  laneHeight: 60,
  laneGap: 8,
  avatarSize: 48,
  trackPadding: 20,
  animationDuration: 100, // ms for smooth transitions
  defaultWidth: 350
};

// Individual racer component
const Racer = memo(({ player, laneIndex, trackWidth }) => {
  const progressPercent = player.progress || 0;
  const xPosition = LANE_CONFIG.trackPadding + 
    (progressPercent / 100) * (trackWidth - LANE_CONFIG.avatarSize - LANE_CONFIG.trackPadding * 2);
  
  return (
    <div 
      className={`lane-racer ${player.connected ? '' : 'disconnected'}`}
      style={{
        top: `${laneIndex * (LANE_CONFIG.laneHeight + LANE_CONFIG.laneGap) + (LANE_CONFIG.laneHeight - LANE_CONFIG.avatarSize) / 2}px`,
        left: `${xPosition}px`,
        width: `${LANE_CONFIG.avatarSize}px`,
        height: `${LANE_CONFIG.avatarSize}px`,
        transition: `left ${LANE_CONFIG.animationDuration}ms linear`
      }}
    >
      {player.avatar ? (
        <img 
          src={player.avatar} 
          alt={player.name}
          className="racer-avatar"
        />
      ) : (
        <div className="racer-placeholder">
          {player.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="racer-name">{player.name}</span>
    </div>
  );
});

Racer.displayName = 'Racer';

// Lane background
const Lane = memo(({ index, width }) => (
  <div 
    className="lane"
    style={{
      top: `${index * (LANE_CONFIG.laneHeight + LANE_CONFIG.laneGap)}px`,
      height: `${LANE_CONFIG.laneHeight}px`,
      width: `${width}px`
    }}
  >
    <div className="lane-track" />
  </div>
));

Lane.displayName = 'Lane';

// Main Lane View Component
const LaneView = ({ players }) => {
  const containerRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(LANE_CONFIG.defaultWidth);
  
  // Update width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setTrackWidth(containerRef.current.clientWidth || LANE_CONFIG.defaultWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  const playerArray = Object.values(players || {}).filter(p => p.connected !== false);
  const numLanes = Math.max(playerArray.length, 2);
  const trackHeight = numLanes * (LANE_CONFIG.laneHeight + LANE_CONFIG.laneGap);

  return (
    <div className="lane-view-container" ref={containerRef}>
      <div 
        className="lane-view-track"
        style={{ height: `${trackHeight}px` }}
      >
        {/* Render lanes */}
        {playerArray.map((_, index) => (
          <Lane 
            key={`lane-${index}`}
            index={index}
            width={trackWidth}
          />
        ))}
        
        {/* Render racers */}
        {playerArray.map((player, index) => (
          <Racer
            key={player.id}
            player={player}
            laneIndex={index}
            trackWidth={trackWidth}
          />
        ))}

        {/* Start line */}
        <div 
          className="start-line"
          style={{ left: `${LANE_CONFIG.trackPadding}px` }}
        />
        
        {/* Finish line */}
        <div 
          className="finish-line-marker"
          style={{ right: `${LANE_CONFIG.trackPadding}px` }}
        />
      </div>

      {/* Progress bars below track */}
      <div className="progress-bars">
        {playerArray.map(player => (
          <div key={player.id} className="progress-row">
            <span className="progress-name">{player.name}</span>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${player.progress || 0}%` }}
              />
            </div>
            <span className="progress-percent">{Math.round(player.progress || 0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LaneView;
