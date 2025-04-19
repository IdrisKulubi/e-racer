import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { ComponentTypes } from '../core/ComponentTypes';
import { CheckpointComponent } from '../components/CheckpointComponent';
import { LapCounterComponent } from '../components/LapCounterComponent';
import { TransformComponent } from '../components/TransformComponent';
import { NetworkIdentityComponent } from '../components/NetworkIdentityComponent';
import { NetworkMessageType } from './NetworkSystem';

/**
 * RaceSystem handles race logic including checkpoints, laps and positions
 */
export class RaceSystem extends System {
  // Race state
  private isRaceActive: boolean = false;
  private countdownActive: boolean = false;
  private countdownTime: number = 3; // seconds
  private countdownTimer: number = 0;
  private lastCountdownTick: number = -1; // Add state to track last emitted second
  
  // Player tracking
  private playerRankings: string[] = []; // entityIds in race position order
  private finishedPlayers: string[] = []; // entityIds of finished players
  
  // Race configuration
  private totalLaps: number = 3;
  private checkpoints: Entity[] = [];
  
  // Callbacks
  private onRaceStart: (() => void) | null = null;
  private onRaceEnd: (() => void) | null = null;
  private onCountdownTick: ((secondsRemaining: number) => void) | null = null;
  private onCheckpointPassed: ((entityId: string, checkpointIndex: number) => void) | null = null;
  private onLapCompleted: ((entityId: string, lapNumber: number, lapTime: number) => void) | null = null;
  
  /**
   * Initialize the race system
   */
  override init(): void {
    // This would be called by the World
  }
  
  /**
   * Set race configuration
   */
  configure(totalLaps: number): void {
    this.totalLaps = totalLaps;
    console.log(`[RaceSystem] Configured with ${totalLaps} laps.`);
  }
  
  /**
   * Start countdown before race
   */
  startCountdown(): void {
    if (this.isRaceActive || this.countdownActive) return;
    
    this.countdownActive = true;
    this.countdownTimer = this.countdownTime;
    this.lastCountdownTick = -1; // Reset last tick tracker
    
    // Immediately trigger the first tick if needed
    const initialSeconds = Math.ceil(this.countdownTimer);
    if (this.onCountdownTick && initialSeconds > 0) {
       this.onCountdownTick(initialSeconds);
       this.lastCountdownTick = initialSeconds;
    }
  }
  
  /**
   * Start the race
   */
  startRace(): void {
    if (this.isRaceActive) return;
    console.log('[RaceSystem] startRace() called.'); // Log entry
    
    this.isRaceActive = true;
    this.countdownActive = false;
    this.playerRankings = [];
    this.finishedPlayers = [];
    
    // Reset all checkpoints
    for (const checkpoint of this.checkpoints) {
      const checkpointComponent = checkpoint.getComponent<CheckpointComponent>(ComponentTypes.CHECKPOINT);
      if (checkpointComponent) {
        checkpointComponent.resetAll();
      }
    }
    
    // Initialize lap counters for all vehicles
    if (this.world) {
      const racers = this.world.getEntitiesWithComponents([ComponentTypes.LAP_COUNTER, ComponentTypes.VEHICLE]);
      for (const racer of racers) {
        const lapCounter = racer.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
        if (lapCounter) {
          lapCounter.startRace();
          
          // Add to rankings
          this.playerRankings.push(racer.id);
        }
      }
    }
    
    // Trigger callback
    if (this.onRaceStart) {
      console.log('[RaceSystem] Invoking onRaceStart callback.'); // Log callback invocation
      this.onRaceStart();
    } else {
      console.warn('[RaceSystem] onRaceStart callback is null in startRace.'); // Log if callback missing
    }
  }
  
  /**
   * End the race
   */
  endRace(): void {
    if (!this.isRaceActive) return;
    
    this.isRaceActive = false;
    
    // Stop all racers
    if (this.world) {
      const racers = this.world.getEntitiesWithComponents([ComponentTypes.LAP_COUNTER]);
      for (const racer of racers) {
        const lapCounter = racer.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
        if (lapCounter) {
          lapCounter.finishRace();
        }
      }
    }
    
    // Trigger callback
    if (this.onRaceEnd) {
      this.onRaceEnd();
    }
  }
  
  /**
   * Process countdown timer
   */
  private updateCountdown(deltaTime: number): void {
    if (!this.countdownActive) return;
    console.log(`[RaceSystem] updateCountdown called. Timer: ${this.countdownTimer}, Delta: ${deltaTime}`); // Log entry
    
    this.countdownTimer -= deltaTime;
    
    const secondsRemaining = Math.ceil(this.countdownTimer);
    console.log(`[RaceSystem] Timer now: ${this.countdownTimer}, Seconds Remaining: ${secondsRemaining}`); // Log timer state
    
    if (secondsRemaining <= 0) {
      console.log(`[RaceSystem] Countdown finished (<= 0). Current countdownActive: ${this.countdownActive}`); // Log finish condition met
      if (this.countdownActive) {
          console.log('[RaceSystem] Setting countdownActive = false and calling startRace()'); // Log action
          this.countdownActive = false;
          // Optionally emit 0 or 'Go!' tick if desired
          // if (this.onCountdownTick) {
          //   this.onCountdownTick(0); // Or handle a 'Go!' message
          // }
          this.startRace();
      } else {
         console.warn('[RaceSystem] Countdown finished, but countdownActive was already false.'); // Log unexpected state
      }
    } else if (secondsRemaining !== this.lastCountdownTick) {
      console.log(`[RaceSystem] Tick changed. Emitting ${secondsRemaining}`); // Log tick change
      if (this.onCountdownTick) {
        this.onCountdownTick(secondsRemaining);
      }
      this.lastCountdownTick = secondsRemaining;
    }
  }
  
  /**
   * Check for checkpoint collisions
   */
  private checkCheckpoints(): void {
    if (!this.isRaceActive || !this.world) return;
    
    // Get all racers
    const racers = this.world.getEntitiesWithComponents([
      ComponentTypes.VEHICLE,
      ComponentTypes.TRANSFORM,
      ComponentTypes.LAP_COUNTER
    ]);
    
    // Check each racer against each checkpoint
    for (const racer of racers) {
      const transform = racer.getComponent<TransformComponent>(ComponentTypes.TRANSFORM);
      const lapCounter = racer.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
      
      if (!transform || !lapCounter) continue;
      
      // Make sure lap counter has the right number of checkpoints
      if (lapCounter.totalCheckpoints !== this.checkpoints.length && this.checkpoints.length > 0) {
        console.log(`[RaceSystem] Correcting entity ${racer.id} checkpoint count: ${lapCounter.totalCheckpoints} → ${this.checkpoints.length}`);
        lapCounter.totalCheckpoints = this.checkpoints.length;
      }
      
      for (const checkpoint of this.checkpoints) {
        const checkpointComponent = checkpoint.getComponent<CheckpointComponent>(ComponentTypes.CHECKPOINT);
        
        if (!checkpointComponent) continue;
        
        // Check if racer passed through checkpoint
        const passed = checkpointComponent.checkVehiclePassing(racer.id, transform.position);
        
        if (passed) {
          const timestamp = performance.now();
          const checkpointIndex = checkpointComponent.index;
          
          // Record checkpoint in lap counter
          const validCheckpoint = lapCounter.passCheckpoint(checkpointIndex, timestamp);
          
          if (validCheckpoint) {
            // Passed valid checkpoint
            if (this.onCheckpointPassed) {
              this.onCheckpointPassed(racer.id, checkpointIndex);
            }
            
            // Check if this was the finish line (checkpoint 0)
            if (checkpointIndex === 0 && lapCounter.currentLap > 1) {
              const previousLap = lapCounter.currentLap - 1;
              const lapData = lapCounter.lapHistory.find(lap => lap.lapNumber === previousLap);
              
              if (lapData && this.onLapCompleted) {
                this.onLapCompleted(racer.id, previousLap, lapData.duration);
              }
              
              // Check if race is complete
              if (lapCounter.currentLap > lapCounter.totalLaps) {
                this.playerFinish(racer.id);
              }
            }
          }
        }
      }
    }
  }
  
  /**
   * Update player rankings based on progress
   */
  private updateRankings(): void {
    if (!this.isRaceActive || !this.world) return;
    
    // Get all racers
    const racers = this.world.getEntitiesWithComponents([
      ComponentTypes.LAP_COUNTER,
      ComponentTypes.TRANSFORM
    ]);
    
    // Filter out finished players
    const activeRacers = racers.filter(racer => 
      !this.finishedPlayers.includes(racer.id)
    );
    
    // Sort active racers by progress
    activeRacers.sort((a, b) => {
      const lapCounterA = a.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
      const lapCounterB = b.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
      
      if (!lapCounterA || !lapCounterB) return 0;
      
      // First sort by lap number
      if (lapCounterA.currentLap !== lapCounterB.currentLap) {
        return lapCounterB.currentLap - lapCounterA.currentLap;
      }
      
      // Then by checkpoint
      if (lapCounterA.currentCheckpoint !== lapCounterB.currentCheckpoint) {
        return lapCounterB.currentCheckpoint - lapCounterA.currentCheckpoint;
      }
      
      // If same checkpoint, sort by distance to next checkpoint
      // (This would be more sophisticated in a real implementation)
      return 0;
    });
    
    // Update rankings array with finished players at the front
    this.playerRankings = [...this.finishedPlayers, ...activeRacers.map(racer => racer.id)];
  }
  
  /**
   * Record player finishing the race
   */
  private playerFinish(entityId: string): void {
    // Skip if already finished
    if (this.finishedPlayers.includes(entityId)) return;
    
    // Add to finished players
    this.finishedPlayers.push(entityId);
    
    // Update rankings
    this.updateRankings();
    
    // Check if all players have finished
    if (this.world) {
      const racers = this.world.getEntitiesWithComponents([ComponentTypes.LAP_COUNTER]);
      if (racers.length === this.finishedPlayers.length) {
        // All players finished
        this.endRace();
      }
    }
  }
  
  /**
   * Register checkpoints with the race system
   */
  registerCheckpoints(): void {
    if (!this.world) return;
    
    // Get all checkpoint entities
    this.checkpoints = this.world.getEntitiesWithComponents([
      ComponentTypes.CHECKPOINT,
      ComponentTypes.TRANSFORM
    ]);
    
    // Sort checkpoints by index
    this.checkpoints.sort((a, b) => {
      const checkpointA = a.getComponent<CheckpointComponent>(ComponentTypes.CHECKPOINT);
      const checkpointB = b.getComponent<CheckpointComponent>(ComponentTypes.CHECKPOINT);
      
      if (!checkpointA || !checkpointB) return 0;
      return checkpointA.index - checkpointB.index;
    });
    
    console.log(`[RaceSystem] Registered ${this.checkpoints.length} checkpoints.`);
    
    // Update any existing car entities with the correct checkpoint count
    if (this.world) {
      const racers = this.world.getEntitiesWithComponents([ComponentTypes.LAP_COUNTER]);
      for (const racer of racers) {
        const lapCounter = racer.getComponent<LapCounterComponent>(ComponentTypes.LAP_COUNTER);
        if (lapCounter) {
          if (lapCounter.totalCheckpoints !== this.checkpoints.length && this.checkpoints.length > 0) {
            console.log(`[RaceSystem] Updating entity ${racer.id} checkpoint count from ${lapCounter.totalCheckpoints} to ${this.checkpoints.length}`);
            lapCounter.totalCheckpoints = this.checkpoints.length;
          }
        }
      }
    }
  }
  
  /**
   * Get player's current race position (1-based)
   */
  getPlayerPosition(entityId: string): number {
    const position = this.playerRankings.indexOf(entityId);
    return position === -1 ? this.playerRankings.length + 1 : position + 1;
  }
  
  /**
   * Get whether the race is active
   */
  isRaceInProgress(): boolean {
    return this.isRaceActive;
  }
  
  /**
   * Get countdown status
   */
  isCountdownActive(): boolean {
    return this.countdownActive;
  }
  
  /**
   * System update
   */
  override update(deltaTime: number): void {
    console.log(`[RaceSystem] update called. DeltaTime: ${deltaTime}`); // Log entry
    // Update countdown if active
    this.updateCountdown(deltaTime);
    
    // Process checkpoint collisions
    this.checkCheckpoints();
    
    // Update player rankings
    if (this.isRaceActive) {
      this.updateRankings();
    }
  }
  
  /**
   * Set race start callback
   */
  setOnRaceStart(callback: () => void): void {
    this.onRaceStart = callback;
  }
  
  /**
   * Set race end callback
   */
  setOnRaceEnd(callback: () => void): void {
    this.onRaceEnd = callback;
  }
  
  /**
   * Set countdown tick callback
   */
  setOnCountdownTick(callback: (secondsRemaining: number) => void): void {
    this.onCountdownTick = callback;
  }
  
  /**
   * Set checkpoint passed callback
   */
  setOnCheckpointPassed(callback: (entityId: string, checkpointIndex: number) => void): void {
    this.onCheckpointPassed = callback;
  }
  
  /**
   * Set lap completed callback
   */
  setOnLapCompleted(callback: (entityId: string, lapNumber: number, lapTime: number) => void): void {
    this.onLapCompleted = callback;
  }
} 