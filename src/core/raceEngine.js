// Race Engine - Core game logic shared across all modes
// This engine is rendering-agnostic and handles all race mechanics

export const RACE_CONFIG = {
  baseSpeed: 0.5, // Base progress per tick (percentage)
  boostMultiplier: 2.0,
  slowdownMultiplier: 0.3,
  maxSpeed: 3.0,
  minSpeed: 0.1,
  tickInterval: 100, // ms between updates
  finishLine: 100 // Progress percentage to win
};

// Calculate speed with modifiers
export const calculateSpeed = (baseSpeed, modifiers = {}) => {
  let speed = baseSpeed;
  
  if (modifiers.boost) {
    speed *= RACE_CONFIG.boostMultiplier;
  }
  if (modifiers.slowdown) {
    speed *= RACE_CONFIG.slowdownMultiplier;
  }
  if (modifiers.multiplier) {
    speed *= modifiers.multiplier;
  }
  
  return Math.max(RACE_CONFIG.minSpeed, Math.min(RACE_CONFIG.maxSpeed, speed));
};

// Update player progress based on speed
export const updateProgress = (currentProgress, speed, deltaTime) => {
  const progressDelta = (speed * deltaTime) / 1000;
  return Math.min(RACE_CONFIG.finishLine, currentProgress + progressDelta);
};

// Check if race is finished
export const isRaceFinished = (players) => {
  return Object.values(players).some(player => player.progress >= RACE_CONFIG.finishLine);
};

// Get race rankings
export const getRankings = (players) => {
  return Object.values(players)
    .filter(p => p.connected)
    .sort((a, b) => b.progress - a.progress)
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      name: player.name,
      avatar: player.avatar,
      progress: player.progress,
      isWinner: index === 0 && player.progress >= RACE_CONFIG.finishLine
    }));
};

// Get winner
export const getWinner = (players) => {
  const winner = Object.values(players)
    .find(player => player.progress >= RACE_CONFIG.finishLine);
  return winner || null;
};

// Race Engine Class for managing race state
export class RaceEngine {
  constructor(onUpdate, onFinish) {
    this.players = {};
    this.isRunning = false;
    this.lastTick = null;
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.modifiers = {}; // Player modifiers { playerId: { boost: true, multiplier: 1.5 } }
    this.intervalId = null;
  }

  // Initialize players
  setPlayers(players) {
    this.players = { ...players };
    Object.keys(this.players).forEach(id => {
      this.players[id].progress = 0;
      this.players[id].speed = RACE_CONFIG.baseSpeed;
    });
  }

  // Start the race
  start() {
    this.isRunning = true;
    this.lastTick = Date.now();
    this.tick();
  }

  // Stop the race
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  // Set a modifier for a player
  setModifier(playerId, modifier) {
    this.modifiers[playerId] = { ...this.modifiers[playerId], ...modifier };
  }

  // Clear modifiers for a player
  clearModifiers(playerId) {
    delete this.modifiers[playerId];
  }

  // Main game tick
  tick() {
    if (!this.isRunning) return;

    const now = Date.now();
    const deltaTime = now - this.lastTick;
    this.lastTick = now;

    // Update each player's progress
    Object.keys(this.players).forEach(playerId => {
      if (!this.players[playerId].connected) return;
      
      const player = this.players[playerId];
      const modifiers = this.modifiers[playerId] || {};
      const speed = calculateSpeed(player.speed, modifiers);
      const newProgress = updateProgress(player.progress, speed, deltaTime);
      
      this.players[playerId].progress = newProgress;
    });

    // Notify update
    if (this.onUpdate) {
      this.onUpdate({ ...this.players });
    }

    // Check for winner
    if (isRaceFinished(this.players)) {
      this.isRunning = false;
      const winner = getWinner(this.players);
      const rankings = getRankings(this.players);
      if (this.onFinish) {
        this.onFinish(winner, rankings);
      }
      return;
    }

    // Schedule next tick
    this.intervalId = setTimeout(() => this.tick(), RACE_CONFIG.tickInterval);
  }

  // Update a specific player's speed (from external input like taps)
  updatePlayerSpeed(playerId, speed) {
    if (this.players[playerId]) {
      this.players[playerId].speed = Math.max(RACE_CONFIG.minSpeed, Math.min(RACE_CONFIG.maxSpeed, speed));
    }
  }

  // Get current state
  getState() {
    return {
      players: { ...this.players },
      isRunning: this.isRunning,
      rankings: getRankings(this.players)
    };
  }
}

export default RaceEngine;
