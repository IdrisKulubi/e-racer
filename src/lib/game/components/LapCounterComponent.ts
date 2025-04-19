import { Component } from '../core/Component';
import { ComponentTypes } from '../core/ComponentTypes';

/**
 * Interface for lap time data
 */
export interface LapData {
  lapNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  checkpointTimes: Map<number, number>; // Checkpoint index to time
  valid: boolean; // Whether all checkpoints were passed
}

/**
 * LapCounterComponent tracks lap progress and times for a vehicle
 */
export class LapCounterComponent extends Component {
  type = ComponentTypes.LAP_COUNTER;
  
  // Lap state
  currentLap: number = 0;
  totalLaps: number = 3;
  lapStartTime: number = 0;
  isRacing: boolean = false;
  
  // Checkpoint tracking
  currentCheckpoint: number = 0;
  totalCheckpoints: number = 0;
  checkpointPassing: Map<number, number> = new Map(); // Checkpoint index to timestamp
  
  // Lap history
  lapHistory: LapData[] = [];
  bestLapTime: number | null = null;
  
  constructor(totalLaps: number = 3, totalCheckpoints: number = 0) {
    super();
    this.totalLaps = totalLaps;
    this.totalCheckpoints = totalCheckpoints;
  }
  
  /**
   * Start the race
   */
  startRace(): void {
    this.isRacing = true;
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.checkpointPassing.clear();
    this.lapHistory = [];
    this.bestLapTime = null;
    this.lapStartTime = performance.now();
    
    console.log(`[LapCounter] Race started. Total checkpoints: ${this.totalCheckpoints}, Total laps: ${this.totalLaps}`);
  }
  
  /**
   * Record checkpoint passing
   */
  passCheckpoint(checkpointIndex: number, timestamp: number): boolean {
    // Skip if not racing
    if (!this.isRacing) {
      console.log(`[LapCounter] Not racing - checkpoint ${checkpointIndex} ignored`);
      return false;
    }
    
    // Special handling for debugging
    if (this.totalCheckpoints === 0) {
      console.error(`[LapCounter] ERROR: totalCheckpoints is 0 - this will prevent lap completion!`);
      this.totalCheckpoints = 5; // Emergency auto-fix
    }
    
    // Check if this is the expected next checkpoint
    const expectedNext = (this.currentCheckpoint + 1) % this.totalCheckpoints;
    const isNextCheckpoint = checkpointIndex === expectedNext;
    
    // Check if this is the start/finish line (checkpoint 0)
    const isStartFinish = checkpointIndex === 0;
    
    console.log(`[LapCounter] Checkpoint passed: ${checkpointIndex}, Current: ${this.currentCheckpoint}, Expected Next: ${expectedNext}, Total: ${this.totalCheckpoints}, IsNext: ${isNextCheckpoint}, IsStartFinish: ${isStartFinish}`);
    
    // Record the checkpoint passing regardless (for stats)
    this.checkpointPassing.set(checkpointIndex, timestamp);
    
    if (isStartFinish && this.currentCheckpoint === this.totalCheckpoints - 1) {
      // Completed a lap by crossing start/finish after last checkpoint
      console.log(`[LapCounter] LAP COMPLETED! Current lap: ${this.currentLap}, Time: ${timestamp - this.lapStartTime}ms`);
      this.completeLap(timestamp);
      return true;
    } else if (isNextCheckpoint) {
      // Passed the expected next checkpoint
      console.log(`[LapCounter] Checkpoint ${checkpointIndex} recorded (was expected next)`);
      this.currentCheckpoint = checkpointIndex;
      return true;
    } else if (isStartFinish && this.checkpointPassing.size >= this.totalCheckpoints - 1) {
      // Crossed finish line and we have passed most checkpoints - be lenient and allow lap completion
      console.log(`[LapCounter] START/FINISH passed with ${this.checkpointPassing.size}/${this.totalCheckpoints} checkpoints - being lenient and completing lap`);
      this.completeLap(timestamp);
      return true;
    } else {
      console.log(`[LapCounter] Checkpoint ${checkpointIndex} recorded but not the expected next (${expectedNext})`);
      // Still update currentCheckpoint for non-sequential checkpoint systems
      if (checkpointIndex > this.currentCheckpoint || 
          (this.currentCheckpoint === this.totalCheckpoints - 1 && checkpointIndex === 0)) {
        this.currentCheckpoint = checkpointIndex;
      }
    }
    
    return false;
  }
  
  /**
   * Complete the current lap
   */
  private completeLap(timestamp: number): void {
    // Calculate lap time
    const lapTime = timestamp - this.lapStartTime;
    
    // Create lap data
    const lapData: LapData = {
      lapNumber: this.currentLap,
      startTime: this.lapStartTime,
      endTime: timestamp,
      duration: lapTime,
      checkpointTimes: new Map(this.checkpointPassing),
      valid: this.validateLap()
    };
    
    // Add to history
    this.lapHistory.push(lapData);
    
    // Update best lap time
    if (lapData.valid && (this.bestLapTime === null || lapTime < this.bestLapTime)) {
      this.bestLapTime = lapTime;
    }
    
    // Prepare for next lap or finish race
    this.currentLap++;
    if (this.currentLap > this.totalLaps) {
      // Race complete
      this.finishRace();
    } else {
      // Start next lap
      this.lapStartTime = timestamp;
      this.currentCheckpoint = 0;
      this.checkpointPassing.clear();
    }
  }
  
  /**
   * Validate that all checkpoints were passed this lap
   */
  private validateLap(): boolean {
    // Check if all checkpoints were hit
    for (let i = 0; i < this.totalCheckpoints; i++) {
      if (!this.checkpointPassing.has(i)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Finish the race
   */
  finishRace(): void {
    this.isRacing = false;
  }
  
  /**
   * Get the current lap time
   */
  getCurrentLapTime(): number {
    if (!this.isRacing) return 0;
    return performance.now() - this.lapStartTime;
  }
  
  /**
   * Get the total race time
   */
  getTotalRaceTime(): number {
    if (this.lapHistory.length === 0) return 0;
    
    const firstLapStart = this.lapHistory[0].startTime;
    if (!this.isRacing) {
      // Race is finished, use the end time of the last lap
      const lastLap = this.lapHistory[this.lapHistory.length - 1];
      return lastLap.endTime - firstLapStart;
    }
    
    // Race is still ongoing, use current time
    return performance.now() - firstLapStart;
  }
  
  /**
   * Format time in mm:ss.ms format
   */
  static formatTime(timeMs: number): string {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
} 