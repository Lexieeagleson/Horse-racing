// Random Mode - No player input, random speed boosts and stumbles

export const RANDOM_CONFIG = {
  eventInterval: 1000, // ms between random events
  baseSpeed: 0.8,
  boostChance: 0.3, // 30% chance of boost
  stumbleChance: 0.2, // 20% chance of stumble
  boostMin: 1.2,
  boostMax: 2.0,
  stumbleMin: 0.3,
  stumbleMax: 0.6,
  eventDuration: 800 // ms each event lasts
};

// Random event types
export const EVENT_TYPES = {
  NONE: 'none',
  BOOST: 'boost',
  STUMBLE: 'stumble',
  SURGE: 'surge', // Extra strong boost
  TRIP: 'trip' // Extra strong stumble
};

// Generate a random event for a player
export const generateRandomEvent = () => {
  const roll = Math.random();
  
  if (roll < RANDOM_CONFIG.stumbleChance) {
    // Extra stumble chance for "trip"
    if (Math.random() < 0.2) {
      return {
        type: EVENT_TYPES.TRIP,
        multiplier: RANDOM_CONFIG.stumbleMin,
        duration: RANDOM_CONFIG.eventDuration * 1.5
      };
    }
    return {
      type: EVENT_TYPES.STUMBLE,
      multiplier: RANDOM_CONFIG.stumbleMin + Math.random() * (RANDOM_CONFIG.stumbleMax - RANDOM_CONFIG.stumbleMin),
      duration: RANDOM_CONFIG.eventDuration
    };
  }
  
  if (roll < RANDOM_CONFIG.stumbleChance + RANDOM_CONFIG.boostChance) {
    // Extra boost chance for "surge"
    if (Math.random() < 0.15) {
      return {
        type: EVENT_TYPES.SURGE,
        multiplier: RANDOM_CONFIG.boostMax * 1.5,
        duration: RANDOM_CONFIG.eventDuration * 0.8
      };
    }
    return {
      type: EVENT_TYPES.BOOST,
      multiplier: RANDOM_CONFIG.boostMin + Math.random() * (RANDOM_CONFIG.boostMax - RANDOM_CONFIG.boostMin),
      duration: RANDOM_CONFIG.eventDuration
    };
  }
  
  return {
    type: EVENT_TYPES.NONE,
    multiplier: 1.0,
    duration: RANDOM_CONFIG.eventDuration
  };
};

// Random Mode Controller (primarily for host)
export class RandomMode {
  constructor(playerIds, onEvent, onSpeedUpdate) {
    this.playerIds = playerIds;
    this.onEvent = onEvent;
    this.onSpeedUpdate = onSpeedUpdate;
    this.playerSpeeds = {};
    this.activeEvents = {};
    this.isActive = false;
    this.eventIntervalId = null;

    // Initialize speeds
    playerIds.forEach(id => {
      this.playerSpeeds[id] = RANDOM_CONFIG.baseSpeed;
      this.activeEvents[id] = null;
    });
  }

  start() {
    this.isActive = true;
    
    // Start event generation loop
    this.eventIntervalId = setInterval(() => {
      if (this.isActive) {
        this.generateEvents();
      }
    }, RANDOM_CONFIG.eventInterval);
  }

  stop() {
    this.isActive = false;
    if (this.eventIntervalId) {
      clearInterval(this.eventIntervalId);
      this.eventIntervalId = null;
    }
  }

  generateEvents() {
    // Generate random event for each player
    const events = {};
    
    this.playerIds.forEach(playerId => {
      const event = generateRandomEvent();
      events[playerId] = event;
      
      // Update player speed based on event
      this.playerSpeeds[playerId] = RANDOM_CONFIG.baseSpeed * event.multiplier;
      this.activeEvents[playerId] = event;

      // Reset speed after event duration
      setTimeout(() => {
        if (this.isActive) {
          this.playerSpeeds[playerId] = RANDOM_CONFIG.baseSpeed;
          this.activeEvents[playerId] = null;
        }
      }, event.duration);
    });

    // Notify listeners
    if (this.onEvent) {
      this.onEvent(events);
    }

    if (this.onSpeedUpdate) {
      this.onSpeedUpdate({ ...this.playerSpeeds });
    }
  }

  getSpeeds() {
    return { ...this.playerSpeeds };
  }

  getActiveEvents() {
    return { ...this.activeEvents };
  }

  setPlayerIds(playerIds) {
    this.playerIds = playerIds;
    playerIds.forEach(id => {
      if (this.playerSpeeds[id] === undefined) {
        this.playerSpeeds[id] = RANDOM_CONFIG.baseSpeed;
        this.activeEvents[id] = null;
      }
    });
  }
}

export default RandomMode;
