// Button Mash Mode - Tap frequency increases speed

import { TRACK_LENGTH_CONFIG } from '../core/raceEngine';

export const BUTTON_MASH_CONFIG = {
  baseTapSpeed: 0.5, // Base speed with no taps
  maxTapSpeed: 3.0, // Maximum speed with rapid tapping
  tapDecay: 0.95, // How quickly tap momentum decays each tick
  tapBoost: 0.15, // Speed boost per tap
  staminaEnabled: true, // Whether stamina/overheat is enabled
  maxStamina: 100,
  staminaDrainPerTap: 2, // Stamina cost per tap
  staminaRecoveryRate: 1, // Stamina recovery per tick (when not tapping)
  overheatThreshold: 0, // If stamina reaches this, temporary lockout
  overheatRecoveryTime: 2000, // ms to recover from overheat
  syncInterval: 200 // ms between sending tap data to server
};

// Button Mash Mode Controller
export class ButtonMashMode {
  constructor(playerId, onSpeedUpdate, onStaminaUpdate, trackLength = 6) {
    this.playerId = playerId;
    this.onSpeedUpdate = onSpeedUpdate;
    this.onStaminaUpdate = onStaminaUpdate;
    this.trackLength = trackLength;
    this.tapTarget = TRACK_LENGTH_CONFIG[trackLength]?.tapTarget || 300;
    this.tapMomentum = 0;
    this.stamina = BUTTON_MASH_CONFIG.maxStamina;
    this.isOverheated = false;
    this.lastTapTime = 0;
    this.tapCount = 0;
    this.isActive = false;
    this.tickIntervalId = null;
    this.syncIntervalId = null;
    this.pendingTaps = 0;
  }

  start() {
    this.isActive = true;
    this.tapMomentum = 0;
    this.stamina = BUTTON_MASH_CONFIG.maxStamina;
    this.isOverheated = false;
    this.tapCount = 0;

    // Start tick loop for decay and recovery
    this.tickIntervalId = setInterval(() => this.tick(), 100);

    // Start sync loop
    this.syncIntervalId = setInterval(() => this.sync(), BUTTON_MASH_CONFIG.syncInterval);
  }

  stop() {
    this.isActive = false;
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  tap() {
    if (!this.isActive || this.isOverheated) return;

    const now = Date.now();
    
    // Check stamina
    if (BUTTON_MASH_CONFIG.staminaEnabled) {
      if (this.stamina <= BUTTON_MASH_CONFIG.overheatThreshold) {
        this.overheat();
        return;
      }
      this.stamina = Math.max(0, this.stamina - BUTTON_MASH_CONFIG.staminaDrainPerTap);
    }

    // Add tap momentum
    this.tapMomentum = Math.min(
      BUTTON_MASH_CONFIG.maxTapSpeed - BUTTON_MASH_CONFIG.baseTapSpeed,
      this.tapMomentum + BUTTON_MASH_CONFIG.tapBoost
    );
    this.tapCount++;
    this.pendingTaps++;
    this.lastTapTime = now;

    // Notify speed update
    this.notifySpeed();
    this.notifyStamina();
  }

  tick() {
    if (!this.isActive) return;

    // Decay tap momentum
    this.tapMomentum *= BUTTON_MASH_CONFIG.tapDecay;
    if (this.tapMomentum < 0.01) {
      this.tapMomentum = 0;
    }

    // Recover stamina when not tapping
    if (BUTTON_MASH_CONFIG.staminaEnabled && !this.isOverheated) {
      const timeSinceLastTap = Date.now() - this.lastTapTime;
      if (timeSinceLastTap > 200) { // Start recovery after 200ms of no tapping
        this.stamina = Math.min(
          BUTTON_MASH_CONFIG.maxStamina,
          this.stamina + BUTTON_MASH_CONFIG.staminaRecoveryRate
        );
        this.notifyStamina();
      }
    }

    this.notifySpeed();
  }

  sync() {
    // Sync tap count to server periodically
    if (this.pendingTaps > 0) {
      // This would be called to sync with the server
      this.pendingTaps = 0;
    }
  }

  overheat() {
    this.isOverheated = true;
    this.tapMomentum = 0;

    // Recover after overheat time
    setTimeout(() => {
      this.isOverheated = false;
      this.stamina = BUTTON_MASH_CONFIG.maxStamina * 0.5; // Recover to 50%
      this.notifyStamina();
    }, BUTTON_MASH_CONFIG.overheatRecoveryTime);

    this.notifySpeed();
    this.notifyStamina();
  }

  getCurrentSpeed() {
    if (this.isOverheated) return BUTTON_MASH_CONFIG.baseTapSpeed * 0.5;
    return BUTTON_MASH_CONFIG.baseTapSpeed + this.tapMomentum;
  }

  // Get progress as percentage based on taps towards target
  getProgress() {
    return Math.min(100, (this.tapCount / this.tapTarget) * 100);
  }

  getStamina() {
    return {
      current: this.stamina,
      max: BUTTON_MASH_CONFIG.maxStamina,
      percentage: (this.stamina / BUTTON_MASH_CONFIG.maxStamina) * 100,
      isOverheated: this.isOverheated
    };
  }

  notifySpeed() {
    if (this.onSpeedUpdate) {
      this.onSpeedUpdate(this.getCurrentSpeed(), this.getProgress());
    }
  }

  notifyStamina() {
    if (this.onStaminaUpdate) {
      this.onStaminaUpdate(this.getStamina());
    }
  }

  getTapCount() {
    return this.tapCount;
  }

  getTapTarget() {
    return this.tapTarget;
  }
}

export default ButtonMashMode;
